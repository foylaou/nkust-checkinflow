"""
核心配置文件
管理所有環境變量和應用配置
"""
import os
from typing import Optional
from dotenv import load_dotenv

# 載入環境變量
load_dotenv()


class Settings:
    """應用配置類"""

    # 資料庫配置
    DB_USERNAME: str = os.getenv("DB_USERNAME", "postgres")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")
    DB_NAME: str = os.getenv("DB_NAME", "checkinflow")
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: str = os.getenv("DB_PORT", "5432")

    @property
    def DATABASE_URL(self) -> str:
        """生成資料庫連接 URL"""
        return f"postgresql+asyncpg://{self.DB_USERNAME}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    # JWT 配置
    JWT_SECRET: str = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRE_HOURS: int = int(os.getenv("JWT_EXPIRE_HOURS", "8"))

    # LINE OAuth 配置
    LINE_CHANNEL_ID: str = os.getenv("LINE_CHANNEL_ID", "")
    LINE_CHANNEL_SECRET: str = os.getenv("LINE_CHANNEL_SECRET", "")
    LINE_CALLBACK_URL: str = os.getenv("LINE_CALLBACK_URL", "")

    # 前端 URL
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # 儲存配置
    STORAGE_TYPE: str = os.getenv("STORAGE_TYPE", "local")  # local, s3
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")

    # AWS S3 配置（如果使用 S3）
    AWS_ACCESS_KEY_ID: Optional[str] = os.getenv("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY: Optional[str] = os.getenv("AWS_SECRET_ACCESS_KEY")
    AWS_REGION: Optional[str] = os.getenv("AWS_REGION")
    S3_BUCKET_NAME: Optional[str] = os.getenv("S3_BUCKET_NAME")

    # 應用配置
    PROJECT_NAME: str = "CheckinFlow API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    ALLOW_REGISTRATION: bool = os.getenv("ALLOW_REGISTRATION", "False").lower() == "true"

    # CORS 配置
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://checkinflow.isafe.org.tw"
    ]


# 創建全局設置實例
settings = Settings()
