import asyncio
import os
import sys

# 將專案根目錄加入 sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database.connection import engine

async def migrate():
    print("開始遷移：新增範本類型與調查觸發時機欄位...")
    
    async with engine.begin() as conn:
        # 1. Add 'type' column
        # Options: 'registration' (default), 'survey', 'profile_extension'
        try:
            await conn.execute(text("ALTER TABLE registration_templates ADD COLUMN type VARCHAR(50) DEFAULT 'registration'"))
            print("Added 'type' column.")
        except Exception as e:
            if "duplicate column" in str(e).lower():
                print("Column 'type' already exists.")
            else:
                print(f"Adding 'type' column failed: {e}")

        # 2. Add 'survey_trigger' column
        # Options: 'course_start', 'course_end', NULL
        try:
            await conn.execute(text("ALTER TABLE registration_templates ADD COLUMN survey_trigger VARCHAR(50) DEFAULT NULL"))
            print("Added 'survey_trigger' column.")
        except Exception as e:
            if "duplicate column" in str(e).lower():
                print("Column 'survey_trigger' already exists.")
            else:
                print(f"Adding 'survey_trigger' column failed: {e}")
            
    print("遷移完成！")

if __name__ == "__main__":
    asyncio.run(migrate())
