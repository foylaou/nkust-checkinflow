"""
創建初始管理員帳號
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import Admin
from app.core.security import hash_password


async def create_admin(username: str, password: str, name: str):
    """創建管理員"""
    async with AsyncSessionLocal() as session:
        # 檢查是否已存在
        result = await session.execute(
            select(Admin).where(Admin.username == username)
        )
        existing_admin = result.scalar_one_or_none()

        if existing_admin:
            print(f"⚠️  管理員 '{username}' 已存在")
            return

        # 創建新管理員
        admin = Admin(
            username=username,
            password=hash_password(password),
            name=name
        )

        session.add(admin)
        await session.commit()

        print(f"✅ 管理員創建成功！")
        print(f"   用戶名: {username}")
        print(f"   角色: {name}")


async def main():
    """主函數"""
    print("=" * 50)
    print("創建初始管理員帳號")
    print("=" * 50)

    # 創建系統管理員
    await create_admin(
        username="admin",
        password="admin123",
        name="系統管理員"
    )

    # 創建普通管理員（可選）
    await create_admin(
        username="manager",
        password="manager123",
        name="管理員"
    )

    print("\n" + "=" * 50)
    print("初始帳號信息：")
    print("=" * 50)
    print("系統管理員:")
    print("  用戶名: admin")
    print("  密碼: admin123")
    print("\n普通管理員:")
    print("  用戶名: manager")
    print("  密碼: manager123")
    print("=" * 50)
    print("\n⚠️  請在生產環境中修改默認密碼！")


if __name__ == "__main__":
    asyncio.run(main())
