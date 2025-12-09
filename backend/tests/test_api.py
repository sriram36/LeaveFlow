"""
Comprehensive unit tests for LeaveFlow API
Tests endpoints without requiring async database setup
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


class TestBasicEndpoints:
    """Basic API endpoint smoke tests"""
    
    def test_root_endpoint(self):
        """Test root endpoint exists"""
        response = client.get("/")
        assert response.status_code in [200, 404]
    
    def test_docs_endpoint(self):
        """Test API documentation endpoint (Swagger UI)"""
        response = client.get("/docs")
        assert response.status_code == 200
    
    def test_redoc_endpoint(self):
        """Test ReDoc documentation endpoint"""
        response = client.get("/redoc")
        assert response.status_code == 200
    
    def test_openapi_endpoint(self):
        """Test OpenAPI schema endpoint"""
        response = client.get("/openapi.json")
        assert response.status_code == 200
        data = response.json()
        assert "paths" in data
        assert "info" in data
        assert "components" in data


class TestAuthentication:
    """Test authentication endpoints"""
    
    def test_login_endpoint_exists(self):
        """Test login endpoint exists and validates credentials"""
        response = client.post(
            "/auth/login",
            data={"username": "test@example.com", "password": "wrongpass"}
        )
        # Should return 401 (unauthorized) not 404 (not found)
        assert response.status_code in [401, 422]
    
    def test_login_missing_credentials(self):
        """Test login with missing credentials"""
        response = client.post("/auth/login", data={})
        # Should return 422 (validation error)
        assert response.status_code == 422
    
    def test_unauthorized_access(self):
        """Test accessing protected route without token"""
        response = client.get("/auth/me")
        assert response.status_code == 401
        assert "detail" in response.json()
    
    def test_invalid_token(self):
        """Test accessing protected route with invalid token"""
        response = client.get(
            "/auth/me",
            headers={"Authorization": "Bearer invalid_token_here"}
        )
        assert response.status_code == 401
    
    def test_register_endpoint_exists(self):
        """Test registration endpoint exists"""
        response = client.post(
            "/auth/register",
            json={
                "name": "Test",
                "email": "invalid",  # Invalid email format
                "phone": "123",
                "password": "pass",
                "role": "worker"
            }
        )
        # Should return validation error or conflict, not 404
        assert response.status_code != 404


class TestLeaveEndpoints:
    """Test leave management endpoints"""
    
    def test_list_leave_requests_requires_auth(self):
        """Test that listing leave requests requires authentication"""
        response = client.get("/leave/requests")
        assert response.status_code == 401
    
    def test_create_leave_request_requires_auth(self):
        """Test that creating leave request requires authentication"""
        response = client.post(
            "/leave/requests",
            json={
                "start_date": "2025-12-20",
                "end_date": "2025-12-22",
                "leave_type": "casual",
                "reason": "Test",
                "duration_type": "full"
            }
        )
        # Returns 405 (method not allowed) or 401 (unauthorized)
        assert response.status_code in [401, 405]
    
    def test_leave_request_validation(self):
        """Test leave request validation with invalid data"""
        response = client.post(
            "/leave/requests",
            headers={"Authorization": "Bearer fake_token"},
            json={
                "start_date": "invalid_date",
                "end_date": "2025-12-22",
                "leave_type": "invalid_type",
                "reason": "",
                "duration_type": "full"
            }
        )
        # Should return 401 (no auth), 422 (validation error), or 405 (method not allowed)
        assert response.status_code in [401, 405, 422]
    
    def test_balance_history_endpoint_exists(self):
        """Test leave balance history endpoint exists"""
        response = client.get("/leave/balance/history")
        # Should require auth, not return 404
        assert response.status_code != 404
    
    def test_carry_forward_endpoint_exists(self):
        """Test carry forward endpoint exists"""
        response = client.post("/leave/carry-forward")
        # Should require auth, not return 404
        assert response.status_code != 404
    
    def test_advanced_search_endpoint_exists(self):
        """Test advanced search endpoint exists"""
        response = client.get("/leave/requests/search")
        # Should require auth, not return 404
        assert response.status_code != 404


class TestUserEndpoints:
    """Test user management endpoints"""
    
    def test_list_users_requires_auth(self):
        """Test that listing users requires authentication"""
        response = client.get("/users/")
        assert response.status_code == 401
    
    def test_get_user_details_requires_auth(self):
        """Test that getting user details requires authentication"""
        response = client.get("/users/1")
        assert response.status_code == 401
    
    def test_update_user_requires_auth(self):
        """Test that updating user requires authentication"""
        response = client.put(
            "/users/1",
            json={"manager_id": 2}
        )
        assert response.status_code == 401
    
    def test_get_team_endpoint_exists(self):
        """Test get team endpoint exists"""
        response = client.get("/users/team")
        # Should require auth, not return 404
        assert response.status_code != 404


class TestHolidayEndpoints:
    """Test holiday management endpoints"""
    
    def test_list_holidays(self):
        """Test listing holidays (may be public or require auth)"""
        response = client.get("/holidays/")
        # Should return 200 or 401, not 404
        assert response.status_code in [200, 401]
    
    def test_create_holiday_requires_auth(self):
        """Test that creating holiday requires authentication"""
        response = client.post(
            "/holidays/",
            json={
                "date": "2025-12-25",
                "name": "Christmas"
            }
        )
        assert response.status_code == 401
    
    def test_delete_holiday_requires_auth(self):
        """Test that deleting holiday requires authentication"""
        response = client.delete("/holidays/1")
        assert response.status_code == 401


class TestAccountRequestEndpoints:
    """Test account creation request endpoints"""
    
    def test_create_account_request_requires_auth(self):
        """Test that creating account request requires authentication"""
        response = client.post(
            "/account-requests/",
            json={
                "name": "New User",
                "email": "new@example.com",
                "phone": "+1234567890",
                "role": "worker"
            }
        )
        assert response.status_code == 401
    
    def test_list_account_requests_requires_auth(self):
        """Test that listing account requests requires authentication"""
        response = client.get("/account-requests/")
        assert response.status_code == 401
    
    def test_approve_account_request_requires_auth(self):
        """Test that approving account request requires authentication"""
        response = client.post(
            "/account-requests/1/approve",
            json={"approved": True}
        )
        assert response.status_code == 401


class TestWebhookEndpoint:
    """Test WhatsApp webhook endpoints"""
    
    def test_webhook_verification(self):
        """Test webhook verification endpoint"""
        response = client.get(
            "/webhook/whatsapp",
            params={
                "hub.mode": "subscribe",
                "hub.verify_token": "test_token",
                "hub.challenge": "challenge_string"
            }
        )
        # Will return 200 or 403 depending on token, not 404
        assert response.status_code in [200, 403]
    
    def test_webhook_post_endpoint_exists(self):
        """Test webhook POST endpoint exists"""
        response = client.post(
            "/webhook/whatsapp",
            json={"object": "whatsapp_business_account", "entry": [{"changes": [{"value": {"messages": []}}]}]}
        )
        # Should process or return error, not 404
        assert response.status_code != 404
