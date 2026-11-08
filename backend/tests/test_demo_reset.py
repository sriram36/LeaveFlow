import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select, update

from app.auth import get_current_user_required
from app.models import LeaveRequest, LeaveStatus, LeaveType, User, UserRole
from app.services.demo_seed import reset_demo_team, seed_demo_team


async def _count(db, model, *where):
    return await db.scalar(select(func.count()).select_from(model).where(*where))


async def _status_counts(db):
    return {
        s: await _count(db, LeaveRequest, LeaveRequest.status == s) for s in LeaveStatus
    }


@pytest.mark.asyncio
async def test_seed_creates_demo_team(db_session):
    result = await seed_demo_team(db_session)

    assert result == {"users": 9, "requests": 12}
    assert await _status_counts(db_session) == {
        LeaveStatus.pending: 4, LeaveStatus.approved: 5,
        LeaveStatus.rejected: 2, LeaveStatus.cancelled: 1,
    }


@pytest.mark.asyncio
async def test_seed_twice_does_nothing(db_session):
    await seed_demo_team(db_session)

    assert await seed_demo_team(db_session) is None
    assert await _count(db_session, User) == 9


@pytest.mark.asyncio
async def test_reset_restores_the_starting_state(db_session):
    await seed_demo_team(db_session)
    before = await _status_counts(db_session)
    await db_session.execute(
        update(LeaveRequest).where(LeaveRequest.status == LeaveStatus.pending).values(status=LeaveStatus.approved)
    )
    await db_session.commit()
    assert await _status_counts(db_session) != before

    result = await reset_demo_team(db_session)

    assert result == {"users": 9, "requests": 12}
    assert await _status_counts(db_session) == before
    assert await _count(db_session, User) == 9


@pytest.mark.asyncio
async def test_reset_does_not_touch_other_people(db_session):
    outsider = User(name="Real Person", phone="+15550001111", role=UserRole.worker)
    db_session.add(outsider)
    await db_session.commit()
    db_session.add(LeaveRequest(
        user_id=outsider.id, start_date=__import__("datetime").date(2030, 1, 7),
        end_date=__import__("datetime").date(2030, 1, 7), days=1,
        leave_type=LeaveType.casual, status=LeaveStatus.pending,
    ))
    await db_session.commit()
    await seed_demo_team(db_session)

    await reset_demo_team(db_session)

    assert await db_session.scalar(select(User).where(User.phone == "+15550001111")) is not None
    assert await _count(db_session, LeaveRequest, LeaveRequest.user_id == outsider.id) == 1


@pytest.mark.asyncio
async def test_reset_detaches_people_who_report_to_the_demo_manager(db_session):
    await seed_demo_team(db_session)
    demo_manager = await db_session.scalar(select(User).where(User.phone == "+919000000001"))
    outsider = User(name="Added By Visitor", phone="+15550002222", role=UserRole.worker, manager_id=demo_manager.id)
    db_session.add(outsider)
    await db_session.commit()

    await reset_demo_team(db_session)

    await db_session.refresh(outsider)
    assert outsider.manager_id is None


def test_reset_endpoint_requires_login(client: TestClient):
    assert client.post("/demo/reset").status_code == 401


def test_reset_endpoint_rejects_non_demo_users(client: TestClient):
    from app.main import app

    app.dependency_overrides[get_current_user_required] = lambda: User(
        id=999, name="Boss", phone="+1", email="boss@corp.com", role=UserRole.admin
    )

    assert client.post("/demo/reset").status_code == 403


def test_reset_endpoint_resets_for_the_demo_user(client: TestClient):
    client.post("/auth/login", data={"username": "demo@leaveflow.com", "password": "demo123"})

    response = client.post("/demo/reset")

    assert response.status_code == 200
    assert response.json() == {"users": 9, "requests": 12}
    assert len(client.get("/leave/pending").json()) == 4
