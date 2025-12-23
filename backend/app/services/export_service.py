"""
數據匯出服務
"""
import os
import pandas as pd
from datetime import datetime
from typing import List, Dict, Any
from app.core.config import settings

def export_data(data: List[Dict[str, Any]], format: str, prefix: str = "export") -> str:
    """
    匯出數據為 Excel 或 CSV 文件
    
    Args:
        data: 數據列表 (字典格式)
        format: 格式 'excel' 或 'csv'
        prefix: 文件名前綴
        
    Returns:
        str: 相對文件路徑
    """
    if not data:
        return ""
        
    # 創建 DataFrame
    df = pd.DataFrame(data)
    
    # 確保目錄存在
    export_dir = os.path.join(settings.UPLOAD_DIR, "exports")
    os.makedirs(export_dir, exist_ok=True)
    
    # 生成文件名
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    if format == "excel":
        filename = f"{prefix}_{timestamp}.xlsx"
        file_path = os.path.join(export_dir, filename)
        df.to_excel(file_path, index=False)
    else:  # csv
        filename = f"{prefix}_{timestamp}.csv"
        file_path = os.path.join(export_dir, filename)
        df.to_csv(file_path, index=False, encoding="utf-8-sig")
        
    return f"exports/{filename}"

def get_export_path(filename: str) -> str:
    """獲取匯出文件的完整路徑"""
    return os.path.join(settings.UPLOAD_DIR, "exports", filename)
