# LeaveFlow - Quick Reference Card

## 🚀 Quick Commands

### Start Development
```bash
# Backend (Terminal 1)
cd backend
uvicorn app.main:app --reload

# Frontend (Terminal 2)
cd dashboard
npm run dev
```

### URLs
- Backend: http://localhost:8000
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

---

## 🔑 Demo Users

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@leaveflow.com | admin123 |
| HR | hr1@leaveflow.com | hr123 |
| Manager | manager1@leaveflow.com | manager123 |
| Worker | worker1@leaveflow.com | worker123 |

---

## 📁 Key Files

### Backend
- `app/main.py` - FastAPI app, error handlers
- `app/auth.py` - Authentication, phone normalization
- `app/models.py` - Database models
- `app/routes/` - API endpoints
- `app/services/` - Business logic
- `.env` - Configuration (create from template)

### Frontend
- `app/page.tsx` - Login page
- `app/lib/api.ts` - API client
- `app/lib/auth-context.tsx` - Auth state
- `app/components/error-boundary.tsx` - Error handling
- `.env.local` - Configuration

---

## 🔧 Common Tasks

### Reset Database
```bash
cd backend
python migrate.py
python seed_demo_data.py
```

### Run Tests
```bash
cd backend
pytest tests/ -v
```

### Check Errors
```bash
# No code, use VS Code "Problems" tab
# Or visit http://localhost:8000/docs
```

### Phone Normalization Test
```python
from app.auth import normalize_phone_number
normalize_phone_number("8500454345")  # Returns: +918500454345
```

---

## 🐛 Quick Troubleshooting

### Backend won't start
```bash
cd backend
pip install -r requirements.txt
```

### Frontend won't start
```bash
cd dashboard
rm -rf node_modules .next
npm install
```

### Database error
```bash
# Check PostgreSQL running
Get-Service postgresql*

# Create database if missing
createdb leaveflow
```

### Port already in use
```bash
# Find and kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### CORS error
```bash
# Check backend/.env
CORS_ORIGINS=http://localhost:3000
```

---

## 📡 API Quick Reference

### Login
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@leaveflow.com&password=admin123"
```

### Get Current User
```bash
curl -X GET http://localhost:8000/auth/me \
  -H "Authorization: Bearer <token>"
```

### Create Leave Request
```bash
curl -X POST http://localhost:8000/leave/requests \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2024-12-15",
    "end_date": "2024-12-16",
    "leave_type": "casual",
    "duration_type": "full",
    "reason": "Personal"
  }'
```

---

## 💬 WhatsApp Commands

### For Workers
- `Apply 2 days sick leave from tomorrow`
- `balance` - Check leave balance
- `status 123` - Check request status
- `cancel 123` - Cancel request

### For Managers
- `pending` - View pending requests
- `approve 123` - Approve request
- `reject 123 reason` - Reject with reason

---

## 🎯 Error Response Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 401 | Unauthorized | Login again |
| 403 | Forbidden | Check role permissions |
| 404 | Not Found | Check resource ID |
| 422 | Validation Error | Check request format |
| 500 | Server Error | Check backend logs |
| 503 | Service Unavailable | Check database connection |

---

## 📚 Full Documentation

- **Testing**: `TESTING_GUIDE.md`
- **Troubleshooting**: `TROUBLESHOOTING.md`
- **API Reference**: `API_DOCUMENTATION.md`
- **Error Handling**: `ERROR_PREVENTION_SUMMARY.md`

---

## 🔍 Debug Checklist

1. ✅ Backend running? → `curl http://localhost:8000/health`
2. ✅ Frontend running? → Visit http://localhost:3000
3. ✅ Database connected? → Check backend terminal
4. ✅ .env files exist? → `ls backend/.env dashboard/.env.local`
5. ✅ Dependencies installed? → Check pip/npm install logs
6. ✅ Port conflicts? → Check netstat output
7. ✅ CORS configured? → Check browser console

---

## 🚀 Deployment Checklist

### Railway/Render (Backend)
- ✅ Set environment variables
- ✅ DATABASE_URL auto-converts
- ✅ Health endpoint works
- ✅ Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Vercel (Frontend)
- ✅ Set NEXT_PUBLIC_API_URL
- ✅ Build command: `npm run build`
- ✅ Output directory: `.next`

---

## 📞 Quick Help

**Error?** → Check `TROUBLESHOOTING.md`
**API Question?** → Check `API_DOCUMENTATION.md`
**Testing?** → Check `TESTING_GUIDE.md`
**How it works?** → Check `ERROR_PREVENTION_SUMMARY.md`

---

**Keep this file open while developing! 🚀**
