import pytest
from fastapi.testclient import TestClient

def test_read_root(client: TestClient):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "LeaveFlow API"}

def test_auth_login_invalid(client: TestClient):
    response = client.post("/auth/login", data={"username": "wrong", "password": "wrong"})
    assert response.status_code == 401

def test_get_me_unauthorized(client: TestClient):
    response = client.get("/auth/me")
    assert response.status_code == 401
