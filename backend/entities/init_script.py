# entities/init_script.py
import asyncio
from sqlalchemy import text
from backend.entities.database import init_db, close_db, AsyncSessionLocal, Base


async def initdatabase():
    """主函數：測試資料庫連接和初始化"""
    try:
        # 導入 models
        from backend import entities as models

        print(f"📊 已註冊的表格數量: {len(Base.metadata.tables)}")
        print(f"📋 表格名稱: {list(Base.metadata.tables.keys())}")

        await init_db()

        # 驗證表格是否建立成功
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("""
                                                SELECT table_name
                                                FROM information_schema.tables
                                                WHERE table_schema = 'public'
                                                ORDER BY table_name
                                                """))
            tables = result.scalars().all()
            print(f"\n✅ 資料庫中實際建立的表格:")
            if tables:
                for table in tables:
                    print(f"   - {table}")
            else:
                print("   (無)")

    except Exception as e:
        print(f"❌ 錯誤: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await close_db()


if __name__ == "__main__":
    asyncio.run(initdatabase())
