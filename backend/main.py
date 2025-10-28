from typing import Union

from fastapi import FastAPI
from pydantic import BaseModel
from contextlib import asynccontextmanager
from entities.database import init_db, close_db
from routers import users, system


@asynccontextmanager
async def lifespan(app: FastAPI):
    """應用程式生命週期管理"""
    # 啟動時：建立資料庫和表
    print("🚀 應用程式啟動中...")
    await init_db()  # ✅ 直接使用 await，不要用 asyncio.run()
    print("✅ 資料庫初始化完成")

    yield

    # 關閉時
    print("👋 應用程式關閉中...")
    await close_db()
    print("✅ 資料庫連接已關閉")


app = FastAPI(
    title="我的 API",
    description="這是一個完整的 API 文檔範例",
    version="1.0.0",
    lifespan=lifespan,
    openapi_tags=[
        {
            "name": "用戶管理",
            "description": "用戶相關的操作",
        },
        {
            "name": "產品管理",
            "description": "產品相關的操作",
        },
        {
            "name": "預設API",
            "description": "預設api 系統功能檢查",
        }
    ]
)
app.include_router(users.router)
app.include_router(system.router)


class Item(BaseModel):
    name: str
    price: float
    is_offer: Union[bool, None] = None


@app.get("/")
async def root():
    """
    這是root
    :return:
    """
    return {"message": "Hello World"}
