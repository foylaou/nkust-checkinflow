"""
QR Code 生成服務
"""
import os
import qrcode
from app.core.config import settings

def generate_qr_code(data: str, filename: str) -> str:
    """
    生成 QR Code 並保存為文件
    
    Args:
        data: QR Code 內容
        filename: 文件名 (不含路徑)
        
    Returns:
        str: 相對文件路徑
    """
    # 確保目錄存在
    qr_dir = os.path.join(settings.UPLOAD_DIR, "qrcodes")
    os.makedirs(qr_dir, exist_ok=True)
    
    # 完整文件路徑
    file_path = os.path.join(qr_dir, filename)
    
    # 生成 QR Code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # 保存文件
    img.save(file_path)
    
    # 返回相對路徑 (用於 API 訪問)
    return f"qrcodes/{filename}"

def get_qr_code_path(filename: str) -> str:
    """獲取 QR Code 的完整文件路徑"""
    return os.path.join(settings.UPLOAD_DIR, "qrcodes", filename)
