"""
資料庫遷移腳本：為 admins 表添加 is_active 欄位
"""
import asyncio
import sys
from pathlib import Path

# 添加項目根目錄到 Python 路徑
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import engine
from sqlalchemy import text


async def migrate():
    """執行資料庫遷移"""
    print("=" * 50)
    print("開始遷移資料庫：添加 is_active 欄位")
    print("=" * 50)

    migration_queries = [
        """
        ALTER TABLE admins
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
        """,
    ]

    try:
        async with engine.begin() as conn:
            for query in migration_queries:
                print(f"\n執行 SQL: {query.strip()}")
                await conn.execute(text(query))
                print("✅ 執行成功")

        print("\n" + "=" * 50)
        print("🎉 資料庫遷移成功！")
        print("=" * 50)

    except Exception as e:
        print(f"\n❌ 資料庫遷移失敗: {e}")
        sys.exit(1)


async def main():
    """主函數"""
    try:
        await migrate()
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())

