"""
Admin 相關 Schema
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class AdminBase(BaseModel):
    """Admin 基礎模型"""
    username: str
    name: str


class AdminCreate(AdminBase):
    """創建 Admin 請求"""
    password: str = Field(..., min_length=6, description="密碼（至少6位）")


class AdminUpdate(BaseModel):
    """更新 Admin 請求"""
    password: Optional[str] = Field(None, min_length=6)
    name: Optional[str] = None


class AdminResponse(AdminBase):
    """Admin 響應"""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AdminListResponse(BaseModel):
    """Admin 列表響應"""
    admins: list[AdminResponse]
