"""
資料庫初始化腳本
創建所有表格
"""
import asyncio
import sys
from pathlib import Path

# 添加項目根目錄到 Python 路徑
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import init_db


async def main():
    """執行資料庫初始化"""
    print("=" * 50)
    print("開始初始化資料庫")
    print("=" * 50)

    try:
        await init_db()
        print("\n資料庫初始化成功！")
    except Exception as e:
        print(f"\n❌ 資料庫初始化失敗: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
