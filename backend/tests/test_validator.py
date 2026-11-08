from sqlalchemy import select
import pytest
from datetime import date, timedelta
from unittest.mock import AsyncMock, MagicMock
from app.services.validator import LeaveValidator, LeaveValidationError, deduct_balance, refund_balance
from app.models import LeaveType, Holiday, LeaveRequest, LeaveStatus, User, LeaveBalance

@pytest.mark.asyncio
async def test_validate_date_range_error():
    db = AsyncMock()
    validator = LeaveValidator(db)
    
    start_date = date.today()
    end_date = start_date - timedelta(days=1)
    
    with pytest.raises(LeaveValidationError) as exc:
        await validator.validate_leave_request(
            user_id=1,
            start_date=start_date,
            end_date=end_date,
            leave_type=LeaveType.casual
        )
    assert exc.value.code == "INVALID_DATE_RANGE"

@pytest.mark.asyncio
async def test_validate_past_date_error():
    db = AsyncMock()
    validator = LeaveValidator(db)
    
    start_date = date.today() - timedelta(days=2)
    end_date = date.today() - timedelta(days=1)
    
    with pytest.raises(LeaveValidationError) as exc:
        await validator.validate_leave_request(
            user_id=1,
            start_date=start_date,
            end_date=end_date,
            leave_type=LeaveType.casual
        )
    assert exc.value.code == "PAST_DATE"

@pytest.mark.asyncio
async def test_calculate_working_days():
    validator = LeaveValidator(AsyncMock())
    
    # Monday to Friday
    start_date = date(2026, 7, 20)  # Monday
    end_date = date(2026, 7, 24)    # Friday
    working_days = validator._calculate_working_days(start_date, end_date, [])
    assert working_days == 5.0
    
    # Thursday to Tuesday (crosses weekend)
    start_date = date(2026, 7, 23)  # Thursday
    end_date = date(2026, 7, 28)    # Tuesday
    working_days = validator._calculate_working_days(start_date, end_date, [])
    assert working_days == 4.0
    
    # With holidays
    holiday = Holiday(date=date(2026, 7, 24), name="Holiday")
    start_date = date(2026, 7, 20)
    end_date = date(2026, 7, 24)
    working_days = validator._calculate_working_days(start_date, end_date, [holiday])
    assert working_days == 4.0

@pytest.mark.asyncio
async def test_validate_insufficient_balance():
    db = AsyncMock()
    validator = LeaveValidator(db)
    
    start_date = date.today() + timedelta(days=1)
    # Ensure it doesn't cross a weekend (assume today is Monday for simplicity in this mock, or just mock _calculate_working_days)
    validator._calculate_working_days = MagicMock(return_value=10.0)
    validator._get_holidays = AsyncMock(return_value=[])
    validator._check_overlap = AsyncMock(return_value=False)
    validator._check_pending_requests = AsyncMock(return_value=False)
    validator._get_balance = AsyncMock(return_value=5.0)
    
    with pytest.raises(LeaveValidationError) as exc:
        await validator.validate_leave_request(
            user_id=1,
            start_date=start_date,
            end_date=start_date + timedelta(days=9),
            leave_type=LeaveType.casual
        )
    assert exc.value.code == "INSUFFICIENT_BALANCE"

@pytest.mark.asyncio
async def test_validate_success():
    db = AsyncMock()
    validator = LeaveValidator(db)
    
    start_date = date.today() + timedelta(days=1)
    validator._calculate_working_days = MagicMock(return_value=2.0)
    validator._get_holidays = AsyncMock(return_value=[])
    validator._check_overlap = AsyncMock(return_value=False)
    validator._check_pending_requests = AsyncMock(return_value=False)
    validator._get_balance = AsyncMock(return_value=12.0)
    
    is_valid, working_days, warning_msg = await validator.validate_leave_request(
        user_id=1,
        start_date=start_date,
        end_date=start_date + timedelta(days=1),
        leave_type=LeaveType.casual
    )
    
    assert is_valid is True
    assert working_days == 2.0
    assert warning_msg is None

@pytest.fixture
async def user_with_balance(db_session):
    user = User(name="Bal User", phone="+15550000001", casual_leave_balance=10.0)
    db_session.add(user)
    await db_session.commit()
    db_session.add(LeaveBalance(user_id=user.id, year=2026, casual=10.0, sick=12.0, special=5.0))
    await db_session.commit()
    return user


@pytest.mark.asyncio
async def test_deduct_balance_updates_balance_and_user_mirror(db_session, user_with_balance):
    assert await deduct_balance(db_session, user_with_balance.id, LeaveType.casual, 2.0) is True

    balance = await db_session.scalar(select(LeaveBalance).where(LeaveBalance.user_id == user_with_balance.id))
    await db_session.refresh(user_with_balance)
    assert balance.casual == 8.0
    assert user_with_balance.casual_leave_balance == 8.0


@pytest.mark.asyncio
async def test_deduct_balance_refuses_to_go_negative(db_session, user_with_balance):
    assert await deduct_balance(db_session, user_with_balance.id, LeaveType.casual, 10.5) is False

    balance = await db_session.scalar(select(LeaveBalance).where(LeaveBalance.user_id == user_with_balance.id))
    assert balance.casual == 10.0


@pytest.mark.asyncio
async def test_refund_balance_adds_days_back(db_session, user_with_balance):
    await deduct_balance(db_session, user_with_balance.id, LeaveType.casual, 3.0)
    assert await refund_balance(db_session, user_with_balance.id, LeaveType.casual, 3.0) is True

    balance = await db_session.scalar(select(LeaveBalance).where(LeaveBalance.user_id == user_with_balance.id))
    assert balance.casual == 10.0
