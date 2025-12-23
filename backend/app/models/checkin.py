"""
Checkin 模型
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.connection import Base


class Checkin(Base):
    """簽到記錄模型"""
    __tablename__ = "checkins"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_id = Column(String(36), ForeignKey("events.id"), nullable=False)
    checkin_time = Column(DateTime(timezone=True), nullable=False)
    checkout_time = Column(DateTime(timezone=True), nullable=True)
    geolocation = Column(String(255), nullable=True)
    is_valid = Column(Boolean, default=True)
    status = Column(String(50), default="出席")
    dynamic_data = Column(JSON, nullable=True)  # 存儲客製化欄位的回答
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # 關聯
    user = relationship("User", back_populates="checkins")
    event = relationship("Event", back_populates="checkins")
