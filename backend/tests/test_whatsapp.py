import pytest
from unittest.mock import patch, AsyncMock
from app.services.whatsapp import WhatsAppService, format_leave_request_notification

@pytest.fixture
def whatsapp_service():
    service = WhatsAppService()
    # Mock settings so they are not dependent on .env
    service.token = "test_token"
    service.phone_id = "123456789"
    return service

@pytest.mark.asyncio
async def test_send_text_success(whatsapp_service):
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value.raise_for_status = lambda: None
        mock_post.return_value.json = lambda: {"messages": [{"id": "mid.123"}]}
        
        result = await whatsapp_service.send_text("1234567890", "Test message")
        
        assert result is True
        mock_post.assert_called_once()
        # Verify headers include bearer token
        args, kwargs = mock_post.call_args
        assert kwargs["headers"]["Authorization"] == "Bearer test_token"
        assert kwargs["json"]["to"] == "1234567890"

@pytest.mark.asyncio
async def test_send_text_failure_retries(whatsapp_service):
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = Exception("Network error")
        with patch("asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
            result = await whatsapp_service.send_text("1234567890", "Test message")
            
            assert result is False
            # Should have retried 3 times
            assert mock_post.call_count == 3
            # Should have slept 2 times
            assert mock_sleep.call_count == 2

def test_format_leave_request_notification():
    result = format_leave_request_notification(
        request_id=42,
        employee_name="Alice",
        start_date="2023-10-01",
        end_date="2023-10-02",
        days=2.0,
        leave_type="casual",
        reason="Vacation"
    )
    assert "Alice" in result
    assert "2023-10-01" in result
    assert "casual" in result.lower()
    assert "approve 42" in result.lower()
