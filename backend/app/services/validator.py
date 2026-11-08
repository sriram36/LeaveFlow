"""
Leave Validation Engine

Handles all business logic for leave validation:
- Overlap detection
- Leave balance checks
- Holiday detection
- Weekend skipping
- Date range calculations
"""

from datetime import date, timedelta
from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_, or_
from sqlalchemy.exc import IntegrityError
from app.models import LeaveRequest, LeaveBalance, Holiday, LeaveStatus, LeaveType, DurationType, User


class LeaveValidationError(Exception):
    """Custom exception for validation errors."""
    def __init__(self, message: str, code: str = "VALIDATION_ERROR"):
        self.message = message
        self.code = code
        super().__init__(self.message)


class LeaveValidator:
    """Validates leave requests against business rules."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def validate_leave_request(
        self,
        user_id: int,
        start_date: date,
        end_date: date,
        leave_type: LeaveType,
        is_half_day: bool = False
    ) -> Tuple[bool, float, Optional[str]]:
        """
        Validate a leave request.
        
        Returns:
            Tuple of (is_valid, calculated_days, warning_message)
        """
        warnings = []
        
        # 1. Validate date range
        if end_date < start_date:
            raise LeaveValidationError("End date cannot be before start date", "INVALID_DATE_RANGE")
        
        if start_date < date.today():
            raise LeaveValidationError("Cannot apply for leave in the past", "PAST_DATE")
        
        # 2. Calculate working days (excluding weekends and holidays)
        holidays = await self._get_holidays(start_date, end_date)
        working_days = self._calculate_working_days(start_date, end_date, holidays)
        
        if is_half_day:
            working_days = 0.5
        
        if working_days <= 0:
            raise LeaveValidationError(
                "No working days in the selected range (all weekends/holidays)",
                "NO_WORKING_DAYS"
            )
        
        # 3. Check for overlapping leaves
        has_overlap = await self._check_overlap(user_id, start_date, end_date)
        if has_overlap:
            raise LeaveValidationError(
                "You already have a leave request for these dates",
                "OVERLAPPING_LEAVE"
            )
        
        # 4. Check for pending requests
        has_pending = await self._check_pending_requests(user_id)
        if has_pending:
            warnings.append("You have other pending leave requests")
        
        # 5. Check leave balance
        balance = await self._get_balance(user_id, leave_type)
        if balance < working_days:
            raise LeaveValidationError(
                f"Insufficient balance for {leave_type.value} leave. Available: {balance}, Required: {working_days}",
                "INSUFFICIENT_BALANCE"
            )
        
        # 6. Check if dates include holidays (warning only)
        if holidays:
            holiday_names = [h.name for h in holidays]
            warnings.append(f"Your leave includes holidays: {', '.join(holiday_names)}")
        
        warning_msg = "; ".join(warnings) if warnings else None
        return True, working_days, warning_msg
    
    async def _get_holidays(self, start_date: date, end_date: date) -> List[Holiday]:
        """Get holidays within the date range."""
        result = await self.db.execute(
            select(Holiday).where(
                and_(
                    Holiday.date >= start_date,
                    Holiday.date <= end_date
                )
            )
        )
        return result.scalars().all()
    
    def _calculate_working_days(
        self,
        start_date: date,
        end_date: date,
        holidays: List[Holiday]
    ) -> float:
        """Calculate working days excluding weekends and holidays."""
        holiday_dates = {h.date for h in holidays}
        working_days = 0
        current = start_date
        
        while current <= end_date:
            # Skip weekends (5 = Saturday, 6 = Sunday)
            if current.weekday() < 5 and current not in holiday_dates:
                working_days += 1
            current += timedelta(days=1)
        
        return float(working_days)
    
    async def _check_overlap(self, user_id: int, start_date: date, end_date: date) -> bool:
        """Check if user has overlapping leave requests."""
        result = await self.db.execute(
            select(LeaveRequest).where(
                and_(
                    LeaveRequest.user_id == user_id,
                    LeaveRequest.status.in_([LeaveStatus.pending, LeaveStatus.approved]),
                    or_(
                        and_(
                            LeaveRequest.start_date <= start_date,
                            LeaveRequest.end_date >= start_date
                        ),
                        and_(
                            LeaveRequest.start_date <= end_date,
                            LeaveRequest.end_date >= end_date
                        ),
                        and_(
                            LeaveRequest.start_date >= start_date,
                            LeaveRequest.end_date <= end_date
                        )
                    )
                )
            )
        )
        return result.first() is not None
    
    async def _check_pending_requests(self, user_id: int) -> bool:
        """Check if user has other pending requests."""
        result = await self.db.execute(
            select(LeaveRequest).where(
                and_(
                    LeaveRequest.user_id == user_id,
                    LeaveRequest.status == LeaveStatus.pending
                )
            )
        )
        return result.first() is not None
    
    async def _get_balance(self, user_id: int, leave_type: LeaveType) -> float:
        """Get user's leave balance for the given type (read only, never commits)."""
        balance = await ensure_balance_row(self.db, user_id)
        return getattr(balance, leave_type.value)


async def ensure_balance_row(db: AsyncSession, user_id: int, lock: bool = False) -> LeaveBalance:
    """Return the user's LeaveBalance row, creating it from the user's seed values if missing.

    Safe when several requests seed the same user at once: the insert runs in a savepoint,
    and the loser of the unique(user_id) race just re-reads the winner's row.
    Never commits; the caller owns the transaction. With lock=True the row is locked
    (SELECT ... FOR UPDATE) until the caller's transaction ends.
    """
    query = select(LeaveBalance).where(LeaveBalance.user_id == user_id)
    if lock:
        query = query.with_for_update()
        # Refresh in case this session already holds an older copy of the row.
        query = query.execution_options(populate_existing=True)

    balance = (await db.execute(query)).scalar_one_or_none()
    if balance:
        return balance

    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    new_balance = LeaveBalance(
        user_id=user_id,
        year=date.today().year,
        casual=user.casual_leave_balance if user else 12.0,
        sick=user.sick_leave_balance if user else 12.0,
        special=user.special_leave_balance if user else 5.0,
    )
    try:
        async with db.begin_nested():
            db.add(new_balance)
    except IntegrityError:
        # Another request created the row first.
        pass
    return (await db.execute(query)).scalar_one()


async def deduct_balance(db: AsyncSession, user_id: int, leave_type: LeaveType, days: float) -> bool:
    """Atomically reserve `days` of balance. Returns False if there is not enough.

    One conditional UPDATE does the check and the write together, so two concurrent
    requests cannot both spend the same days. Does not commit: the caller commits
    this together with the leave request, so both succeed or fail as one.
    """
    await ensure_balance_row(db, user_id)
    column = leave_type.value

    result = await db.execute(
        update(LeaveBalance)
        .where(LeaveBalance.user_id == user_id, getattr(LeaveBalance, column) >= days)
        .values({column: getattr(LeaveBalance, column) - days})
    )
    if result.rowcount == 0:
        return False

    await _mirror_to_user(db, user_id, leave_type, -days)
    return True


async def refund_balance(db: AsyncSession, user_id: int, leave_type: LeaveType, days: float) -> bool:
    """Atomically give `days` of balance back. Does not commit; the caller commits."""
    await ensure_balance_row(db, user_id)
    column = leave_type.value

    result = await db.execute(
        update(LeaveBalance)
        .where(LeaveBalance.user_id == user_id)
        .values({column: getattr(LeaveBalance, column) + days})
    )
    if result.rowcount == 0:
        return False

    await _mirror_to_user(db, user_id, leave_type, days)
    return True


async def _mirror_to_user(db: AsyncSession, user_id: int, leave_type: LeaveType, delta: float) -> None:
    """Apply the same relative change to the legacy User.<type>_leave_balance column.

    LeaveBalance is the source of truth; the User columns are a mirror the dashboard
    still reads. A relative update (col = col + delta) cannot overwrite a concurrent change.
    """
    column = f"{leave_type.value}_leave_balance"
    await db.execute(
        update(User).where(User.id == user_id).values({column: getattr(User, column) + delta})
    )
