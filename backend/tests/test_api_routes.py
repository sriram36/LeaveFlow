import pytest
from fastapi.testclient import TestClient

def test_read_root(client: TestClient):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "LeaveFlow API"

def test_auth_login_invalid(client: TestClient):
    response = client.post("/auth/login", data={"username": "wrong", "password": "wrong"})
    assert response.status_code == 401

def test_get_me_unauthorized(client: TestClient):
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_login_cookie_is_usable_for_local_http(client: TestClient):
    response = client.post(
        "/auth/login",
        data={"username": "demo@leaveflow.com", "password": "demo123"},
    )
    assert response.status_code == 200
    cookie = response.headers["set-cookie"]
    assert "Secure" not in cookie
    assert "SameSite=lax" in cookie
