"""Demo reset against real PostgreSQL: foreign keys are enforced and resets can overlap.

Needs TEST_POSTGRES_URL (see test_concurrency.py); skipped without it.
"""
import asyncio
import os

import pytest
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base
from app.models import LeaveRequest, LeaveStatus, User
from app.services.demo_seed import reset_demo_team, seed_demo_team
from app.services.leave import LeaveService

POSTGRES_URL = os.getenv("TEST_POSTGRES_URL")
pytestmark = pytest.mark.skipif(not POSTGRES_URL, reason="TEST_POSTGRES_URL not set")


class _NoopWhatsApp:
    async def send_text(self, *args, **kwargs) -> bool:
        return False


@pytest.fixture
async def session_factory():
    engine = create_async_engine(POSTGRES_URL, pool_size=10)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    held = [await engine.connect() for _ in range(4)]
    for conn in held:
        await conn.close()
    yield async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


async def _counts(factory):
    async with factory() as s:
        users = await s.scalar(select(func.count()).select_from(User))
        by_status = {
            st: await s.scalar(select(func.count()).select_from(LeaveRequest).where(LeaveRequest.status == st))
            for st in LeaveStatus
        }
        return users, by_status


EXPECTED = (9, {LeaveStatus.pending: 4, LeaveStatus.approved: 5, LeaveStatus.rejected: 2, LeaveStatus.cancelled: 1})


async def test_reset_after_real_activity_respects_foreign_keys(session_factory):
    async with session_factory() as s:
        await seed_demo_team(s)
    # Real activity: approve and cancel through the service, which writes audit rows and moves balances.
    async with session_factory() as s:
        manager = await s.scalar(select(User).where(User.phone == "+919000000001"))
        pending = (await s.scalars(select(LeaveRequest).where(LeaveRequest.status == LeaveStatus.pending))).all()
        service = LeaveService(s, whatsapp_service=_NoopWhatsApp())
        await service.approve_leave(pending[0].id, manager.id)
        await service.reject_leave(pending[1].id, manager.id, "busy week")
    assert await _counts(session_factory) != EXPECTED

    async with session_factory() as s:
        await reset_demo_team(s)

    assert await _counts(session_factory) == EXPECTED


async def test_overlapping_first_resets_leave_exactly_one_demo_team(session_factory):
    # No demo team exists yet (e.g. a double-click on the very first reset): every call tries to seed.
    async def reset():
        async with session_factory() as s:
            return await reset_demo_team(s)

    results = await asyncio.gather(reset(), reset(), reset(), return_exceptions=True)

    assert all(isinstance(r, dict) for r in results), results
    assert await _counts(session_factory) == EXPECTED
