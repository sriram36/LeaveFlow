import pytest
from datetime import date, timedelta
from app.services.parser import MessageParser, CommandType

def test_parse_balance_command():
    parser = MessageParser()
    result = parser.parse("balance")
    assert result.command_type == CommandType.BALANCE

def test_parse_pending_command():
    parser = MessageParser()
    result = parser.parse("pending")
    assert result.command_type == CommandType.PENDING

def test_parse_approve_command():
    parser = MessageParser()
    result = parser.parse("approve 123")
    assert result.command_type == CommandType.APPROVE
    assert result.request_id == 123

def test_parse_reject_command():
    parser = MessageParser()
    result = parser.parse("reject 123 bad reason")
    assert result.command_type == CommandType.REJECT
    assert result.request_id == 123
    assert result.reason == "bad reason"

def test_parse_cancel_command():
    parser = MessageParser()
    result = parser.parse("cancel 123")
    assert result.command_type == CommandType.CANCEL
    assert result.request_id == 123

def test_parse_leave_request_tomorrow():
    parser = MessageParser()
    result = parser.parse("leave tomorrow casual sick feeling")
    assert result.command_type == CommandType.LEAVE
    assert result.start_date == date.today() + timedelta(days=1)
    assert result.end_date == date.today() + timedelta(days=1)

def test_parse_half_day_leave():
    parser = MessageParser()
    result = parser.parse("half leave tomorrow morning")
    assert result.command_type == CommandType.HALF_LEAVE
    assert result.is_half_day is True
    assert result.half_day_period == "morning"

def test_unknown_command():
    parser = MessageParser()
    result = parser.parse("hello there")
    assert result.command_type == CommandType.UNKNOWN
