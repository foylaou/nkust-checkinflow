"""
活動管理 API
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Event, Admin, Checkin, User, RegistrationTemplate
import uuid
import traceback
from datetime import datetime, timedelta, timezone
try:
    from zoneinfo import ZoneInfo
except ImportError:
    from backports.zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Event, Admin, Checkin, User
from app.schemas.event import (
    EventCreate,
    EventUpdate,
    EventResponse,
    EventWithStats,
    EventStats,
    EventBase,
    EventSeriesCreate
)
from app.schemas.checkin import CheckinListResponse, CheckinWithUser, UserInfo
from app.core.dependencies import get_current_admin
from app.services.qrcode_service import generate_qr_code
from app.services.export_service import export_data

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=List[EventWithStats])
async def get_events(
    skip: int = 0,
    limit: int = 100,
    current_admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    獲取所有活動列表
    - 系統管理員：查看所有活動
    - 其他角色 (管理員/會員)：僅查看自己創建的活動
    """
    query = select(Event).options(selectinload(Event.checkins), selectinload(Event.templates))
    
    # 權限過濾
    if current_admin.name != "系統管理員":
        query = query.where(Event.created_by == current_admin.id)
        
    query = query.offset(skip).limit(limit).order_by(Event.start_time.desc())
    result = await db.execute(query)
    events = result.scalars().all()

    events_with_stats = []
    for event in events:
        checkin_count = len(event.checkins)
        event_dict = {
            "id": str(event.id),
            "name": event.name,
            "description": event.description,
            "start_time": event.start_time,
            "end_time": event.end_time,
            "location": event.location,
            "latitude": event.latitude,
            "longitude": event.longitude,
            "radius": event.radius,
            "max_participants": event.max_participants,
            "event_type": event.event_type,
            "location_validation": event.location_validation,
            "require_checkout": event.require_checkout,
            "checkout_mode": event.checkout_mode,
            "checkout_duration": event.checkout_duration,
            "visibility": event.visibility,
            "series_id": event.series_id,
            "template_id": event.template_id,
            "qrcode_url": event.qrcode_url,
            "created_by": event.created_by,
            "created_at": event.created_at,
            "updated_at": event.updated_at,
            "checkins": checkin_count,
            "templates": event.templates
        }
        events_with_stats.append(EventWithStats(**event_dict))
    
    return events_with_stats


@router.get("/public", response_model=List[EventResponse])
async def get_public_events(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """
    獲取公開活動列表
    """
    query = select(Event).options(selectinload(Event.templates)).where(Event.visibility == "public").offset(skip).limit(limit).order_by(Event.start_time.desc())
    result = await db.execute(query)
    events = result.scalars().all()

    return [EventResponse.model_validate(event) for event in events]


@router.post("", response_model=EventResponse)
async def create_event(
    event_in: EventCreate,
    current_admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    創建新活動
    """
    event_data = event_in.model_dump()
    template_ids = event_data.pop("template_ids", [])
    
    event = Event(**event_data)
    event.created_by = current_admin.id
    
    # 處理範本關聯
    if template_ids:
        template_query = select(RegistrationTemplate).where(RegistrationTemplate.id.in_(template_ids))
        template_result = await db.execute(template_query)
        event.templates = template_result.scalars().all()
    
    db.add(event)
    await db.commit()
    await db.refresh(event)
    
    # 生成 QR Code
    from app.core.config import settings
    checkin_url = f"{settings.FRONTEND_URL}/event/{event.id}"
    
    qr_filename = f"event_{event.id}.png"
    qr_path = generate_qr_code(checkin_url, qr_filename)
    event.qrcode_url = qr_path
    await db.commit()
    
    # 最終重新加載，包含所有關聯
    query = select(Event).options(selectinload(Event.templates)).where(Event.id == event.id)
    result = await db.execute(query)
    event = result.scalar_one()
    
    return EventResponse.model_validate(event)


@router.post("/series", response_model=List[EventResponse])
async def create_event_series(
    series_in: EventSeriesCreate,
    current_admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    創建系列活動 (週期性活動)
    """
    series_id = str(uuid.uuid4())
    events = []
    
    # 這裡的 start_date 和 end_date 應該是日期範圍
    current_date = series_in.start_date.date()
    end_date = series_in.end_date.date()
    
    # 解析時間 (格式為 HH:mm)
    try:
        start_h, start_m = map(int, series_in.start_time_local.split(':'))
        end_h, end_m = map(int, series_in.end_time_local.split(':'))
    except ValueError:
        raise HTTPException(status_code=400, detail="時間格式不正確，應為 HH:mm")
    
    try:
        # 設定本地時區為台北時間
        local_tz = ZoneInfo("Asia/Taipei")
        
        # 預先獲取範本
        selected_templates = []
        if series_in.event_base.template_ids:
            template_query = select(RegistrationTemplate).where(RegistrationTemplate.id.in_(series_in.event_base.template_ids))
            template_result = await db.execute(template_query)
            selected_templates = list(template_result.scalars().all())

        while current_date <= end_date:
            # weekday() 0 是週一，6 是週日。days_of_week 遵循此約定。
            if current_date.weekday() in series_in.days_of_week:
                # ... (時間計算邏輯保持不變)
                
                start_dt_local = datetime.combine(current_date, datetime.min.time().replace(hour=start_h, minute=start_m))
                end_dt_local = datetime.combine(current_date, datetime.min.time().replace(hour=end_h, minute=end_m))
                
                start_dt = start_dt_local.replace(tzinfo=local_tz).astimezone(timezone.utc)
                end_dt = end_dt_local.replace(tzinfo=local_tz).astimezone(timezone.utc)
                
                # 如果結束時間早於開始時間（跨夜），增加一天
                if end_dt <= start_dt:
                    end_dt += timedelta(days=1)
                    
                event_data = series_in.event_base.model_dump()
                event_data.pop("template_ids", None) # 移除 template_ids 以免傳入 Event 構造函數
                event_data['start_time'] = start_dt
                event_data['end_time'] = end_dt
                event_data['series_id'] = series_id
                event_data['created_by'] = current_admin.id
                
                event = Event(**event_data)
                event.templates = selected_templates # 關聯範本
                db.add(event)
                events.append(event)
                
            current_date += timedelta(days=1)
        
        if not events:
            raise HTTPException(status_code=400, detail="在指定的範圍內沒有符合條件的日期")
            
        await db.commit()
        
        # 為每個活動生成 QR Code 並重新載入
        from app.core.config import settings
        final_events = []
        for event in events:
            checkin_url = f"{settings.FRONTEND_URL}/event/{event.id}"
            qr_filename = f"event_{event.id}.png"
            qr_path = generate_qr_code(checkin_url, qr_filename)
            event.qrcode_url = qr_path
            
        await db.commit()
        
        # 批量重新載入所有活動及其範本
        event_ids = [e.id for e in events]
        final_query = select(Event).options(selectinload(Event.templates)).where(Event.id.in_(event_ids)).order_by(Event.start_time.asc())
        final_result = await db.execute(final_query)
        final_events = list(final_result.scalars().all())
        
    except Exception as e:
        traceback.print_exc()
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"創建系列活動失敗: {str(e)}")
    
    return [EventResponse.model_validate(e) for e in final_events]

@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    獲取單個活動詳情
    """
    query = select(Event).options(selectinload(Event.templates)).where(Event.id == event_id)
    result = await db.execute(query)
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="活動不存在")
        
    return EventResponse.model_validate(event)


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: str,
    event_in: EventUpdate,
    current_admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    更新活動
    """
    query = select(Event).options(selectinload(Event.templates)).where(Event.id == event_id)
    result = await db.execute(query)
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="活動不存在")
        
    update_data = event_in.model_dump(exclude_unset=True)
    
    # 處理範本關聯
    if "template_ids" in update_data:
        template_ids = update_data.pop("template_ids")
        if template_ids is not None:
            template_query = select(RegistrationTemplate).where(RegistrationTemplate.id.in_(template_ids))
            template_result = await db.execute(template_query)
            event.templates = list(template_result.scalars().all())
        
    for field, value in update_data.items():
        setattr(event, field, value)
        
    await db.commit()
    
    # 重新加載以包含 templates 關係
    query = select(Event).options(selectinload(Event.templates)).where(Event.id == event.id)
    result = await db.execute(query)
    event = result.scalar_one()
    
    return EventResponse.model_validate(event)


@router.delete("/{event_id}")
async def delete_event(
    event_id: str,
    current_admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    刪除活動
    """
    query = select(Event).where(Event.id == event_id)
    result = await db.execute(query)
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="活動不存在")
        
    await db.delete(event)
    await db.commit()
    
    return {"success": True, "message": "活動已刪除"}


@router.get("/{event_id}/stats", response_model=EventStats)
async def get_event_stats(
    event_id: str,
    current_admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    獲取活動統計數據
    """
    query = select(Event).where(Event.id == event_id)
    result = await db.execute(query)
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="活動不存在")
    
    total_query = select(func.count(Checkin.id)).where(Checkin.event_id == event_id)
    total_result = await db.execute(total_query)
    total = total_result.scalar() or 0
    
    checked_out_query = select(func.count(Checkin.id)).where(
        Checkin.event_id == event_id,
        Checkin.checkout_time.is_not(None)
    )
    checked_out_result = await db.execute(checked_out_query)
    checked_out = checked_out_result.scalar() or 0
    
    checked_in = total - checked_out
    
    return EventStats(
        total=total,
        checked_in=checked_in,
        checked_out=checked_out
    )


@router.get("/{event_id}/checkins", response_model=CheckinListResponse)
async def get_event_checkins(
    event_id: str,
    current_admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    獲取活動的簽到列表
    """
    query = select(Event).where(Event.id == event_id)
    result = await db.execute(query)
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="活動不存在")
    
    # 查詢簽到記錄並包含用戶信息
    checkins_query = select(Checkin).options(selectinload(Checkin.user)).where(Checkin.event_id == event_id).order_by(Checkin.checkin_time.desc())
    checkins_result = await db.execute(checkins_query)
    checkins = checkins_result.scalars().all()
    
    checkin_list = []
    for checkin in checkins:
        if not checkin.user:
            continue

        user_info = UserInfo(
            name=checkin.user.name,
            phone=checkin.user.phone or "",
            company=checkin.user.company or "",
            department=checkin.user.department or ""
        )

        checkin_list.append(
            CheckinWithUser(
                id=checkin.id,
                user_id=checkin.user_id,
                event_id=checkin.event_id,
                checkin_time=checkin.checkin_time,
                checkout_time=checkin.checkout_time,
                geolocation=checkin.geolocation,
                status=checkin.status,
                is_valid=checkin.is_valid,
                created_at=checkin.created_at,
                updated_at=checkin.updated_at,
                user=user_info
            )
        )
        
    return CheckinListResponse(checkins=checkin_list)


@router.get("/{event_id}/export")
async def export_event_checkins(
    event_id: str,
    format: str = "excel",
    current_admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    匯出活動簽到記錄
    """
    query = select(Event).where(Event.id == event_id)
    result = await db.execute(query)
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="活動不存在")
    
    # 查詢數據
    checkins_query = select(Checkin).options(selectinload(Checkin.user)).where(Checkin.event_id == event_id).order_by(Checkin.checkin_time.desc())
    checkins_result = await db.execute(checkins_query)
    checkins = checkins_result.scalars().all()
    
    # 轉換為字典列表
    data = []
    for checkin in checkins:
        if not checkin.user:
            continue
            
        row = {
            "姓名": checkin.user.name,
            "手機": checkin.user.phone,
            "單位": checkin.user.company,
            "部門": checkin.user.department,
            "簽到時間": checkin.checkin_time.strftime("%Y-%m-%d %H:%M:%S"),
            "簽退時間": checkin.checkout_time.strftime("%Y-%m-%d %H:%M:%S") if checkin.checkout_time else "",
            "狀態": checkin.status,
            "位置": checkin.geolocation
        }
        data.append(row)
        
    # 匯出
    file_path = export_data(data, format, prefix=f"checkins_{event_id}")
    
    return {"url": f"/api/files/{file_path}"}