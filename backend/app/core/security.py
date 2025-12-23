"""
安全工具模組
包含 JWT 生成/驗證、密碼加密等功能
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from passlib.hash import argon2
from jose import JWTError, jwt
from fastapi import HTTPException, status

from app.core.config import settings


# ==================== 密碼加密 ====================

def hash_password(password: str) -> str:
    """
    使用 Argon2 加密密碼

    Args:
        password: 明文密碼

    Returns:
        加密後的密碼
    """
    return argon2.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    驗證密碼

    Args:
        plain_password: 明文密碼
        hashed_password: 加密後的密碼

    Returns:
        密碼是否正確
    """
    try:
        return argon2.verify(plain_password, hashed_password)
    except Exception:
        return False


# ==================== JWT Token ====================

def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    生成 JWT access token

    Args:
        data: 要編碼的數據（通常包含用戶 ID、用戶名等）
        expires_delta: 過期時間增量，默認使用配置中的值

    Returns:
        JWT token 字符串
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRE_HOURS)

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )

    return encoded_jwt


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    解碼 JWT token

    Args:
        token: JWT token 字符串

    Returns:
        解碼後的數據

    Raises:
        HTTPException: token 無效或過期
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"無效的認證憑證: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """
    驗證 token（不拋出異常版本）

    Args:
        token: JWT token 字符串

    Returns:
        解碼後的數據，如果無效則返回 None
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        return None
