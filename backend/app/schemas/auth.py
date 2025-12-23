"""
認證相關 Schema
"""
from typing import Optional
from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    """登入請求"""
    username: str = Field(..., description="用戶名")
    password: str = Field(..., description="密碼")


class ChangePasswordRequest(BaseModel):
    """修改密碼請求"""
    old_password: str = Field(..., description="舊密碼")
    new_password: str = Field(..., min_length=6, description="新密碼")


class Token(BaseModel):
    """Token 響應"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token 解碼後的數據"""
    sub: str  # 用戶 ID
    username: Optional[str] = None
    role: Optional[str] = None


class LoginResponse(BaseModel):
    """登入響應"""
    access_token: str
    token_type: str = "bearer"
    user: "AdminResponse"  # 前向引用


class LineCallbackParams(BaseModel):
    """LINE OAuth 回調參數"""
    code: str = Field(..., description="Authorization code")
    state: Optional[str] = Field(None, description="Event ID or custom state")


# 避免循環引用
from app.schemas.admin import AdminResponse
LoginResponse.model_rebuild()