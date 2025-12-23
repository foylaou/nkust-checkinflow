"""
Checkin 相關 Schema
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class CheckinBase(BaseModel):
    """Checkin 基礎模型"""
    geolocation: Optional[str] = Field(None, description="地理位置")
    dynamic_data: Optional[dict] = Field(None, description="客製化欄位數據")


class CheckinCreate(CheckinBase):
    """創建 Checkin 請求"""
    user_id: int = Field(..., description="用戶 ID")
    event_id: str = Field(..., description="活動 ID")
    profile_data: Optional[dict] = Field(None, description="基本資料擴充數據 (選填)")


class CheckinUpdate(BaseModel):
    """更新 Checkin 請求（簽退）"""
    checkout_time: datetime = Field(..., description="簽退時間")


class UserInfo(BaseModel):
    """用戶基本信息"""
    name: str
    phone: str
    company: str
    department: str


class CheckinResponse(CheckinBase):
    """Checkin 響應"""
    id: int
    user_id: int
    event_id: str
    checkin_time: datetime
    checkout_time: Optional[datetime] = None
    status: str
    is_valid: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CheckinWithUser(CheckinResponse):
    """帶用戶信息的 Checkin 響應"""
    user: UserInfo


class CheckinListResponse(BaseModel):
    """Checkin 列表響應"""
    checkins: list[CheckinWithUser]


class CheckinValidateRequest(BaseModel):
    """驗證簽到資格請求"""
    user_id: int = Field(..., description="用戶 ID")
    event_id: str = Field(..., description="活動 ID")


class CheckinValidateResponse(BaseModel):
    """驗證簽到資格響應"""
    valid: bool = Field(description="是否可以簽到")
    message: str = Field(description="提示訊息")
    user: Optional[UserInfo] = None
    checkin: Optional["CheckinResponse"] = Field(None, description="當前簽到記錄（如果已簽到）")
