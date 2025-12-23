"""
RegistrationTemplate 模型
"""
import uuid
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, JSON, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.connection import Base


class RegistrationTemplate(Base):
    """註冊表單範本模型"""
    __tablename__ = "registration_templates"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    type = Column(String(50), default="registration")  # registration, survey, profile_extension
    survey_trigger = Column(String(50), nullable=True)  # course_start, course_end
    fields_schema = Column(JSON, nullable=False)  # 定義欄位：[{name, type, required, options}, ...]
    is_public = Column(Boolean, default=False)  # True 為公共範本，False 為私人範本
    created_by_admin_id = Column(Integer, ForeignKey("admins.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # 關聯
    admin = relationship("Admin", back_populates="templates")
