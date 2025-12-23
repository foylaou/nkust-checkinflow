"""
Event 相關 Schema
"""
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field, field_validator

from app.schemas.registration_template import RegistrationTemplateResponse


class EventBase(BaseModel):
    """Event 基礎模型"""
    name: str = Field(..., min_length=1, description="活動名稱")
    description: Optional[str] = Field(None, description="活動描述")
    start_time: datetime = Field(..., description="開始時間")
    end_time: datetime = Field(..., description="結束時間")
    location: Optional[str] = Field(None, description="活動地點")
    latitude: Optional[float] = Field(None, description="緯度")
    longitude: Optional[float] = Field(None, description="經度")
    radius: int = Field(100, description="簽到半徑(公尺)")
    max_participants: Optional[int] = Field(None, ge=1, description="最大參與人數")
    event_type: str = Field(default="會議", description="活動類型")
    location_validation: bool = Field(default=False, description="是否需要位置驗證")
    require_checkout: bool = Field(default=False, description="是否需要簽退")
    checkout_mode: Optional[str] = Field(None, description="簽退模式: after_duration 或 at_end_time")
    checkout_duration: Optional[int] = Field(None, description="簽到後N分鐘才能簽退")
    visibility: str = Field(default="public", description="公開或私人: public 或 private")
    series_id: Optional[str] = Field(None, description="系列活動 ID")
    template_id: Optional[str] = Field(None, description="註冊表單範本 ID (舊)")
    survey_start_template_id: Optional[str] = Field(None, description="課程開始調查範本 ID (舊)")
    survey_end_template_id: Optional[str] = Field(None, description="課程結束調查範本 ID (舊)")
    profile_extension_template_id: Optional[str] = Field(None, description="基本資料擴充範本 ID (舊)")
    template_ids: Optional[List[str]] = Field(default=[], description="表單範本 ID 列表 (新)")

    @field_validator('end_time')
    @classmethod
    def validate_end_time(cls, v: datetime, info) -> datetime:
        """驗證結束時間必須晚於開始時間"""
        if 'start_time' in info.data and v <= info.data['start_time']:
            raise ValueError('結束時間必須晚於開始時間')
        return v


class EventCreate(EventBase):
    """創建 Event 請求"""
    pass


class EventUpdate(BaseModel):
    """更新 Event 請求"""
    name: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius: Optional[int] = None
    max_participants: Optional[int] = Field(None, ge=1)
    event_type: Optional[str] = None
    location_validation: Optional[bool] = None
    require_checkout: Optional[bool] = None
    checkout_mode: Optional[str] = None
    checkout_duration: Optional[int] = None
    visibility: Optional[str] = None
    series_id: Optional[str] = None
    template_id: Optional[str] = None
    survey_start_template_id: Optional[str] = None
    survey_end_template_id: Optional[str] = None
    profile_extension_template_id: Optional[str] = None
    template_ids: Optional[List[str]] = None


class EventResponse(EventBase):
    """Event 響應"""
    id: str
    qrcode_url: Optional[str] = None
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    templates: List[RegistrationTemplateResponse] = []

    class Config:
        from_attributes = True


class EventWithStats(EventResponse):
    """帶統計信息的 Event 響應"""
    checkins: int = Field(default=0, description="簽到人數")


class EventListResponse(BaseModel):
    """Event 列表響應"""
    events: list[EventWithStats]


class EventStats(BaseModel):
    """Event 統計信息"""
    total: int = Field(description="總簽到人數")
    checked_in: Optional[int] = Field(None, description="已簽到未簽退人數")
    checked_out: Optional[int] = Field(None, description="已簽退人數")


class EventSeriesCreate(BaseModel):
    """系列活動創建請求"""
    event_base: EventBase
    start_date: datetime = Field(..., description="系列開始日期")
    end_date: datetime = Field(..., description="系列結束日期")
    days_of_week: List[int] = Field(..., description="每週幾 (0-6, 0 是週一)")
    start_time_local: str = Field(..., description="開始時間 (HH:mm)")
    end_time_local: str = Field(..., description="結束時間 (HH:mm)")
