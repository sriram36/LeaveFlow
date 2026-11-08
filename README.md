# LeaveFlow

[![CI](https://github.com/sriram36/LeaveFlow/actions/workflows/ci.yml/badge.svg)](https://github.com/sriram36/LeaveFlow/actions/workflows/ci.yml)

Leave management where employees apply over WhatsApp ("leave tomorrow sick") and managers/HR approve from a Next.js dashboard that updates live over WebSockets.

- **Live dashboard:** https://leave-flow-cyan.vercel.app
- **Stack:** FastAPI, async SQLAlchemy 2.0 + asyncpg, PostgreSQL, Alembic, Next.js, Docker Compose, GitHub Actions

## Screenshots

| Landing (light) | Landing (dark) |
|---|---|
| ![Landing page, light theme](docs/screenshots/landing-light.png) | ![Landing page, dark theme](docs/screenshots/landing-dark.png) |

| Dashboard | Requests (dark) | Calendar |
|---|---|---|
| ![Dashboard overview](docs/screenshots/dashboard-light.png) | ![Pending requests, dark theme](docs/screenshots/requests-dark.png) | ![Team leave calendar](docs/screenshots/calendar-light.png) |

The landing-page chat is a scripted animation, not a live conversation. The dashboard screenshots use the data from `backend/scripts/seed_demo.py`.

## Features

- Apply, cancel, approve and reject leave through a WhatsApp bot (rule-based parser, optional LLM fallback).
- Manager/HR dashboard with pending requests, history and a calendar view; status changes are pushed over WebSockets.
- Validation: date range, weekends and holidays excluded, overlapping requests, balance check.
- Roles: worker, manager, HR, admin. Managers can only act on their own team's requests.
- Audit log entry for every create / approve / reject / cancel.

## Architecture

```mermaid
graph LR
    WA[WhatsApp] -->|Webhook| API[FastAPI Backend]
    API --> DB[(PostgreSQL)]
    API -->|WebSocket| UI[Next.js Dashboard]
```

More in [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) and [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md).

## Concurrency and data integrity

Leave days are reserved when a request is created and returned when it is rejected or cancelled. The code is written so concurrent requests cannot break that accounting:

| Situation | How it is handled | Code |
|---|---|---|
| Two requests spend the same balance | One conditional `UPDATE ... WHERE balance >= days`; zero rows updated means insufficient balance | `deduct_balance` in [validator.py](backend/app/services/validator.py) |
| Two approvers (or approve + cancel) act on one request | Status change is one `UPDATE ... WHERE status IN (...)`; the loser gets `ALREADY_PROCESSED`, and the refund runs only for the winner | `_transition_status` in [leave.py](backend/app/services/leave.py) |
| Two creates for overlapping dates | The user's balance row is locked (`SELECT ... FOR UPDATE`) until commit, so the overlap check sees a stable state | `create_leave_request` in [leave.py](backend/app/services/leave.py) |
| Failure after reserving balance | Balance reservation, request and audit log are one transaction; any error rolls all of it back | `create_leave_request` |
| First use creates the balance row twice | Insert in a savepoint; the loser re-reads the winner's row | `ensure_balance_row` in [validator.py](backend/app/services/validator.py) |

These are tested against real PostgreSQL in [tests/test_concurrency.py](backend/tests/test_concurrency.py) (SQLite ignores row locks, so it cannot test this). Each test was first run against the previous implementation and failed there (double approvals, double refunds, a leaked reservation, a raw `IntegrityError`).

`LeaveBalance` is the source of truth. The `User.*_leave_balance` columns are a mirror that is updated with the same relative change in the same transaction.

## Security and access control

| Area | What exists | Code | Tests |
|---|---|---|---|
| Role-based access | `require_manager`, `require_hr_admin`, `require_admin`, `require_user_access` | [auth.py](backend/app/auth.py) | [test_access_control.py](backend/tests/test_access_control.py) |
| Team-scoped approvals | A manager can only approve/reject requests of their own team; HR/admin can act on any | `_ensure_approver_access` in [leave.py](backend/app/services/leave.py) | `test_manager_cannot_approve_another_manager_team` |
| Session auth | JWT in an HttpOnly cookie (`Secure` + `SameSite=None` in production); bearer header also accepted | [routes/auth.py](backend/app/routes/auth.py) | [test_api_routes.py](backend/tests/test_api_routes.py) (local cookie flags only) |
| Webhook authenticity | HMAC-SHA256 check of `X-Hub-Signature-256` | `verify_whatsapp_signature` in [auth.py](backend/app/auth.py) | [test_access_control.py](backend/tests/test_access_control.py) |
| Rate limiting | slowapi: login/register 5 per minute, webhook 20 per second (per IP) | [limiter.py](backend/app/limiter.py), [routes/](backend/app/routes) | none (disabled in the test client) |
| Audit trail | `AuditLog` row for create/approve/reject/cancel | `_log_action` in [leave.py](backend/app/services/leave.py) | `test_concurrent_approvals_only_one_wins` |

## Run it

```bash
docker compose up --build
```

- API: http://localhost:8000 (interactive docs at `/docs`)
- Dashboard: http://localhost:3000
- Migrations (`alembic upgrade head`) run automatically when the backend container starts.
- WhatsApp and AI keys are optional. Set `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`, `OPENROUTER_API_KEY` and `SECRET_KEY` in your shell or a `.env` file next to `docker-compose.yml`. Without WhatsApp credentials the bot does not send messages.
- Without Docker, see [backend/.env.example](backend/.env.example).
- Optional demo data (a small team, 12 leave requests, a few holidays; safe to re-run): `docker compose exec backend python scripts/seed_demo.py`

## Tests

```bash
cd backend
pip install -r requirements-dev.txt
pytest tests/ -v                 # fast suite on in-memory SQLite

# concurrency tests need PostgreSQL (they are skipped without this variable;
# the database's tables are dropped and recreated, so use a throwaway one)
export TEST_POSTGRES_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/leaveflow_test
pytest tests/ -v --cov=app
```

Last run: **65 tests passed** with PostgreSQL (59 passed and 6 skipped without it), **49% line coverage** of `backend/app`. CI runs the full set against a PostgreSQL service container and then builds both Docker images ([workflow](.github/workflows/ci.yml)). The dashboard has no automated tests.

## Known limitations

- **No real users yet.** It has only been used by its author.
- **No load-test results.** `locustfile.py` exists but still targets `/api/v1/...` routes that do not exist (the API serves `/auth`, `/leave`, `/users`), so it would only measure 404s. Do not quote performance numbers for this project.
- **Public demo admin account.** Logging in as `demo@leaveflow.com` / `demo123` creates an admin user on any deployment that does not have one (used by the dashboard's "Use demo credentials" button). Do not run this with real data as-is.
- **Webhook signature check is optional.** It is skipped when `WHATSAPP_APP_SECRET` is not set.
- **Leave requests can only be created through the WhatsApp webhook**; there is no HTTP endpoint for it.
- **Duplicated balance columns** (`LeaveBalance` and `User.*_leave_balance`) are kept in step by the services, but the year-end `carry-forward` endpoint only updates `LeaveBalance`.
- Test coverage is 49%; the WhatsApp message flow, AI service and most routes are lightly tested.
