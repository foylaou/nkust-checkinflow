# entities/models.py
import uuid
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class Admin(Base):
    """管理員模型"""
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)  # 存儲加密後的密碼
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # 關聯
    events = relationship("Event", back_populates="admin")


class User(Base):
    """用戶模型"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    line_user_id = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    company = Column(String(255), nullable=False)
    department = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # 關聯
    checkins = relationship("Checkin", back_populates="user")


class Event(Base):
    """活動模型"""
    __tablename__ = "events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    location = Column(String(255), nullable=True)
    max_participants = Column(Integer, nullable=True)
    event_type = Column(String(50), default="會議")
    location_validation = Column(Boolean, default=False)
    require_checkout = Column(Boolean, default=False)
    qrcode_url = Column(String(255), nullable=True)
    created_by = Column(Integer, ForeignKey("admins.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # 關聯
    checkins = relationship("Checkin", back_populates="event")
    admin = relationship("Admin", back_populates="events")


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
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # 關聯
    user = relationship("User", back_populates="checkins")
    event = relationship("Event", back_populates="checkins")
