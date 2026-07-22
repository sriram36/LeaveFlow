import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.ai_service import AIService
from app.models import LeaveType

@pytest.mark.asyncio
async def test_ai_service_extract_leave_details():
    service = AIService()
    
    mock_response = MagicMock()
    mock_response.choices = [
        MagicMock(message=MagicMock(content='{"is_leave_request": true, "start_date": "2026-08-01", "end_date": "2026-08-02", "leave_type": "sick", "reason": "Feeling unwell", "is_half_day": false}'))
    ]
    
    with patch("openai.AsyncOpenAI") as mock_openai:
        mock_client = AsyncMock()
        mock_client.chat.completions.create.return_value = mock_response
        service.client = mock_client
        
        result = await service.extract_leave_details("I need sick leave from Aug 1 to Aug 2 because I am feeling unwell")
        
        assert result is not None
        assert result.get("is_leave_request") is True
        assert result.get("start_date") == "2026-08-01"
        assert result.get("end_date") == "2026-08-02"
        assert result.get("leave_type") == "sick"
        assert result.get("reason") == "Feeling unwell"

@pytest.mark.asyncio
async def test_ai_service_parse_intent():
    service = AIService()
    
    mock_response = MagicMock()
    mock_response.choices = [
        MagicMock(message=MagicMock(content='{"intent": "balance"}'))
    ]
    
    with patch("openai.AsyncOpenAI") as mock_openai:
        mock_client = AsyncMock()
        mock_client.chat.completions.create.return_value = mock_response
        service.client = mock_client
        
        intent = await service.parse_leave_intent("How many leaves do I have left?")
        assert intent == "balance"

@pytest.mark.asyncio
async def test_ai_service_generate_response():
    service = AIService()
    
    mock_response = MagicMock()
    mock_response.choices = [
        MagicMock(message=MagicMock(content='You have 10 sick leaves remaining.'))
    ]
    
    with patch("openai.AsyncOpenAI") as mock_openai:
        mock_client = AsyncMock()
        mock_client.chat.completions.create.return_value = mock_response
        service.client = mock_client
        
        response = await service.generate_response("How many sick leaves do I have?", context={"sick_leave_balance": 10})
        assert response == "You have 10 sick leaves remaining."
