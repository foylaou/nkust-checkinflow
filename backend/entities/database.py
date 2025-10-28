from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from typing import AsyncGenerator
import asyncpg
import os
from dotenv import load_dotenv
import sys

load_dotenv()

# 讀取環境變數
username = os.getenv("DB_USERNAME")
password = os.getenv("DB_PASSWORD")
db_name = os.getenv("DB_NAME")
host = os.getenv("DB_HOST", "localhost")
port = os.getenv("DB_PORT", "5432")

# 檢查必要環境變數
if not all([username, password, db_name]):
    print("❌ 錯誤：缺少必要的環境變數 (DB_USERNAME, DB_PASSWORD, DB_NAME)")
    sys.exit(1)


async def create_database_if_not_exists():
    """檢查並建立資料庫（異步版本）"""
    print(f"📍 檢查資料庫: {db_name}")

    try:
        # 先連接到預設的 postgres 資料庫檢查目標資料庫是否存在
        conn = await asyncpg.connect(
            user=username,
            password=password,
            host=host,
            port=port,
            database='postgres'
        )

        # 檢查資料庫是否存在
        exists = await conn.fetchval(
            'SELECT 1 FROM pg_database WHERE datname = $1',
            db_name
        )

        if not exists:
            print(f"⚠️  資料庫 '{db_name}' 不存在，正在建立...")
            # 建立資料庫
            await conn.execute(f'CREATE DATABASE "{db_name}"')
            print(f"✅ 資料庫 '{db_name}' 建立成功")
        else:
            print(f"✅ 資料庫 '{db_name}' 已存在")

        await conn.close()

    except asyncpg.InvalidPasswordError:
        print(f"❌ 密碼錯誤：使用者 '{username}' 的密碼不正確", file=sys.stderr)
        sys.exit(1)
    except asyncpg.InvalidCatalogNameError:
        print(f"❌ 連接錯誤：預設資料庫 'postgres' 不存在", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"❌ 建立資料庫時發生錯誤: {str(e)}", file=sys.stderr)
        print(f"\n可能的原因：", file=sys.stderr)
        print(f"  1. PostgreSQL 服務未運行", file=sys.stderr)
        print(f"  2. 使用者名稱或密碼錯誤", file=sys.stderr)
        print(f"  3. 使用者 '{username}' 沒有建立資料庫的權限", file=sys.stderr)
        print(f"  4. 主機地址或端口錯誤 ({host}:{port})", file=sys.stderr)
        sys.exit(1)


# 使用 postgresql+asyncpg 驅動
SQLALCHEMY_DATABASE_URL = f"postgresql+asyncpg://{username}:{password}@{host}:{port}/{db_name}"

print(f"📍 使用 asyncpg 連接: postgresql://{username}:****@{host}:{port}/{db_name}")

# 建立異步引擎
engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=10,  # 連接池大小
    max_overflow=20,  # 最大溢出連接數
)

# 建立異步 Session
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()


# 異步依賴注入
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    異步資料庫 session 依賴注入
    使用方式：db: AsyncSession = Depends(get_db)
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# 初始化資料庫（建立所有表）
async def init_db():
    """初始化資料庫：建立資料庫和表"""
    # 先建立資料庫（如果不存在）
    await create_database_if_not_exists()
    print("執行初始化表")
    # 導入models模組以註冊所有的表
    try:
        from entities import models

    except ImportError:
        print("⚠️  找不到 models 模組，跳過表格建立")
        return

    async with engine.begin() as conn:
        # 印出將要建立的表
        print(f"📋 準備建立以下表格:")
        for table in Base.metadata.sorted_tables:
            print(f"   - {table.name}")

        await conn.run_sync(Base.metadata.create_all)

    print("✅ 資料庫表初始化完成")
    print("=" * 50)
    print("🎉 資料庫初始化完成")
    print("=" * 50)


# 關閉資料庫連接
async def close_db():
    """關閉資料庫引擎"""
    await engine.dispose()
    print("✅ 資料庫連接已關閉")


