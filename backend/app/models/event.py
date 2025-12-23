"""
Event 模型
"""
import uuid
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, Float, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.connection import Base

# 多對多關聯表
event_template_association = Table(
    "event_template_association",
    Base.metadata,
    Column("event_id", String(36), ForeignKey("events.id", ondelete="CASCADE"), primary_key=True),
    Column("template_id", String(36), ForeignKey("registration_templates.id", ondelete="CASCADE"), primary_key=True),
)


class Event(Base):
    """活動模型"""
    __tablename__ = "events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    # ... (原有欄位保持不變以便相容，但我們主要使用 templates 關係)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    location = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    radius = Column(Integer, default=100)  # meters
    max_participants = Column(Integer, nullable=True)
    event_type = Column(String(50), default="會議")
    location_validation = Column(Boolean, default=False)
    require_checkout = Column(Boolean, default=False)
    checkout_mode = Column(String(50), nullable=True)  # 'after_duration' or 'at_end_time'
    checkout_duration = Column(Integer, nullable=True)  # minutes
    qrcode_url = Column(String(255), nullable=True)
    visibility = Column(String(20), default="public")  # 'public' or 'private'
    series_id = Column(String(36), nullable=True, index=True)  # for recurring events
    
    # 舊有的單一關聯欄位 (保留相容性)
    template_id = Column(String(36), ForeignKey("registration_templates.id"), nullable=True)
    survey_start_template_id = Column(String(36), ForeignKey("registration_templates.id"), nullable=True)
    survey_end_template_id = Column(String(36), ForeignKey("registration_templates.id"), nullable=True)
    profile_extension_template_id = Column(String(36), ForeignKey("registration_templates.id"), nullable=True)
    
    created_by = Column(Integer, ForeignKey("admins.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # 關聯
    checkins = relationship("Checkin", back_populates="event", cascade="all, delete-orphan")
    admin = relationship("Admin", back_populates="events")
    
    # 新的多對多關聯
    templates = relationship("RegistrationTemplate", secondary=event_template_association)
    
    # 舊有關聯 (保留相容性)
    template = relationship("RegistrationTemplate", foreign_keys=[template_id])
    survey_start_template = relationship("RegistrationTemplate", foreign_keys=[survey_start_template_id])
    survey_end_template = relationship("RegistrationTemplate", foreign_keys=[survey_end_template_id])
    profile_extension_template = relationship("RegistrationTemplate", foreign_keys=[profile_extension_template_id])
