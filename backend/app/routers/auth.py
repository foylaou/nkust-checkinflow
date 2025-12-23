"""
認證相關 API 路由
包含：登入、登出、檢查認證狀態、LINE OAuth 回調
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx

from app.database import get_db
from app.models import Admin, User
from app.schemas.auth import LoginResponse, Token, ChangePasswordRequest
from app.schemas.admin import AdminResponse, AdminListResponse, AdminCreate
from app.core.security import verify_password, create_access_token, hash_password
from app.core.dependencies import get_current_admin, require_system_admin
from app.core.config import settings

router = APIRouter(prefix="/api/auth", tags=["認證"])


@router.post("/change-password", summary="修改密碼")
async def change_password(
    password_data: ChangePasswordRequest,
    current_admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    修改當前管理員的密碼
    """
    # 驗證舊密碼
    if not verify_password(password_data.old_password, current_admin.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="舊密碼不正確"
        )
        
    # 更新密碼
    current_admin.password = hash_password(password_data.new_password)
    await db.commit()
    
    return {"success": True, "message": "密碼修改成功"}


@router.get("/config", summary="獲取認證相關配置")
async def get_auth_config():
    """
    獲取認證配置（如是否允許註冊）
    """
    return {
        "allow_registration": settings.ALLOW_REGISTRATION
    }


@router.post("/register", response_model=AdminResponse, summary="註冊管理員")
async def register_admin(
    admin_data: AdminCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    註冊新管理員
    
    前提：ALLOW_REGISTRATION=True
    """
    if not settings.ALLOW_REGISTRATION:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="系統目前不開放註冊"
        )
        
    # 檢查用戶名是否已存在
    result = await db.execute(
        select(Admin).where(Admin.username == admin_data.username)
    )
    existing_admin = result.scalar_one_or_none()

    if existing_admin:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="用戶名已被使用"
        )
        
    # 註冊的帳號角色預設為"管理員"，即使傳入"系統管理員"也強制覆蓋，除非有其他審核機制
    # 這裡簡單處理：如果是開放註冊，只能註冊為一般管理員
    
    new_admin = Admin(
        username=admin_data.username,
        password=hash_password(admin_data.password),
        name="Member"  # 自助註冊默認為一般會員
    )

    db.add(new_admin)
    await db.commit()
    await db.refresh(new_admin)

    return new_admin


@router.post("/login", response_model=LoginResponse, summary="管理員登入")
async def admin_login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """
    管理員登入

    參數:
    - username: 用戶名
    - password: 密碼

    返回:
    - access_token: JWT token
    - token_type: bearer
    - user: 管理員信息
    """
    # 查詢管理員
    result = await db.execute(
        select(Admin).where(Admin.username == form_data.username)
    )
    admin = result.scalar_one_or_none()

    # 驗證用戶名和密碼
    if not admin or not verify_password(form_data.password, admin.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用戶名或密碼不正確",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 檢查帳號是否已停用
    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="帳號已被停用，請聯繫管理員"
        )

    # 生成 JWT token
    access_token = create_access_token(
        data={
            "sub": str(admin.id),
            "username": admin.username,
            "role": admin.name
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": admin
    }


@router.post("/logout", summary="管理員登出")
async def admin_logout():
    """
    管理員登出

    前端應該：
    1. 清除本地存儲的 token
    2. 清除相關狀態

    後端無需執行特殊操作（JWT 是無狀態的）
    """
    return {"success": True, "message": "登出成功"}


@router.get("/me", response_model=AdminResponse, summary="獲取當前管理員信息")
async def get_current_admin_info(
    admin: Admin = Depends(get_current_admin)
):
    """
    獲取當前認證的管理員信息

    需要 JWT token（在 Authorization header 中）
    """
    return admin


@router.get("/users", response_model=AdminListResponse, summary="獲取管理員列表")
async def get_admin_list(
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    獲取所有管理員列表

    權限: 系統管理員或管理員
    """
    result = await db.execute(select(Admin))
    admins = result.scalars().all()

    return {"admins": admins}


@router.post("/users", response_model=AdminResponse, summary="創建管理員", status_code=status.HTTP_201_CREATED)
async def create_admin(
    admin_data: AdminCreate,
    current_admin: Admin = Depends(require_system_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    創建新管理員

    權限: 僅系統管理員

    參數:
    - username: 用戶名（唯一）
    - password: 密碼（至少6位）
    - name: 角色名稱（"系統管理員" 或 "管理員"）
    """
    # 檢查用戶名是否已存在
    result = await db.execute(
        select(Admin).where(Admin.username == admin_data.username)
    )
    existing_admin = result.scalar_one_or_none()

    if existing_admin:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="用戶名已被使用"
        )

    # 創建新管理員
    new_admin = Admin(
        username=admin_data.username,
        password=hash_password(admin_data.password),
        name=admin_data.name
    )

    db.add(new_admin)
    await db.commit()
    await db.refresh(new_admin)

    return new_admin


@router.delete("/users/{user_id}", summary="刪除管理員")
async def delete_admin(
    user_id: int,
    current_admin: Admin = Depends(require_system_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    刪除管理員 (僅限系統管理員)
    """
    # 不能刪除自己
    if current_admin.id == user_id:
        raise HTTPException(status_code=400, detail="不能刪除自己的帳號")
        
    result = await db.execute(select(Admin).where(Admin.id == user_id))
    admin = result.scalar_one_or_none()
    
    if not admin:
        raise HTTPException(status_code=404, detail="管理員不存在")
        
    await db.delete(admin)
    await db.commit()
    
    return {"success": True, "message": "管理員已刪除"}


@router.put("/users/{user_id}/status", summary="切換管理員狀態 (啟用/停用)")
async def toggle_admin_status(
    user_id: int,
    active_in: dict,
    current_admin: Admin = Depends(require_system_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    啟用或停用管理員帳號 (僅限系統管理員)
    """
    if current_admin.id == user_id:
        raise HTTPException(status_code=400, detail="不能停用自己的帳號")
        
    result = await db.execute(select(Admin).where(Admin.id == user_id))
    admin = result.scalar_one_or_none()
    
    if not admin:
        raise HTTPException(status_code=404, detail="管理員不存在")
        
    admin.is_active = active_in.get("is_active", True)
    await db.commit()
    
    return {"success": True, "message": "狀態已更新"}


@router.get("/line/callback", summary="LINE OAuth 回調")
async def line_oauth_callback(
    code: str = Query(..., description="Authorization code"),
    state: str = Query(None, description="Event ID"),
    db: AsyncSession = Depends(get_db)
):
    """
    LINE OAuth 2.0 回調處理

    流程:
    1. 用 code 換取 access_token
    2. 解析 id_token 獲取 LINE user_id
    3. 查詢用戶是否已註冊
    4. 已註冊: 生成 JWT，重定向到活動頁面
    5. 未註冊: 重定向到註冊頁面

    參數:
    - code: LINE 返回的 authorization code
    - state: 自定義狀態（通常是 event_id）
    """
    try:
        # 1. 用 code 換取 token
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://api.line.me/oauth2/v2.1/token",
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": settings.LINE_CALLBACK_URL,
                    "client_id": settings.LINE_CHANNEL_ID,
                    "client_secret": settings.LINE_CHANNEL_SECRET
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )

        if token_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"LINE 認證失敗: {token_response.text}"
            )

        token_data = token_response.json()

        # 2. 解析 id_token 獲取 LINE user_id
        # 注意：這裡簡化處理，生產環境應該驗證 JWT 簽名
        import jwt as pyjwt
        id_token = token_data.get("id_token")
        payload = pyjwt.decode(id_token, options={"verify_signature": False})
        line_user_id = payload.get("sub")

        if not line_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="無法獲取 LINE user ID"
            )

        # 3. 查詢用戶
        result = await db.execute(
            select(User).where(User.line_user_id == line_user_id)
        )
        user = result.scalar_one_or_none()

        # 4. 根據用戶狀態重定向
        frontend_url = settings.FRONTEND_URL

        if user:
            # 已註冊：生成 token 並重定向到活動頁面
            access_token = create_access_token(
                data={
                    "sub": str(user.id),
                    "line_id": line_user_id
                }
            )
            redirect_url = f"{frontend_url}/event/{state}?token={access_token}&sub={user.id}"
        else:
            # 未註冊：重定向到註冊頁面
            redirect_url = f"{frontend_url}/register?lineId={line_user_id}&eventId={state}"

        return RedirectResponse(url=redirect_url)

    except Exception as e:
        # 錯誤處理：重定向到錯誤頁面
        error_url = f"{settings.FRONTEND_URL}/login?error={str(e)}"
        return RedirectResponse(url=error_url)
