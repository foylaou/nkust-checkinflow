"""
FastAPI 主應用程序
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database import init_db, close_db
from app.routers import auth, users, events, checkins, files, templates


@asynccontextmanager
async def lifespan(app: FastAPI):
    """應用程式生命週期管理"""
    # 啟動時：建立資料庫和表
    print("🚀 應用程式啟動中...")
    await init_db()
    print("✅ 資料庫初始化完成")

    yield

    # 關閉時
    print("👋 應用程式關閉中...")
    await close_db()
    print("✅ 資料庫連接已關閉")


# 創建 FastAPI 應用
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="CheckinFlow 活動簽到系統 API",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 註冊路由
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(events.router, prefix="/api")
app.include_router(templates.router, prefix="/api")
app.include_router(checkins.router, prefix="/api")
app.include_router(files.router, prefix="/api")

# 根路由
@app.get("/")
async def root():
    """API 根路由"""
    return {
        "message": "CheckinFlow API",
        "version": settings.VERSION,
        "docs": "/api/docs"
    }


# 健康檢查
@app.get("/api/health")
async def health_check():
    """健康檢查端點"""
    return {
        "status": "healthy",
        "service": "CheckinFlow API"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )