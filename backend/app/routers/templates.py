"""
註冊表單範本管理 API
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.database import get_db
from app.models import RegistrationTemplate, Admin
from app.schemas.registration_template import (
    RegistrationTemplateCreate,
    RegistrationTemplateUpdate,
    RegistrationTemplateResponse
)
from app.core.dependencies import get_current_admin

router = APIRouter(prefix="/templates", tags=["templates"])


@router.get("", response_model=List[RegistrationTemplateResponse])
async def get_templates(
    current_admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    獲取可用的範本列表
    - 系統管理員：查看所有範本
    - 其他角色：查看所有公共範本 + 自己創建的私人範本
    """
    if current_admin.name == "系統管理員":
        query = select(RegistrationTemplate)
    else:
        query = select(RegistrationTemplate).where(
            or_(
                RegistrationTemplate.is_public == True,
                RegistrationTemplate.created_by_admin_id == current_admin.id
            )
        )
    
    result = await db.execute(query)
    templates = result.scalars().all()
    return templates


@router.post("", response_model=RegistrationTemplateResponse)
async def create_template(
    template_in: RegistrationTemplateCreate,
    current_admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    創建新範本
    """
    # 只有系統管理員可以創建公共範本
    if template_in.is_public and current_admin.name != "系統管理員":
        raise HTTPException(status_code=403, detail="只有系統管理員可以創建公共範本")
        
    template = RegistrationTemplate(
        **template_in.model_dump(),
        created_by_admin_id=current_admin.id
    )
    
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return template


@router.get("/{template_id}", response_model=RegistrationTemplateResponse)
async def get_template(
    template_id: str,
    current_admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    獲取單個範本詳情
    """
    query = select(RegistrationTemplate).where(RegistrationTemplate.id == template_id)
    result = await db.execute(query)
    template = result.scalar_one_or_none()
    
    if not template:
        raise HTTPException(status_code=404, detail="範本不存在")
        
    # 權限檢查
    if not template.is_public and template.created_by_admin_id != current_admin.id and current_admin.name != "系統管理員":
        raise HTTPException(status_code=403, detail="無權訪問此私人範本")
        
    return template


@router.put("/{template_id}", response_model=RegistrationTemplateResponse)
async def update_template(
    template_id: str,
    template_in: RegistrationTemplateUpdate,
    current_admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    更新範本
    """
    query = select(RegistrationTemplate).where(RegistrationTemplate.id == template_id)
    result = await db.execute(query)
    template = result.scalar_one_or_none()
    
    if not template:
        raise HTTPException(status_code=404, detail="範本不存在")
        
    # 權限檢查：只有創建者或系統管理員可以修改
    if template.created_by_admin_id != current_admin.id and current_admin.name != "系統管理員":
        raise HTTPException(status_code=403, detail="無權修改此範本")
        
    update_data = template_in.model_dump(exclude_unset=True)
    
    # 非系統管理員不能將範本設為公共
    if update_data.get("is_public") and current_admin.name != "系統管理員":
        raise HTTPException(status_code=403, detail="只有系統管理員可以將範本設為公共")
        
    for field, value in update_data.items():
        setattr(template, field, value)
        
    await db.commit()
    await db.refresh(template)
    return template


@router.delete("/{template_id}")
async def delete_template(
    template_id: str,
    current_admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    刪除範本
    """
    query = select(RegistrationTemplate).where(RegistrationTemplate.id == template_id)
    result = await db.execute(query)
    template = result.scalar_one_or_none()
    
    if not template:
        raise HTTPException(status_code=404, detail="範本不存在")
        
    if template.created_by_admin_id != current_admin.id and current_admin.name != "系統管理員":
        raise HTTPException(status_code=403, detail="無權刪除此範本")
        
    await db.delete(template)
    await db.commit()
    return {"success": True, "message": "範本已刪除"}
