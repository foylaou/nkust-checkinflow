"""
文件服務 API
"""
import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from app.core.config import settings

router = APIRouter(prefix="/files", tags=["files"])


@router.get("/{file_path:path}")
async def get_file(file_path: str):
    """
    獲取靜態文件 (QR Code, 匯出文件)
    """
    # 構建完整路徑
    full_path = os.path.join(settings.UPLOAD_DIR, file_path)
    
    # 安全檢查: 防止目錄遍歷
    # os.path.abspath(full_path) 必須以 os.path.abspath(settings.UPLOAD_DIR) 開頭
    abs_full_path = os.path.abspath(full_path)
    abs_upload_dir = os.path.abspath(settings.UPLOAD_DIR)
    
    if not abs_full_path.startswith(abs_upload_dir):
        raise HTTPException(status_code=403, detail="禁止訪問該路徑")
    
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="文件不存在")
        
    if not os.path.isfile(full_path):
        raise HTTPException(status_code=404, detail="文件不存在")
        
    return FileResponse(full_path)
