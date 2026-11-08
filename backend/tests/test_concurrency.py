"""
Concurrency tests for balance and approval handling.

These need a database that really enforces row locking and isolation, so they
run against PostgreSQL only. Point TEST_POSTGRES_URL at a throwaway database
(its tables are dropped and recreated for every test), e.g.

    TEST_POSTGRES_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/leaveflow_test

Without it the whole module is skipped; the SQLite suite stays as is.
"""
import asyncio
import os
from datetime import date, timedelta

import pytest
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

import app.services.leave as leave_module
from app.database import Base
from app.models import (
    AuditLog, LeaveBalance, LeaveRequest, LeaveStatus, LeaveType, User, UserRole,
)
from app.services.leave import LeaveService
from app.services.validator import LeaveValidationError

POSTGRES_URL = os.getenv("TEST_POSTGRES_URL")

pytestmark = pytest.mark.skipif(
    not POSTGRES_URL, reason="TEST_POSTGRES_URL not set (concurrency tests need PostgreSQL)"
)


class _NoopWhatsApp:
    async def send_text(self, *args, **kwargs) -> bool:
        return False


@pytest.fixture
async def session_factory():
    engine = create_async_engine(POSTGRES_URL, pool_size=20)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    # Open the pool's connections up front. Otherwise connection setup staggers the
    # tasks so much that they run one after another and never actually race.
    held = [await engine.connect() for _ in range(10)]
    for conn in held:
        await conn.close()
    yield async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture
async def team(session_factory):
    """A manager, an employee (casual balance 4) and an HR user, all committed."""
    async with session_factory() as s:
        manager = User(name="Manager", phone="+10000000001", role=UserRole.manager)
        hr = User(name="HR", phone="+10000000003", role=UserRole.hr)
        s.add_all([manager, hr])
        await s.flush()
        worker = User(
            name="Worker", phone="+10000000002", role=UserRole.worker, manager_id=manager.id,
            casual_leave_balance=4, sick_leave_balance=4, special_leave_balance=2,
        )
        s.add(worker)
        await s.commit()
        return {"manager": manager.id, "hr": hr.id, "worker": worker.id}


def _monday(weeks_ahead: int) -> date:
    d = date.today() + timedelta(days=1)
    while d.weekday() != 0:
        d += timedelta(days=1)
    return d + timedelta(weeks=weeks_ahead)


async def _in_own_session(session_factory, fn):
    """Run fn(LeaveService) in its own session, like one HTTP request would."""
    async with session_factory() as s:
        return await fn(LeaveService(s, whatsapp_service=_NoopWhatsApp()))


async def _create(session_factory, user_id, week, days=3, leave_type=LeaveType.casual):
    start = _monday(week)
    return await _in_own_session(
        session_factory,
        lambda svc: svc.create_leave_request(
            user_id=user_id, start_date=start, end_date=start + timedelta(days=days - 1),
            leave_type=leave_type, notify_manager=False, notify_employee=False,
        ),
    )


async def _balances(session_factory, user_id):
    async with session_factory() as s:
        bal = (await s.execute(select(LeaveBalance).where(LeaveBalance.user_id == user_id))).scalar_one()
        user = (await s.execute(select(User).where(User.id == user_id))).scalar_one()
        return bal.casual, user.casual_leave_balance


async def test_first_use_balance_seeding_is_safe_under_concurrency(session_factory, team):
    results = await asyncio.gather(
        *[_in_own_session(session_factory, lambda svc: svc.get_balance(team["worker"])) for _ in range(6)],
        return_exceptions=True,
    )

    assert all(isinstance(r, dict) for r in results), results
    assert {r["casual"] for r in results} == {4}
    async with session_factory() as s:
        assert await s.scalar(select(func.count()).select_from(LeaveBalance)) == 1


async def test_concurrent_creates_cannot_overdraw_balance(session_factory, team):
    # Seed the balance row first so this test targets the deduction race only.
    await _in_own_session(session_factory, lambda svc: svc.get_balance(team["worker"]))

    # 4 days available; each request needs 3 days on different weeks -> only one fits.
    results = await asyncio.gather(
        *[_create(session_factory, team["worker"], week=i + 1) for i in range(10)],
        return_exceptions=True,
    )

    ok = [r for r in results if isinstance(r, LeaveRequest)]
    failed = [r for r in results if isinstance(r, LeaveValidationError)]
    assert len(ok) == 1, results
    assert len(failed) == 9, results
    assert {f.code for f in failed} == {"INSUFFICIENT_BALANCE"}
    assert await _balances(session_factory, team["worker"]) == (1, 1)


async def test_concurrent_approvals_only_one_wins(session_factory, team):
    req = await _create(session_factory, team["worker"], week=1, days=1)

    results = await asyncio.gather(
        _in_own_session(session_factory, lambda svc: svc.approve_leave(req.id, team["manager"])),
        _in_own_session(session_factory, lambda svc: svc.approve_leave(req.id, team["hr"])),
        return_exceptions=True,
    )

    ok = [r for r in results if isinstance(r, LeaveRequest)]
    failed = [r for r in results if isinstance(r, LeaveValidationError)]
    assert len(ok) == 1, results
    assert len(failed) == 1 and failed[0].code == "ALREADY_PROCESSED", results
    async with session_factory() as s:
        approvals = await s.scalar(
            select(func.count()).select_from(AuditLog)
            .where(AuditLog.leave_request_id == req.id, AuditLog.action == "approved")
        )
    assert approvals == 1


async def test_concurrent_reject_and_cancel_refund_exactly_once(session_factory, team):
    req = await _create(session_factory, team["worker"], week=1, days=3)
    assert await _balances(session_factory, team["worker"]) == (1, 1)

    results = await asyncio.gather(
        _in_own_session(session_factory, lambda svc: svc.reject_leave(req.id, team["manager"], "no")),
        _in_own_session(session_factory, lambda svc: svc.cancel_leave(req.id, team["worker"])),
        return_exceptions=True,
    )

    assert sum(isinstance(r, LeaveRequest) for r in results) == 1, results
    assert sum(isinstance(r, LeaveValidationError) for r in results) == 1, results
    assert await _balances(session_factory, team["worker"]) == (4, 4)


async def test_failure_after_reserving_balance_leaves_nothing_reserved(session_factory, team, monkeypatch):
    await _in_own_session(session_factory, lambda svc: svc.get_balance(team["worker"]))

    def broken_request(*args, **kwargs):
        raise RuntimeError("boom while building the request")

    monkeypatch.setattr(leave_module, "LeaveRequest", broken_request)
    with pytest.raises(RuntimeError):
        await _create(session_factory, team["worker"], week=1, days=3)
    monkeypatch.undo()

    assert await _balances(session_factory, team["worker"]) == (4, 4)
    async with session_factory() as s:
        assert await s.scalar(select(func.count()).select_from(LeaveRequest)) == 0


async def test_concurrent_creates_for_same_dates_do_not_overlap(session_factory, team):
    results = await asyncio.gather(
        *[_create(session_factory, team["worker"], week=1, days=1) for _ in range(4)],
        return_exceptions=True,
    )

    ok = [r for r in results if isinstance(r, LeaveRequest)]
    failed = [r for r in results if isinstance(r, LeaveValidationError)]
    assert len(ok) == 1, results
    assert {f.code for f in failed} == {"OVERLAPPING_LEAVE"}, results
    assert await _balances(session_factory, team["worker"]) == (3, 3)
