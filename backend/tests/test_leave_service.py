import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date, timedelta
from app.services.leave import LeaveService
from app.models import User, UserRole, LeaveRequest, LeaveType, LeaveStatus
from app.services.validator import LeaveValidationError

@pytest.fixture
async def sample_manager(db_session: AsyncSession):
    manager = User(
        name="Test Manager",
        phone="+919999999991",
        role=UserRole.manager,
        sick_leave_balance=10,
        casual_leave_balance=10
    )
    db_session.add(manager)
    await db_session.commit()
    await db_session.refresh(manager)
    return manager

@pytest.fixture
async def sample_worker(db_session: AsyncSession, sample_manager):
    worker = User(
        name="Test Worker",
        phone="+919999999992",
        role=UserRole.worker,
        manager_id=sample_manager.id,
        sick_leave_balance=5,
        casual_leave_balance=5
    )
    db_session.add(worker)
    await db_session.commit()
    await db_session.refresh(worker)
    return worker

@pytest.mark.asyncio
async def test_create_leave_request_success(db_session: AsyncSession, sample_worker):
    service = LeaveService(db_session)
    
    start = date.today() + timedelta(days=1)
    end = start + timedelta(days=1)
    
    # Needs 2 days of sick leave
    req = await service.create_leave_request(
        user_id=sample_worker.id,
        leave_type=LeaveType.sick,
        start_date=start,
        end_date=end,
        reason="Sick",
        notify_manager=False,
        notify_employee=False
    )
    
    assert req.id is not None
    assert req.status == LeaveStatus.pending
    
    # Check balance deduction (was 5, requested 2, should be 3)
    await db_session.refresh(sample_worker)
    assert sample_worker.sick_leave_balance == 3

@pytest.mark.asyncio
async def test_create_leave_request_insufficient_balance(db_session: AsyncSession, sample_worker):
    service = LeaveService(db_session)
    
    start = date.today() + timedelta(days=1)
    end = start + timedelta(days=10) # 11 days > 5 balance
    
    with pytest.raises(LeaveValidationError, match="Insufficient balance"):
        await service.create_leave_request(
            user_id=sample_worker.id,
            leave_type=LeaveType.sick,
            start_date=start,
            end_date=end,
            reason="Long sickness",
            notify_manager=False,
            notify_employee=False
        )

@pytest.mark.asyncio
async def test_approve_leave_request(db_session: AsyncSession, sample_worker, sample_manager):
    service = LeaveService(db_session)
    
    start = date.today() + timedelta(days=1)
    req = await service.create_leave_request(
        user_id=sample_worker.id,
        leave_type=LeaveType.casual,
        start_date=start,
        end_date=start,
        reason="Test",
        notify_manager=False,
        notify_employee=False
    )
    
    approved_req = await service.approve_leave_request(
        request_id=req.id,
        approver_id=sample_manager.id
    )
    
    assert approved_req.status == LeaveStatus.approved

@pytest.mark.asyncio
async def test_reject_leave_request_refunds_balance(db_session: AsyncSession, sample_worker, sample_manager):
    service = LeaveService(db_session)
    
    initial_balance = sample_worker.casual_leave_balance
    
    start = date.today() + timedelta(days=1)
    req = await service.create_leave_request(
        user_id=sample_worker.id,
        leave_type=LeaveType.casual,
        start_date=start,
        end_date=start,
        reason="Test",
        notify_manager=False,
        notify_employee=False
    )
    
    await db_session.refresh(sample_worker)
    assert sample_worker.casual_leave_balance == initial_balance - 1
    
    rejected_req = await service.reject_leave_request(
        request_id=req.id,
        approver_id=sample_manager.id,
        reason="No"
    )
    
    assert rejected_req.status == LeaveStatus.rejected
    
    await db_session.refresh(sample_worker)
    # Balance should be refunded
    assert sample_worker.casual_leave_balance == initial_balance
