"""
用戶相關 API 路由
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import User
from app.schemas.user import UserCreate, UserResponse, UserListResponse
from app.core.dependencies import get_current_admin

router = APIRouter(prefix="/api/users", tags=["用戶"])


@router.get("", response_model=UserListResponse, summary="獲取用戶列表")
async def get_users(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    獲取所有用戶列表

    權限: 需要管理員認證
    """
    result = await db.execute(select(User))
    users = result.scalars().all()

    return {"users": users}


@router.post("", response_model=UserResponse, summary="創建用戶（註冊）", status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    創建新用戶（LINE 用戶註冊）

    參數:
    - line_user_id: LINE User ID（唯一）
    - name: 姓名
    - phone: 手機號碼（09開頭10碼）
    - company: 公司
    - department: 部門

    無需認證（註冊端點）
    """
    # 檢查 LINE ID 是否已註冊
    result = await db.execute(
        select(User).where(User.line_user_id == user_data.line_user_id)
    )
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="此 LINE 帳號已註冊"
        )

    # 創建新用戶
    new_user = User(
        line_user_id=user_data.line_user_id,
        name=user_data.name,
        phone=user_data.phone,
        company=user_data.company,
        department=user_data.department
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user


@router.get("/{user_id}", response_model=UserResponse, summary="獲取用戶詳情")
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    獲取單個用戶詳情

    無需認證（用於驗證用戶存在）
    """
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用戶不存在"
        )

    return user
