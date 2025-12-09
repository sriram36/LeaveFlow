"""
User Management Routes
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app.database import get_db
from app.auth import get_current_user_required, require_manager, require_admin, require_hr_admin, check_user_access
from app.models import User, UserRole
from app.schemas import UserResponse, UserCreate, UserUpdate, UserWithBalance

router = APIRouter(prefix="/users", tags=["User Management"])


@router.get("/", response_model=List[UserResponse])
async def list_users(
    role: Optional[str] = Query(None, description="Filter by role"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user_required)
):
    """List users based on role permissions."""
    query = select(User).order_by(User.name)
    
    # Role-based filtering
    if user.role == UserRole.worker:
        # Workers can only see themselves and their manager
        query = query.where(
            (User.id == user.id) | (User.id == user.manager_id)
        )
    elif user.role == UserRole.manager:
        # Managers can see their team members and other managers (not Admin/HR)
        query = query.where(
            (User.manager_id == user.id) | 
            (User.role == UserRole.manager) |
            (User.id == user.id)
        )
    elif user.role == UserRole.hr:
        # HR can see all users except Admin
        query = query.where(User.role != UserRole.admin)
    # Admin can see everyone (no filter)
    
    if role:
        query = query.where(User.role == UserRole(role))
    
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/team", response_model=List[UserResponse])
async def get_my_team(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_manager)
):
    """Get current manager's team members."""
    result = await db.execute(
        select(User).where(User.manager_id == user.id).order_by(User.name)
    )
    return result.scalars().all()


@router.get("/{user_id}", response_model=UserWithBalance)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user_required)
):
    """Get a specific user's details with role-based access."""
    result = await db.execute(
        select(User)
        .options(selectinload(User.leave_balance))
        .where(User.id == user_id)
    )
    target_user = result.scalar_one_or_none()
    
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Use centralized access control
    if not check_user_access(user, target_user):
        raise HTTPException(status_code=403, detail="Access denied")
    
    return target_user


@router.post("/", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_hr_admin)
):
    """Create a new user (HR and admin only)."""
    from app.auth import get_password_hash
    
    user = User(
        name=user_data.name,
        phone=user_data.phone,
        email=user_data.email,
        password_hash=get_password_hash(user_data.password) if user_data.password else None,
        role=user_data.role,
        manager_id=user_data.manager_id
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_required)
):
    """Update a user. Users can update their own profile (name, email, phone only)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check permissions - users can only update their own profile
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="You can only update your own profile")
    
    # Update only the allowed fields
    if user_data.name is not None:
        user.name = user_data.name
    if user_data.phone is not None:
        user.phone = user_data.phone
    if user_data.email is not None:
        user.email = user_data.email
    
    await db.commit()
    await db.refresh(user)
    
    return user


@router.put("/{user_id}/admin", response_model=UserResponse)
async def admin_update_user(
    user_id: int,
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_hr_admin)
):
    """Update any user (HR and admin only) - can change role, manager, password."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Admin can update everything
    user.name = user_data.name
    user.phone = user_data.phone
    user.email = user_data.email
    user.role = user_data.role
    user.manager_id = user_data.manager_id
    
    if user_data.password:
        from app.auth import get_password_hash
        user.password_hash = get_password_hash(user_data.password)
    
    await db.commit()
    await db.refresh(user)
    
    return user
