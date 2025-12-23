"""
資料庫遷移腳本：添加位置相關欄位
為 events 表添加 latitude, longitude, radius 欄位
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
    print("開始遷移資料庫：添加位置欄位")
    print("=" * 50)

    migration_queries = [
        """
        ALTER TABLE events
        ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
        """,
        """
        ALTER TABLE events
        ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
        """,
        """
        ALTER TABLE events
        ADD COLUMN IF NOT EXISTS radius INTEGER DEFAULT 100;
        """
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
        print("\n已添加的欄位：")
        print("  - latitude (DOUBLE PRECISION, nullable)")
        print("  - longitude (DOUBLE PRECISION, nullable)")
        print("  - radius (INTEGER, default=100)")

    except Exception as e:
        print(f"\n❌ 資料庫遷移失敗: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


async def verify():
    """驗證遷移結果"""
    print("\n" + "=" * 50)
    print("驗證遷移結果")
    print("=" * 50)

    try:
        async with engine.begin() as conn:
            result = await conn.execute(text("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = 'events'
                AND column_name IN ('latitude', 'longitude', 'radius')
                ORDER BY column_name;
            """))

            rows = result.fetchall()

            if not rows:
                print("⚠️  警告：未找到新添加的欄位")
                return False

            print("\n✅ 找到以下欄位：")
            for row in rows:
                print(f"  - {row[0]}: {row[1]} (nullable: {row[2]}, default: {row[3]})")

            return True

    except Exception as e:
        print(f"❌ 驗證失敗: {e}")
        return False


async def main():
    """主函數"""
    try:
        # 執行遷移
        await migrate()

        # 驗證結果
        success = await verify()

        if success:
            print("\n✅ 遷移和驗證都已完成")
        else:
            print("\n⚠️  遷移完成但驗證失敗，請手動檢查")

    finally:
        # 關閉連接
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
