import asyncio
import os
import sys

# 將專案根目錄加入 sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database.connection import engine

async def migrate():
    print("開始遷移：新增使用者設定資料與活動多重表單範本...")
    
    async with engine.begin() as conn:
        # 1. Add 'profile_data' to users table
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN profile_data JSONB DEFAULT '{}'::jsonb"))
            print("Added 'profile_data' column to 'users'.")
        except Exception as e:
            if "duplicate column" in str(e).lower():
                print("Column 'profile_data' already exists.")
            else:
                print(f"Adding 'profile_data' column failed: {e}")

        # 2. Add extra template IDs to events table
        columns_to_add = [
            ("survey_start_template_id", "VARCHAR(36)"),
            ("survey_end_template_id", "VARCHAR(36)"),
            ("profile_extension_template_id", "VARCHAR(36)")
        ]
        
        for col_name, col_type in columns_to_add:
            try:
                await conn.execute(text(f"ALTER TABLE events ADD COLUMN {col_name} {col_type} REFERENCES registration_templates(id)"))
                print(f"Added '{col_name}' column to 'events'.")
            except Exception as e:
                if "duplicate column" in str(e).lower():
                    print(f"Column '{col_name}' already exists.")
                else:
                    print(f"Adding '{col_name}' column failed: {e}")
            
    print("遷移完成！")

if __name__ == "__main__":
    asyncio.run(migrate())
