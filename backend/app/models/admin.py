"""
Admin 模型
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.connection import Base


class Admin(Base):
    """管理員模型"""
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)  # 存儲加密後的密碼
    name = Column(String(100), nullable=False)  # 角色名稱："系統管理員" 或 "管理員"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # 關聯
    events = relationship("Event", back_populates="admin", cascade="all, delete-orphan")
    templates = relationship("RegistrationTemplate", back_populates="admin", cascade="all, delete-orphan")
