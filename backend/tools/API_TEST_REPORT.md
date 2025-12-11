# LeaveFlow API Test Report

**Generated:** 2025-12-11 19:56:19

## Environment

- **Backend URL:** https://leave-flow-cre9.vercel.app
- **Frontend URL:** https://leave-flow-cyan.vercel.app
- **Database:** Neon PostgreSQL (ep-hidden-scene-a1w16ufd)

## Summary

- **Total Tests:** 27
- **Passed:** 24 ✅
- **Failed:** 3 ❌
- **Pass Rate:** 88.9%

## Test Results by Category


### Account Requests (1/3 passed)

| Status | Method | Endpoint | Expected | Actual |
|--------|--------|----------|----------|--------|
| ✅ | GET | `/account-requests/` | 401 | 401 |
| ❌ | GET | `/account-requests/` | 200 | 500 |
| ❌ | GET | `/account-requests/pending` | 200 | 422 |

### Auth (3/3 passed)

| Status | Method | Endpoint | Expected | Actual |
|--------|--------|----------|----------|--------|
| ✅ | GET | `/auth/me` | 401 | 401 |
| ✅ | POST | `/auth/register` | 422 | 422 |
| ✅ | GET | `/auth/me` | 200 | 200 |

### Holidays (2/2 passed)

| Status | Method | Endpoint | Expected | Actual |
|--------|--------|----------|----------|--------|
| ✅ | GET | `/holidays/` | 401 | 401 |
| ✅ | GET | `/holidays/` | 200 | 200 |

### Invalid (1/1 passed)

| Status | Method | Endpoint | Expected | Actual |
|--------|--------|----------|----------|--------|
| ✅ | GET | `/invalid/endpoint` | 404 | 404 |

### Leave (7/8 passed)

| Status | Method | Endpoint | Expected | Actual |
|--------|--------|----------|----------|--------|
| ✅ | GET | `/leave/balance` | 401 | 401 |
| ✅ | GET | `/leave/pending` | 401 | 401 |
| ✅ | GET | `/leave/today` | 401 | 401 |
| ✅ | GET | `/leave/history` | 401 | 401 |
| ✅ | GET | `/leave/balance` | 200 | 200 |
| ❌ | GET | `/leave/today` | 200 | 500 |
| ✅ | GET | `/leave/history` | 200 | 200 |
| ✅ | GET | `/leave/pending` | 200 | 200 |

### Public (3/3 passed)

| Status | Method | Endpoint | Expected | Actual |
|--------|--------|----------|----------|--------|
| ✅ | GET | `/` | 200 | 200 |
| ✅ | GET | `/health` | 200 | 200 |
| ✅ | GET | `/docs` | 200 | 200 |

### Users (4/4 passed)

| Status | Method | Endpoint | Expected | Actual |
|--------|--------|----------|----------|--------|
| ✅ | GET | `/users/` | 401 | 401 |
| ✅ | GET | `/users/team` | 401 | 401 |
| ✅ | GET | `/users/` | 200 | 200 |
| ✅ | GET | `/users/managers` | 200 | 200 |

### Webhook (3/3 passed)

| Status | Method | Endpoint | Expected | Actual |
|--------|--------|----------|----------|--------|
| ✅ | GET | `/webhook/whatsapp` | 422 | 422 |
| ✅ | GET | `/webhook/whatsapp` | 200 | 200 |
| ✅ | GET | `/webhook/whatsapp/inspect-token` | 200 | 200 |

## Failed Tests Details

### ❌ GET /leave/today

- **Expected:** 200
- **Actual:** 500
- **Response:**
```
{
  "detail": "An unexpected error occurred. Our team has been notified.",
  "error_type": "internal_error"
}
```

### ❌ GET /account-requests/

- **Expected:** 200
- **Actual:** 500
- **Response:**
```
{
  "detail": "An unexpected error occurred. Our team has been notified.",
  "error_type": "internal_error"
}
```

### ❌ GET /account-requests/pending

- **Expected:** 200
- **Actual:** 422
- **Response:**
```
{
  "detail": "Validation error",
  "errors": [
    {
      "field": "path -> request_id",
      "message": "Input should be a valid integer, unable to parse string as an integer",
      "type": "int_
```


## Recommendations

⚠️ Some endpoints need attention:

1. Review failed endpoint responses
2. Verify database connectivity
3. Check authentication configuration
4. Ensure all environment variables are set in Vercel

## API Endpoints Summary


### GET

- `/`
- `/account-requests/`
- `/account-requests/pending`
- `/auth/me`
- `/docs`
- `/health`
- `/holidays/`
- `/invalid/endpoint`
- `/leave/balance`
- `/leave/history`
- `/leave/pending`
- `/leave/today`
- `/users/`
- `/users/managers`
- `/users/team`
- `/webhook/whatsapp`
- `/webhook/whatsapp/inspect-token`

### POST

- `/auth/register`
