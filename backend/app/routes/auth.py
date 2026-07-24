"""
Authentication API Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from app.limiter import limiter

from app.database import get_db
from app.auth import (
    verify_password, get_password_hash, create_access_token,
    get_user_by_email, get_current_user_required
)
from app.schemas import Token, LoginRequest, UserResponse, UserCreate
from app.models import User, AccountStatus
from app.config import get_settings

settings = get_settings()

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
async def login(
    request: Request,
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
) -> Token:
    """Login with email and password."""
    user = await get_user_by_email(db, form_data.username)
    
    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.id})
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True, # Must be true for SameSite=None
        samesite="none",
        max_age=settings.access_token_expire_minutes * 60
    )
    return Token(access_token=access_token, token_type="bearer")


@router.post("/logout")
async def logout(response: Response) -> dict:
    """Logout by clearing the HttpOnly cookie."""
    response.delete_cookie(
        key="access_token",
        httponly=True,
        secure=True,
        samesite="none"
    )
    return {"message": "Logged out successfully"}


@router.post("/register", response_model=UserResponse)
@limiter.limit("5/minute")
async def register(
    request: Request,
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
) -> User:
    """Register a new user (for dashboard access)."""
    from app.models import UserRole
    # Workers cannot create accounts through signup
    if user_data.role == UserRole.worker:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Workers cannot create accounts through signup. Please contact your manager or HR."
        )
    
    # Check if email already exists
    if user_data.email:
        existing = await get_user_by_email(db, user_data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    # Auto-approve all accounts for now for testing purposes
    account_status = AccountStatus.active
    
    # Create user
    user = User(
        name=user_data.name,
        phone=user_data.phone,
        email=user_data.email,
        password_hash=get_password_hash(user_data.password) if user_data.password else None,
        role=user_data.role,
        manager_id=user_data.manager_id,
        account_status=account_status
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return user


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user_required)) -> User:
    """Get current user info."""
    return user
