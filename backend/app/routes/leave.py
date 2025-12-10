"""
Leave API Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import date, datetime

from app.database import get_db
from app.auth import get_current_user_required, require_manager, require_admin, check_user_access
from app.models import User, LeaveStatus, LeaveRequest, LeaveBalance, LeaveBalanceHistory, LeaveType
from app.schemas import (
    LeaveRequestResponse, LeaveRequestCreate, ApproveRequest, RejectRequest,
    LeaveBalanceResponse, TodayLeaveResponse, UserResponse, LeaveBalanceHistoryResponse
)
from app.services.leave import LeaveService
from app.services.validator import LeaveValidationError

router = APIRouter(prefix="/leave", tags=["Leave Management"])


def check_leave_request_access(user: User, request: LeaveRequest) -> bool:
    """Check if user has access to view a leave request."""
    from app.models import UserRole
    # Workers can only see their own requests
    if user.role == UserRole.worker:
        return request.user_id == user.id
    # Managers, HR, and Admin can see all requests
    return True


@router.get("/pending", response_model=List[LeaveRequestResponse])
async def get_pending_requests(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_manager)
):
    """Get all pending leave requests (for managers)."""
    service = LeaveService(db)
    requests = await service.get_pending_requests(manager_id=user.id)
    return requests


@router.get("/today", response_model=TodayLeaveResponse)
async def get_today_leaves(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user_required)
):
    """Get employees on leave today."""
    service = LeaveService(db)
    leaves = await service.get_today_leaves()
    return TodayLeaveResponse(
        employees=[UserResponse(**l) for l in leaves] if leaves else [],
        count=len(leaves)
    )


@router.get("/history", response_model=List[LeaveRequestResponse])
async def get_leave_history(
    status: Optional[str] = Query(None, description="Filter by status"),
    user_id: Optional[int] = Query(None, description="Filter by user"),
    limit: int = Query(100, le=500),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user_required)
):
    """Get leave request history."""
    service = LeaveService(db)
    from app.models import UserRole
    
    status_enum = LeaveStatus(status) if status else None
    
    # Non-managers can only see their own history
    if user.role == UserRole.worker:
        user_id = user.id
    
    requests = await service.get_history(user_id=user_id, status=status_enum, limit=limit)
    return requests


@router.get("/balance", response_model=LeaveBalanceResponse)
async def get_my_balance(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user_required)
):
    """Get current user's leave balance."""
    service = LeaveService(db)
    balance = await service.get_balance(user.id)
    return LeaveBalanceResponse(
        id=0,
        user_id=user.id,
        year=date.today().year,
        **balance
    )


@router.get("/balance/{user_id}", response_model=LeaveBalanceResponse)
async def get_user_balance(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_manager)
):
    """Get a user's leave balance (manager only)."""
    service = LeaveService(db)
    balance = await service.get_balance(user_id)
    return LeaveBalanceResponse(
        id=0,
        user_id=user_id,
        year=date.today().year,
        **balance
    )


@router.get("/{request_id}", response_model=LeaveRequestResponse)
async def get_leave_request(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user_required)
):
    """Get a specific leave request."""
    service = LeaveService(db)
    request = await service.get_status(request_id)
    
    if not request:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    # Check access permissions
    if not check_leave_request_access(user, request):
        raise HTTPException(status_code=403, detail="Access denied")
    
    return request


@router.post("/approve/{request_id}", response_model=LeaveRequestResponse)
async def approve_leave_request(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_manager)
):
    """Approve a leave request."""
    service = LeaveService(db)
    
    try:
        request = await service.approve_leave(request_id, user.id)
        return request
    except LeaveValidationError as e:
        raise HTTPException(status_code=400, detail=e.message)


@router.post("/reject/{request_id}", response_model=LeaveRequestResponse)
async def reject_leave_request(
    request_id: int,
    body: RejectRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_manager)
):
    """Reject a leave request."""
    service = LeaveService(db)
    
    try:
        request = await service.reject_leave(request_id, user.id, body.reason)
        return request
    except LeaveValidationError as e:
        raise HTTPException(status_code=400, detail=e.message)


@router.post("/cancel/{request_id}", response_model=LeaveRequestResponse)
async def cancel_leave_request(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user_required)
):
    """Cancel a leave request (by employee)."""
    service = LeaveService(db)
    
    try:
        request = await service.cancel_leave(request_id, user.id)
        return request
    except LeaveValidationError as e:
        raise HTTPException(status_code=400, detail=e.message)


@router.get("/{request_id}/attachment")
async def get_attachment(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user_required)
):
    """Get attachments for a leave request."""
    service = LeaveService(db)
    request = await service.get_status(request_id)
    
    if not request:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    # Check access permissions
    if not check_leave_request_access(user, request):
        raise HTTPException(status_code=403, detail="Access denied")
    
    return request.attachments


@router.get("/balance/history", response_model=List[LeaveBalanceHistoryResponse])
async def get_balance_history(
    user_id: Optional[int] = Query(None, description="Filter by user (admin/HR only)"),
    leave_type: Optional[LeaveType] = Query(None, description="Filter by leave type"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user_required)
):
    """Get leave balance change history for audit trail."""
    query = select(LeaveBalanceHistory).order_by(LeaveBalanceHistory.created_at.desc())
    
    # If user_id provided, check permissions
    if user_id:
        # Only HR/Admin can view others' history
        if user.role not in ["hr", "admin"] and user_id != user.id:
            raise HTTPException(status_code=403, detail="Cannot view other users' balance history")
        query = query.where(LeaveBalanceHistory.user_id == user_id)
    else:
        # Regular users can only see their own
        if user.role not in ["hr", "admin", "manager"]:
            query = query.where(LeaveBalanceHistory.user_id == user.id)
    
    if leave_type:
        query = query.where(LeaveBalanceHistory.leave_type == leave_type)
    
    result = await db.execute(query.limit(100))
    return result.scalars().all()


@router.post("/carry-forward")
async def carry_forward_leaves(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Carry forward unused leaves to next year (Admin only).
    Run this at year end. Max 5 casual days can be carried forward.
    """
    current_year = datetime.now().year
    next_year = current_year + 1
    
    # Get all balances for current year
    result = await db.execute(
        select(LeaveBalance).where(LeaveBalance.year == current_year)
    )
    balances = result.scalars().all()
    
    carried_forward_count = 0
    
    for balance in balances:
        # Check if next year balance already exists
        existing = await db.execute(
            select(LeaveBalance).where(
                and_(
                    LeaveBalance.user_id == balance.user_id,
                    LeaveBalance.year == next_year
                )
            )
        )
        if existing.scalar_one_or_none():
            continue  # Skip if already exists
        
        # Calculate carry forward (max 5 casual days)
        casual_carryover = min(balance.casual, 5.0) if balance.casual > 0 else 0.0
        
        # Create new year balance with carried forward leave
        new_balance = LeaveBalance(
            user_id=balance.user_id,
            casual=12.0 + casual_carryover,
            sick=12.0,
            special=5.0,
            year=next_year
        )
        db.add(new_balance)
        
        # Record in history
        if casual_carryover > 0:
            history = LeaveBalanceHistory(
                user_id=balance.user_id,
                leave_type=LeaveType.casual,
                days_changed=casual_carryover,
                balance_after=12.0 + casual_carryover,
                reason=f"Carried forward from {current_year}"
            )
            db.add(history)
        
        carried_forward_count += 1
    
    await db.commit()
    
    return {
        "message": f"Carry forward completed for {carried_forward_count} employees",
        "year": next_year,
        "carried_forward_count": carried_forward_count
    }


@router.get("/requests/search", response_model=List[LeaveRequestResponse])
async def advanced_search(
    user_name: Optional[str] = Query(None, description="Search by employee name"),
    status: Optional[LeaveStatus] = Query(None, description="Filter by status"),
    leave_type: Optional[LeaveType] = Query(None, description="Filter by leave type"),
    date_from: Optional[date] = Query(None, description="Leave start date from"),
    date_to: Optional[date] = Query(None, description="Leave start date to"),
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user_required)
):
    """
    Advanced search for leave requests with multiple filters.
    Managers see their team, HR/Admin see all.
    """
    query = select(LeaveRequest).options(
        selectinload(LeaveRequest.user),
        selectinload(LeaveRequest.approver),
        selectinload(LeaveRequest.attachments)
    )
    
    # Role-based filtering
    from app.models import UserRole
    if user.role == UserRole.worker:
        query = query.where(LeaveRequest.user_id == user.id)
    elif user.role == UserRole.manager:
        # Managers see their team's requests
        query = query.join(User).where(
            or_(
                User.manager_id == user.id,
                LeaveRequest.user_id == user.id
            )
        )
    # HR and Admin see all (no additional filter)
    
    # Apply search filters
    if user_name:
        query = query.join(User).where(User.name.ilike(f"%{user_name}%"))
    
    if status:
        query = query.where(LeaveRequest.status == status)
    
    if leave_type:
        query = query.where(LeaveRequest.leave_type == leave_type)
    
    if date_from:
        query = query.where(LeaveRequest.start_date >= date_from)
    
    if date_to:
        query = query.where(LeaveRequest.start_date <= date_to)
    
    if user_id:
        # Check permission to view specific user
        if user.role not in ["hr", "admin", "manager"] and user_id != user.id:
            raise HTTPException(status_code=403, detail="Cannot view other users' requests")
        query = query.where(LeaveRequest.user_id == user_id)
    
    query = query.order_by(LeaveRequest.created_at.desc()).limit(100)
    
    result = await db.execute(query)
    return result.scalars().all()

