# LeaveFlow

[![CI](https://github.com/sriram36/LeaveFlow/actions/workflows/ci.yml/badge.svg)](https://github.com/sriram36/LeaveFlow/actions/workflows/ci.yml)

Leave management where employees apply over WhatsApp ("leave tomorrow sick") and managers/HR approve from a Next.js dashboard that updates live over WebSockets.

- **Live dashboard:** https://leave-flow-cyan.vercel.app
- **Stack:** FastAPI, async SQLAlchemy 2.0 + asyncpg, PostgreSQL, Alembic, Next.js, Docker Compose, GitHub Actions

## Screenshots

| Landing (light) | Landing (dark) |
|---|---|
| ![Landing page, light theme](docs/screenshots/landing-light.png) | ![Landing page, dark theme](docs/screenshots/landing-dark.png) |

| Dashboard (light) | Dashboard (dark) |
|---|---|
| ![Dashboard with summary cards, leave usage, team availability and recent requests](docs/screenshots/dashboard-light.png) | ![Dashboard, dark theme](docs/screenshots/dashboard-dark.png) |

| Approval inbox (light) | Approval inbox (dark) |
|---|---|
| ![Approval inbox with checks, light theme](docs/screenshots/inbox-light.png) | ![Approval inbox with checks, dark theme](docs/screenshots/inbox-dark.png) |

| Who's away | Request on a phone |
|---|---|
| ![Team timeline](docs/screenshots/timeline-light.png) | ![Request detail sheet on a phone](docs/screenshots/inbox-mobile-detail.png) |

The landing-page chat is a scripted animation, not a live conversation. The dashboard screenshots use the data from `backend/scripts/seed_demo.py`.

## Features

- Apply, cancel, approve and reject leave through a WhatsApp bot (rule-based parser, optional LLM fallback).
- **Dashboard**: pending, approved today, away today and upcoming leave; leave usage by month and type; who is in today; recent requests; who is away this week. Everything comes from the API, nothing is placeholder data.
- **Approval inbox** for managers, HR and admins: a queue plus a detail panel, with keyboard shortcuts (`J`/`K` move, `A` approve, `R` reject). A **Checks** panel shows the requester's remaining balance, which teammates are already off, and short notice. If someone else decides first, you get a clear "someone got there first" message.
- **Who's away**: a people-by-day timeline of approved and pending leave, with holidays and weekends left out of leave days.
- **Request history** per request (who created, approved or rejected it, and when), read from the audit log.
- Live updates over WebSockets; the header shows whether the connection is actually up.
- Validation: date range, weekends and holidays excluded, overlapping requests, balance check.
- Roles: worker, manager, HR, admin. Managers can only act on their own team's requests and balances.
- Audit log entry for every create / approve / reject / cancel.
- **Landing page** that shows the product instead of describing it: a box that sends your text to the real message parser (`POST /demo/parse`, public, rate limited, stores nothing), real screenshots of the app, and the concurrency guarantee as a picture, with links to the code.
- Light and dark themes. The landing page and the approval inbox are checked on a phone-sized screen.

## Demo

The sign-in page has a **Fill Demo Credentials** button for the shared demo account, and the landing page's **Try the live demo** link opens sign-in with those credentials already filled in.

Inside the dashboard, the demo account sees **Restart demo** in the sidebar. It deletes the demo team's data (the fixed set of fake people from `backend/scripts/seed_demo.py` and their requests, balances and audit entries) and seeds it again, so the demo always starts from the beginning. It never touches anyone else's data. The same reset is available from the command line: `docker compose exec backend python scripts/seed_demo.py --reset`.

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
| Rate limiting | slowapi: login/register and demo reset 5 per minute, the public parser demo 30 per minute, webhook 20 per second (per IP) | [limiter.py](backend/app/limiter.py), [routes/](backend/app/routes) | none (disabled in the test client) |
| Audit trail | `AuditLog` row for create/approve/reject/cancel, readable per request at `GET /leave/{id}/audit` (same access rule as the request) | `_log_action` in [leave.py](backend/app/services/leave.py) | `test_concurrent_approvals_only_one_wins`, [test_audit_and_carry_forward.py](backend/tests/test_audit_and_carry_forward.py) |
| Demo reset | `POST /demo/reset` only works for the demo account and only deletes the demo team's data; overlapping resets are serialized with a Postgres advisory lock | [routes/demo.py](backend/app/routes/demo.py), [demo_seed.py](backend/app/services/demo_seed.py) | [test_demo_reset.py](backend/tests/test_demo_reset.py), [test_demo_reset_postgres.py](backend/tests/test_demo_reset_postgres.py) |

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

Last run: **88 tests passed** with PostgreSQL (80 passed and 8 skipped without it), **54% line coverage** of `backend/app`. CI runs the full set against a PostgreSQL service container and then builds both Docker images ([workflow](.github/workflows/ci.yml)).

The dashboard has a small browser test suite ([Playwright](dashboard/e2e/demo.spec.ts), 4 tests: landing page, the parser box, the landing screenshots, and a walkthrough of demo sign-in, dashboard, inbox shortcuts, audit trail, timeline and restart). It needs the app running with demo data and **resets the demo data**, so it is not part of CI:

```bash
docker compose up --build -d db backend
docker compose exec backend python scripts/seed_demo.py
cd dashboard && npm ci && npm run build && npm start     # in one terminal
npx playwright install chromium && npm run test:e2e        # in another
```

## Known limitations

- **No real users yet.** It has only been used by its author.
- **No load-test results.** `locustfile.py` exists but still targets `/api/v1/...` routes that do not exist (the API serves `/auth`, `/leave`, `/users`), so it would only measure 404s. Do not quote performance numbers for this project.
- **Public demo admin account.** Logging in as `demo@leaveflow.com` / `demo123` creates an admin user on any deployment that does not have one. Do not run this with real data as-is.
- **The demo is shared.** Everyone who uses it sees and changes the same data, and one visitor's "Restart demo" resets it for everybody. Things a visitor creates outside the demo team (for example a new user) are not removed by a restart.
- **Webhook signature check is optional.** It is skipped when `WHATSAPP_APP_SECRET` is not set.
- **Leave requests can only be created through the WhatsApp webhook**; there is no HTTP endpoint for it, so the dashboard cannot create requests.
- **The dashboard is for managers, HR and admins.** Workers are signed out of it by design and use WhatsApp.
- The browser tests are not run in CI. Test coverage is 54%; the WhatsApp message flow, AI service and many routes are lightly tested.
