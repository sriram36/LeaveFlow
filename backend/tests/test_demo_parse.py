from datetime import date, timedelta

from fastapi.testclient import TestClient


def _parse(client: TestClient, message: str):
    return client.post("/demo/parse", json={"message": message})


def test_parse_needs_no_login(client: TestClient):
    response = _parse(client, "leave tomorrow sick")

    assert response.status_code == 200
    body = response.json()
    tomorrow = (date.today() + timedelta(days=1)).isoformat()
    assert body["command"] == "leave"
    assert body["leave_type"] == "sick"
    assert body["start_date"] == tomorrow and body["end_date"] == tomorrow
    assert body["error"] is None


def test_parse_date_range_and_reason(client: TestClient):
    body = _parse(client, "leave 12 Feb to 15 Feb casual wedding").json()

    assert body["command"] == "leave"
    assert body["leave_type"] == "casual"
    assert body["reason"] == "wedding"
    assert body["start_date"][5:] == "02-12" and body["end_date"][5:] == "02-15"


def test_parse_half_day(client: TestClient):
    body = _parse(client, "half leave tomorrow morning").json()

    assert body["command"] == "half_leave"
    assert body["half_day_period"] == "morning"


def test_parse_explains_what_it_could_not_understand(client: TestClient):
    response = _parse(client, "hello there")

    assert response.status_code == 200
    body = response.json()
    assert body["command"] == "unknown"
    assert body["error"]


def test_parse_rejects_empty_and_oversized_messages(client: TestClient):
    assert _parse(client, "").status_code == 422
    assert _parse(client, "leave " + "x" * 300).status_code == 422
