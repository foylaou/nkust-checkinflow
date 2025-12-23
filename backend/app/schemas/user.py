"""
User 相關 Schema
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator
import re


class UserBase(BaseModel):
    """User 基礎模型"""
    name: str = Field(..., min_length=1, description="姓名")
    phone: str = Field(..., description="手機號碼（台灣格式，09開頭10碼）")
    company: str = Field(..., min_length=1, description="公司")
    department: str = Field(..., min_length=1, description="部門")
    profile_data: dict = Field(default={}, description="基本資料擴充數據")

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: str) -> str:
        """驗證台灣手機號碼格式"""
        if not re.match(r'^09\d{8}$', v):
            raise ValueError('手機號碼格式錯誤，必須是09開頭的10碼數字')
        return v


class UserCreate(UserBase):
    """創建 User 請求"""
    line_user_id: str = Field(..., description="LINE User ID")


class UserUpdate(BaseModel):
    """更新 User 請求"""
    name: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    department: Optional[str] = None
    profile_data: Optional[dict] = None

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        """驗證台灣手機號碼格式"""
        if v and not re.match(r'^09\d{8}$', v):
            raise ValueError('手機號碼格式錯誤，必須是09開頭的10碼數字')
        return v


class UserResponse(UserBase):
    """User 響應"""
    id: int
    line_user_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """User 列表響應"""
    users: list[UserResponse]
