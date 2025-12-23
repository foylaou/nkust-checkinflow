"""
全局依賴注入
提供認證、權限檢查等通用依賴
"""
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import Admin, User
from app.core.security import decode_access_token


# HTTP Bearer 認證方案
security = HTTPBearer()


async def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Admin:
    """
    獲取當前認證的管理員

    依賴注入使用範例:
    ```python
    @router.get("/protected")
    async def protected_route(admin: Admin = Depends(get_current_admin)):
        return {"admin_id": admin.id}
    ```
    """
    token = credentials.credentials

    # 解碼 token
    payload = decode_access_token(token)

    # 獲取管理員 ID
    admin_id = payload.get("sub")
    if not admin_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="無效的認證憑證"
        )

    # 從資料庫查詢管理員
    result = await db.execute(
        select(Admin).where(Admin.id == int(admin_id))
    )
    admin = result.scalar_one_or_none()

    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用戶不存在"
        )

    return admin


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    獲取當前認證的普通用戶（LINE 用戶）

    用於需要用戶登入的端點
    """
    token = credentials.credentials

    # 解碼 token
    payload = decode_access_token(token)

    # 獲取用戶 ID
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="無效的認證憑證"
        )

    # 從資料庫查詢用戶
    result = await db.execute(
        select(User).where(User.id == int(user_id))
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用戶不存在"
        )

    return user


async def get_optional_current_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: AsyncSession = Depends(get_db)
) -> Optional[Admin]:
    """
    獲取當前管理員（可選）

    如果沒有提供 token 或 token 無效，返回 None 而不是拋出異常
    用於某些端點既允許訪客訪問，也允許管理員訪問的情況
    """
    if not credentials:
        return None

    try:
        token = credentials.credentials
        payload = decode_access_token(token)
        admin_id = payload.get("sub")

        if admin_id:
            result = await db.execute(
                select(Admin).where(Admin.id == int(admin_id))
            )
            return result.scalar_one_or_none()
    except:
        pass

    return None


def require_system_admin(admin: Admin = Depends(get_current_admin)) -> Admin:
    """
    要求系統管理員權限

    用於只有系統管理員才能訪問的端點
    """
    if admin.name != "系統管理員":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要系統管理員權限"
        )

    return admin
