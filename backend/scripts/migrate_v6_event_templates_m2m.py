import asyncio
import os
import sys

# 將專案根目錄加入 sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database.connection import engine

async def migrate():
    print("開始遷移：建立活動與範本的多對多關聯表...")
    
    async with engine.begin() as conn:
        # 建立關聯表
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS event_template_association (
                event_id VARCHAR(36) REFERENCES events(id) ON DELETE CASCADE,
                template_id VARCHAR(36) REFERENCES registration_templates(id) ON DELETE CASCADE,
                PRIMARY KEY (event_id, template_id)
            )
        """))
        print("Created 'event_template_association' table.")

        # 將原本單一欄位的資料遷移到新表 (如果有的話)
        await conn.execute(text("""
            INSERT INTO event_template_association (event_id, template_id)
            SELECT id, template_id FROM events WHERE template_id IS NOT NULL
            ON CONFLICT DO NOTHING
        """))
        await conn.execute(text("""
            INSERT INTO event_template_association (event_id, template_id)
            SELECT id, survey_start_template_id FROM events WHERE survey_start_template_id IS NOT NULL
            ON CONFLICT DO NOTHING
        """))
        await conn.execute(text("""
            INSERT INTO event_template_association (event_id, template_id)
            SELECT id, survey_end_template_id FROM events WHERE survey_end_template_id IS NOT NULL
            ON CONFLICT DO NOTHING
        """))
        await conn.execute(text("""
            INSERT INTO event_template_association (event_id, template_id)
            SELECT id, profile_extension_template_id FROM events WHERE profile_extension_template_id IS NOT NULL
            ON CONFLICT DO NOTHING
        """))
        print("Migrated existing template references to association table.")
            
    print("遷移完成！")

if __name__ == "__main__":
    asyncio.run(migrate())
