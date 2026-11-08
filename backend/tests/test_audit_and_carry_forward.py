import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.auth import get_current_user_required
from app.models import LeaveBalance, LeaveStatus, User, UserRole
from app.services.demo_seed import seed_demo_team


def _login_demo(client: TestClient):
    assert client.post("/auth/login", data={"username": "demo@leaveflow.com", "password": "demo123"}).status_code == 200


@pytest.fixture
async def seeded(db_session):
    await seed_demo_team(db_session)


def test_audit_trail_lists_actions_oldest_first(client: TestClient, seeded):
    _login_demo(client)
    approved = [r for r in client.get("/leave/history", params={"status": "approved"}).json()]
    request_id = approved[0]["id"]

    response = client.get(f"/leave/{request_id}/audit")

    assert response.status_code == 200
    entries = response.json()
    assert [e["action"] for e in entries] == ["created", "approved"]
    assert entries[0]["actor_name"]
    assert entries[0]["created_at"] <= entries[1]["created_at"]


def test_audit_trail_404_for_unknown_request(client: TestClient):
    _login_demo(client)
    assert client.get("/leave/999999/audit").status_code == 404


def test_audit_trail_forbidden_for_other_workers(client: TestClient, seeded):
    _login_demo(client)
    request = client.get("/leave/pending").json()[0]
    from app.main import app

    app.dependency_overrides[get_current_user_required] = lambda: User(
        id=424242, name="Stranger", phone="+2", role=UserRole.worker
    )

    assert client.get(f"/leave/{request['id']}/audit").status_code == 403


@pytest.mark.asyncio
async def test_carry_forward_keeps_user_balance_columns_in_step(client: TestClient, db_session, seeded):
    _login_demo(client)

    assert client.post("/leave/carry-forward").status_code == 200

    rows = (await db_session.execute(select(LeaveBalance, User).join(User, User.id == LeaveBalance.user_id))).all()
    assert rows
    for balance, user in rows:
        await db_session.refresh(user)
        await db_session.refresh(balance)
        assert (user.casual_leave_balance, user.sick_leave_balance, user.special_leave_balance) == (
            balance.casual, balance.sick, balance.special
        )
