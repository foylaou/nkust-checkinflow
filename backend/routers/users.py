from fastapi import APIRouter, HTTPException, status, Query, Path, Body
from typing import List, Optional
from datetime import datetime
from backend.dto.userdto import UserResponse, UserUpdate, UserCreate

router = APIRouter(prefix="/api/v1/users", tags=["用戶管理"])


@router.post(
    "/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="創建新用戶",
    description="創建一個新的用戶帳號",
    response_description="成功創建的用戶信息",
)
async def create_user(
        user: UserCreate = Body(..., description="用戶創建資料")
):
    """
    創建用戶的詳細說明：
    - **username**: 必填，3-50字符
    - **email**: 必填，有效的電子郵件格式
    - **password**: 必填，至少8個字符
    - **age**: 選填，0-150之間
    """
    return {"id": 1, **user.dict(), "created_at": datetime.now()}


@router.get(
    "/",
    response_model=List[UserResponse],
    summary="獲取用戶列表",
    description="獲取所有用戶，支持分頁"
)
async def get_users(
        skip: int = Query(0, ge=0, description="跳過的記錄數"),
        limit: int = Query(10, ge=1, le=100, description="返回的最大記錄數"),
        search: Optional[str] = Query(None, description="搜索關鍵字")
):
    """獲取用戶列表，可以進行分頁和搜索"""
    return []


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="獲取單個用戶",
    responses={
        200: {"description": "成功獲取用戶信息"},
        404: {"description": "用戶不存在"}
    }
)
async def get_user(
        user_id: int = Path(..., gt=0, description="用戶ID")
):
    """根據用戶ID獲取用戶詳細信息"""
    if user_id > 100:
        raise HTTPException(status_code=404, detail="用戶不存在")
    return {"id": user_id, "username": "test", "email": "test@test.com"}


@router.put(
    "/{user_id}",
    response_model=UserResponse,
    summary="更新用戶信息"
)
async def update_user(
        user_id: int = Path(..., gt=0),
        user: UserUpdate = Body(...)
):
    """更新用戶的部分或全部信息"""
    return {"id": user_id, **user.dict(exclude_unset=True)}


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="刪除用戶"
)
async def delete_user(user_id: int = Path(..., gt=0)):
    """刪除指定的用戶"""
    return None

