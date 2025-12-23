"""
資料庫遷移腳本：添加系列活動、範本與動態欄位支持
1. 為 events 表添加 visibility, series_id, template_id 欄位
2. 為 checkins 表添加 dynamic_data 欄位
3. 創建 registration_templates 表
"""
import asyncio
import sys
from pathlib import Path

# 添加項目根目錄到 Python 路徑
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import engine, init_db
from sqlalchemy import text


async def migrate():
    """執行資料庫遷移"""
    print("=" * 50)
    print("開始遷移資料庫：系列活動、範本與動態欄位")
    print("=" * 50)

    # 1. 首先運行 init_db 以創建新的表格 (registration_templates)
    print("\n[Step 1] 正在創建新表格...")
    await init_db()

    # 2. 為現有表格添加欄位
    print("\n[Step 2] 正在為現有表格添加欄位...")
    migration_queries = [
        # Events 表
        """
        ALTER TABLE events
        ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'public';
        """,
        """
        ALTER TABLE events
        ADD COLUMN IF NOT EXISTS series_id VARCHAR(36);
        """,
        """
        ALTER TABLE events
        ADD COLUMN IF NOT EXISTS template_id VARCHAR(36);
        """,
        # Checkins 表
        """
        ALTER TABLE checkins
        ADD COLUMN IF NOT EXISTS dynamic_data JSONB;
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
        import traceback
        traceback.print_exc()
        sys.exit(1)


async def main():
    """主函數"""
    try:
        await migrate()
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
