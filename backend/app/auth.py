"""
Authentication utilities
"""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import get_settings
from app.database import get_db
from app.models import User, UserRole

settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login",
    auto_error=True
)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    to_encode.update({"exp": expire})
    
    # Ensure 'sub' is a string (JWT standard)
    if "sub" in to_encode and not isinstance(to_encode["sub"], str):
        to_encode["sub"] = str(to_encode["sub"])
    
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Get the current authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id_str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        
        # Convert sub to int (sub is stored as string in JWT)
        try:
            user_id = int(user_id_str)
        except (ValueError, TypeError):
            raise credentials_exception
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    return user


async def get_current_user_required(
    user: User = Depends(get_current_user)
) -> User:
    """Get the current user or raise 401."""
    return user


async def require_manager(
    user: User = Depends(get_current_user_required)
) -> User:
    """Require manager, HR, or Admin role."""
    if user.role not in [UserRole.manager, UserRole.hr, UserRole.admin]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager, HR, or Admin role required"
        )
    return user


async def require_admin(
    user: User = Depends(get_current_user_required)
) -> User:
    """Require admin role."""
    if user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required"
        )
    return user


async def require_hr_admin(
    user: User = Depends(get_current_user_required)
) -> User:
    """Require HR or Admin role."""
    if user.role not in [UserRole.hr, UserRole.admin]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="HR or Admin role required"
        )
    return user


def check_user_access(current_user: User, target_user: User) -> bool:
    """
    Centralized user access checker.
    Returns True if current_user can access target_user's information.
    """
    # Admin can access everything
    if current_user.role == UserRole.admin:
        return True
    
    # HR can access everything except Admin users
    if current_user.role == UserRole.hr:
        return target_user.role != UserRole.admin
    
    # Manager can access their team members and other managers
    if current_user.role == UserRole.manager:
        is_team_member = target_user.manager_id == current_user.id
        is_manager = target_user.role == UserRole.manager
        is_self = target_user.id == current_user.id
        return is_team_member or is_manager or is_self
    
    # Workers can only access themselves and their manager
    if current_user.role == UserRole.worker:
        is_self = target_user.id == current_user.id
        is_manager = target_user.id == current_user.manager_id
        return is_self or is_manager
    
    return False


async def get_user_by_phone(db: AsyncSession, phone: str) -> Optional[User]:
    """Get a user by phone number."""
    result = await db.execute(select(User).where(User.phone == phone))
    return result.scalar_one_or_none()


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    """Get a user by email."""
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()
