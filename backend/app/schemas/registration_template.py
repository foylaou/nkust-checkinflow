"""
RegistrationTemplate 相關 Schema
"""
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field


class RegistrationTemplateBase(BaseModel):
    """註冊表單範本基礎模型"""
    name: str = Field(..., description="範本名稱")
    type: str = Field(default="registration", description="範本類型: registration, survey, profile_extension")
    survey_trigger: Optional[str] = Field(default=None, description="調查觸發時機: course_start, course_end")
    fields_schema: List[dict] = Field(..., description="欄位定義: [{name, type, required, options}, ...]")
    is_public: bool = Field(default=False, description="是否為公共範本")


class RegistrationTemplateCreate(RegistrationTemplateBase):
    """創建範本請求"""
    pass


class RegistrationTemplateUpdate(BaseModel):
    """更新範本請求"""
    name: Optional[str] = None
    type: Optional[str] = None
    survey_trigger: Optional[str] = None
    fields_schema: Optional[List[dict]] = None
    is_public: Optional[bool] = None


class RegistrationTemplateResponse(RegistrationTemplateBase):
    """範本響應"""
    id: str
    created_by_admin_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
