from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# 基本 Schema
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="用戶名稱")
    email: str = Field(..., description="電子郵件地址")
    age: Optional[int] = Field(None, ge=0, le=150, description="年齡")


# 創建用戶的 DTO
class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="密碼")


# 更新用戶的 DTO
class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    age: Optional[int] = None


# 回應的 DTO
class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True  # 允許從 ORM 模型轉換
        json_schema_extra = {
            "example": {
                "id": 1,
                "username": "john_doe",
                "email": "john@example.com",
                "age": 30,
                "created_at": "2025-01-01T00:00:00"
            }
        }
