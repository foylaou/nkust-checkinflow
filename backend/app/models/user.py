"""
User 模型
"""
from sqlalchemy import Column, Integer, String, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.connection import Base


class User(Base):
    """用戶模型（LINE 用戶）"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    line_user_id = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    company = Column(String(255), nullable=False)
    department = Column(String(100), nullable=False)
    profile_data = Column(JSON, default={})  # 存儲基本資料擴充的回答
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # 關聯
    checkins = relationship("Checkin", back_populates="user", cascade="all, delete-orphan")
