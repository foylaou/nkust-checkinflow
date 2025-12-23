"""
通用 Schema
"""
from typing import Optional, Generic, TypeVar, List
from pydantic import BaseModel

T = TypeVar('T')


class ResponseBase(BaseModel):
    """基礎響應模型"""
    success: bool = True
    message: Optional[str] = None


class DataResponse(ResponseBase, Generic[T]):
    """帶數據的響應模型"""
    data: T


class ErrorResponse(BaseModel):
    """錯誤響應模型"""
    success: bool = False
    error: str
    detail: Optional[str] = None


class PaginationParams(BaseModel):
    """分頁參數"""
    page: int = 1
    page_size: int = 20


class PaginatedResponse(ResponseBase, Generic[T]):
    """分頁響應模型"""
    data: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int
