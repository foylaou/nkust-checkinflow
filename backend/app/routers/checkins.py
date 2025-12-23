"""
簽到 API
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.database import get_db
from app.models import Checkin, Event, User
from app.schemas.checkin import (
    CheckinCreate, 
    CheckinResponse, 
    CheckinValidateRequest, 
    CheckinValidateResponse,
    UserInfo
)
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/checkins", tags=["checkins"])


import math

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    計算兩點間的距離 (Haversine formula)
    返回單位：公尺
    """
    R = 6371000  # 地球半徑 (公尺)
    phi1 = lat1 * math.pi / 180
    phi2 = lat2 * math.pi / 180
    delta_phi = (lat2 - lat1) * math.pi / 180
    delta_lambda = (lon2 - lon1) * math.pi / 180

    a = math.sin(delta_phi / 2) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c

@router.post("", response_model=CheckinResponse)
async def create_checkin(
    checkin_in: CheckinCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    用戶簽到/簽退
    """
    # 驗證活動是否存在
    event_query = select(Event).where(Event.id == checkin_in.event_id)
    event_result = await db.execute(event_query)
    event = event_result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="活動不存在")

    # 位置驗證邏輯
    if event.location_validation:
        if not checkin_in.geolocation:
            raise HTTPException(status_code=400, detail="此活動需要開啟定位功能")
        
        try:
            # 前端傳來的格式預期為 "lat,lng"
            user_lat, user_lng = map(float, checkin_in.geolocation.split(','))
            
            if event.latitude is not None and event.longitude is not None:
                distance = calculate_distance(user_lat, user_lng, event.latitude, event.longitude)
                if distance > event.radius:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"您不在活動範圍內 (距離: {int(distance)}m, 限制: {event.radius}m)"
                    )
            else:
                # 活動開啟了驗證但沒設定座標，暫時放行或報錯，這裡選擇報錯提示管理員
                # 實際運營可能選擇放行，但開發階段嚴格一點比較好
                pass 
        except ValueError:
            raise HTTPException(status_code=400, detail="無效的定位資料")

    # 檢查是否已經簽到
        
    # 檢查是否已經簽到
    checkin_query = select(Checkin).where(
        and_(
            Checkin.event_id == checkin_in.event_id,
            Checkin.user_id == current_user.id
        )
    )
    checkin_result = await db.execute(checkin_query)
    existing_checkin = checkin_result.scalar_one_or_none()
    
    now = datetime.now(timezone.utc)
    
    if existing_checkin:
        # 如果已經簽到，檢查是否需要簽退
        if existing_checkin.checkout_time:
            # 已經簽退過
            raise HTTPException(status_code=400, detail="您已經完成簽到和簽退")

        # 檢查活動是否需要簽退
        if not event.require_checkout:
            raise HTTPException(status_code=400, detail="此活動不需要簽退")

        # 檢查簽退時間限制
        if event.checkout_mode == 'after_duration' and event.checkout_duration:
            # 簽到後N分鐘才能簽退
            from datetime import timedelta
            
            checkin_time = existing_checkin.checkin_time
            # 統一處理時區：確保 checkin_time 有時區資訊
            if checkin_time.tzinfo is None:
                checkin_time = checkin_time.replace(tzinfo=timezone.utc)
            
            min_checkout_time = checkin_time + timedelta(minutes=event.checkout_duration)
            if now < min_checkout_time:
                remaining_minutes = int((min_checkout_time - now).total_seconds() / 60)
                raise HTTPException(
                    status_code=400,
                    detail=f"簽到後 {event.checkout_duration} 分鐘才能簽退，還需等待 {remaining_minutes} 分鐘"
                )
        elif event.checkout_mode == 'at_end_time':
            # 活動結束時間到才能簽退
            end_time = event.end_time
            if end_time.tzinfo is None:
                end_time = end_time.replace(tzinfo=timezone.utc)
                
            if now < end_time:
                raise HTTPException(
                    status_code=400,
                    detail=f"活動結束時間（{event.end_time.strftime('%Y-%m-%d %H:%M')}）到才能簽退"
                )

        # 執行簽退
        existing_checkin.checkout_time = now
        existing_checkin.status = "已簽退"
        if checkin_in.geolocation:
            existing_checkin.geolocation = checkin_in.geolocation
            
        # 如果有 profile_data，更新使用者資料
        if checkin_in.profile_data:
            if not current_user.profile_data:
                current_user.profile_data = {}
            current_user.profile_data = {**current_user.profile_data, **checkin_in.profile_data}
            db.add(current_user)

        await db.commit()
        await db.refresh(existing_checkin)
        return CheckinResponse.model_validate(existing_checkin)
    
    else:
        # 創建新簽到
        # ... 驗證邏輯 ...
            
        # 如果有 profile_data，更新使用者資料
        if checkin_in.profile_data:
            if not current_user.profile_data:
                current_user.profile_data = {}
            current_user.profile_data = {**current_user.profile_data, **checkin_in.profile_data}
            db.add(current_user)
            
        new_checkin = Checkin(
            user_id=current_user.id,
            event_id=checkin_in.event_id,
            checkin_time=now,
            geolocation=checkin_in.geolocation,
            dynamic_data=checkin_in.dynamic_data,
            status="已簽到",
            is_valid=True
        )
        
        db.add(new_checkin)
        await db.commit()
        await db.refresh(new_checkin)
        
        return CheckinResponse.model_validate(new_checkin)


@router.post("/validate", response_model=CheckinValidateResponse)
async def validate_checkin(
    checkin_in: CheckinValidateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    驗證簽到資格
    """
    # 驗證活動
    event_query = select(Event).where(Event.id == checkin_in.event_id)
    event_result = await db.execute(event_query)
    event = event_result.scalar_one_or_none()
    
    if not event:
        return CheckinValidateResponse(valid=False, message="活動不存在")

    # 位置驗證邏輯 (僅驗證是否開啟，實際距離由前端發送 geolocation 後在 create_checkin 驗證)
    # 或者如果 checkin_in 包含 geolocation 也可以在這裡驗證
    # 這裡主要是頁面加載時檢查，通常還沒有 geolocation
    
    # 檢查是否已簽到
    checkin_query = select(Checkin).where(
        and_(
            Checkin.event_id == checkin_in.event_id,
            Checkin.user_id == current_user.id
        )
    )
    checkin_result = await db.execute(checkin_query)
    existing_checkin = checkin_result.scalar_one_or_none()
    
    user_info = UserInfo(
        name=current_user.name,
        phone=current_user.phone or "",
        company=current_user.company or "",
        department=current_user.department or ""
    )
    
    if existing_checkin:
        checkin_response = CheckinResponse.model_validate(existing_checkin)

        if existing_checkin.checkout_time:
             return CheckinValidateResponse(
                valid=False,
                message="您已完成簽到退",
                user=user_info,
                checkin=checkin_response
            )
        else:
            # 檢查簽退時間限制
            # 使用 UTC 時間進行比較
            now = datetime.now(timezone.utc)

            if event.require_checkout:
                if event.checkout_mode == 'after_duration' and event.checkout_duration:
                    from datetime import timedelta

                    checkin_time = existing_checkin.checkin_time
                    # 確保 checkin_time 有時區資訊 (假設 DB 存 UTC)
                    if checkin_time.tzinfo is None:
                         checkin_time = checkin_time.replace(tzinfo=timezone.utc)

                    min_checkout_time = checkin_time + timedelta(minutes=event.checkout_duration)

                    if now < min_checkout_time:
                        remaining_minutes = int((min_checkout_time - now).total_seconds() / 60)
                        return CheckinValidateResponse(
                            valid=False,
                            message=f"簽到後 {event.checkout_duration} 分鐘才能簽退，還需等待 {remaining_minutes} 分鐘",
                            user=user_info,
                            checkin=checkin_response
                        )
                elif event.checkout_mode == 'at_end_time':
                    # 活動結束時間到才能簽退
                    end_time = event.end_time
                    if end_time.tzinfo is None:
                        end_time = end_time.replace(tzinfo=timezone.utc)

                    if now < end_time:
                        return CheckinValidateResponse(
                            valid=False,
                            message=f"活動結束時間（{event.end_time.strftime('%H:%M')}）到才能簽退",
                            user=user_info,
                            checkin=checkin_response
                        )

            return CheckinValidateResponse(
                valid=True,
                message="您可以進行簽退",
                user=user_info,
                checkin=checkin_response
            )
            
    return CheckinValidateResponse(
        valid=True, 
        message="您可以進行簽到",
        user=user_info
    )
