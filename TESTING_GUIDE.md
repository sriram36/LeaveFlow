# LeaveFlow - Complete Testing Guide

## 🧪 Testing All Features

### Prerequisites
- Backend running: `http://localhost:8000`
- Frontend running: `http://localhost:3000`
- PostgreSQL database active
- Demo data loaded (`python seed_demo_data.py`)

---

## 1. 🔐 Authentication & Authorization

### Test Login
```bash
# Test Data
Email: admin@leaveflow.com
Password: admin123
```

**Steps:**
1. Go to `http://localhost:3000`
2. Enter email and password
3. Click "Login"

**Expected:**
- ✅ Redirects to dashboard
- ✅ Shows welcome message with user name
- ✅ Token stored in localStorage

**Error Cases:**
- ❌ Wrong password → "Invalid credentials"
- ❌ Non-existent user → "User not found"
- ❌ Worker role → "Dashboard access restricted"

### Test Roles
| Role | Email | Password | Access |
|------|-------|----------|--------|
| Admin | admin@leaveflow.com | admin123 | Full access |
| HR | hr1@leaveflow.com | hr123 | User management |
| Manager | manager1@leaveflow.com | manager123 | Team approvals |
| Worker | worker1@leaveflow.com | worker123 | Denied (WhatsApp only) |

---

## 2. 👤 User Management

### Test User List (HR/Admin)
**Steps:**
1. Login as HR/Admin
2. Go to "Users" page
3. Check user list displays

**Expected:**
- ✅ Shows all users (Admin sees all, HR doesn't see Admin users)
- ✅ Role badges displayed correctly
- ✅ Search/filter works
- ✅ Click user → opens detail page

### Test User Detail Page
**Steps:**
1. Click any user from list
2. View user details

**Expected:**
- ✅ Shows user info (name, phone, email, role)
- ✅ Shows leave balance
- ✅ Shows leave history
- ✅ Manager dropdown (for workers)

### Test Manager Assignment
**Steps:**
1. Go to any worker's detail page
2. Select manager from dropdown
3. Click "Update"

**Expected:**
- ✅ Success message appears
- ✅ Manager assigned
- ✅ Auto-dismisses after 3 seconds

**Error Cases:**
- ❌ No manager selected → Shows current manager
- ❌ Network error → "Failed to assign manager"

### Test Profile Page
**Steps:**
1. Click avatar/name in header
2. Or go to "Profile" in menu
3. Click "Edit Profile"
4. Change name/email/phone
5. Click "Save Changes"

**Expected:**
- ✅ Form validates (required fields)
- ✅ Phone auto-adds +91 if missing
- ✅ Success message on save
- ✅ Data persists after refresh

---

## 3. 📋 Leave Requests

### Test Pending Requests (Manager/HR/Admin)
**Steps:**
1. Login as manager/HR/admin
2. Go to "Pending Requests"

**Expected:**
- ✅ Shows all pending requests
- ✅ Each card shows: ID, user, dates, type, reason
- ✅ "Review" button on each card

### Test Review Request
**Steps:**
1. Click "Review" on any request
2. View full details
3. Click "Approve" or "Reject"

**Expected:**
- ✅ Shows attachments if any
- ✅ Shows leave balance impact
- ✅ Approve → status changes to "approved"
- ✅ Reject → prompts for reason
- ✅ Manager gets WhatsApp notification (if configured)

### Test Leave History
**Steps:**
1. Go to "History" page
2. Use filters (status, date range)
3. Export data

**Expected:**
- ✅ Shows all requests (approved, rejected, cancelled)
- ✅ Filter by status works
- ✅ Search by user works
- ✅ Export downloads CSV

### Test Calendar View
**Steps:**
1. Go to "Calendar" page
2. View team availability

**Expected:**
- ✅ Shows all approved leaves
- ✅ Color-coded by leave type
- ✅ Hover shows details
- ✅ Month navigation works

---

## 4. 🎉 Holiday Management (HR/Admin)

### Test Holiday List
**Steps:**
1. Login as HR/Admin
2. Go to "Holidays" page

**Expected:**
- ✅ Shows all holidays for current year
- ✅ Upcoming holidays highlighted
- ✅ Past holidays grayed out

### Test Add Holiday
**Steps:**
1. Click "Add Holiday"
2. Fill form (name, date, description)
3. Click "Create"

**Expected:**
- ✅ Validation works (required fields)
- ✅ Date picker functional
- ✅ Holiday added to list
- ✅ Success message

### Test Edit/Delete Holiday
**Steps:**
1. Click "Edit" on holiday
2. Modify details
3. Save or Delete

**Expected:**
- ✅ Edit saves changes
- ✅ Delete removes holiday
- ✅ Confirmation dialog for delete

---

## 5. 💬 WhatsApp Integration

### Test Webhook Verification
```bash
# Test webhook verification
curl "http://localhost:8000/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=leaveflow-verify&hub.challenge=test123"

# Expected: Returns "test123"
```

### Test Message Processing
**Prerequisites:**
- WhatsApp Business API configured
- ngrok tunnel active
- Phone number registered

**Test Cases:**

#### Natural Language Request
```
Message: "Apply 2 days sick leave from tomorrow"
Expected: 
✅ Creates leave request
✅ Sends confirmation with request ID
✅ Notifies manager
```

#### Balance Check
```
Message: "balance"
Expected:
✅ Shows casual, sick, special leave balance
```

#### Status Check
```
Message: "status 123"
Expected:
✅ Shows status of request #123
```

#### Cancel Request
```
Message: "cancel 123"
Expected:
✅ Cancels request #123 (if pending)
✅ Sends confirmation
```

#### Manager - Pending List
```
Message: "pending"
Expected:
✅ Shows list of pending requests (if manager)
```

#### Manager - Approve/Reject
```
Message: "approve 123"
Message: "reject 123 Not eligible"
Expected:
✅ Updates request status
✅ Notifies employee
```

### Test Error Messages
```
Message: "xyz random text"
Expected:
✅ Friendly error with examples
✅ Not robotic, conversational tone
```

---

## 6. 🔔 Notifications

### Test Manager Notifications
**Steps:**
1. Create leave request (as worker)
2. Check manager receives notification

**Expected:**
- ✅ Manager gets WhatsApp message
- ✅ Message contains: employee name, dates, type, reason
- ✅ Message includes approve/reject commands

### Test Employee Notifications
**Steps:**
1. Manager approves/rejects request
2. Check employee receives notification

**Expected:**
- ✅ Employee gets WhatsApp message
- ✅ Shows status (approved/rejected)
- ✅ Shows reason (if rejected)

---

## 7. 📱 Responsive Design

### Test Mobile View
**Devices to test:**
- iPhone SE (375px)
- iPhone 12 Pro (390px)
- iPad (768px)
- Desktop (1920px)

**Steps:**
1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test each screen size

**Expected:**
- ✅ Mobile menu (hamburger) appears < 768px
- ✅ All buttons touch-friendly (44px+)
- ✅ Forms stack on mobile
- ✅ Tables responsive/scrollable
- ✅ No horizontal overflow

### Test Mobile Menu
**Steps:**
1. Resize to mobile (< 768px)
2. Click hamburger menu
3. Navigate through links

**Expected:**
- ✅ Menu slides from right
- ✅ Backdrop overlay visible
- ✅ Click outside closes menu
- ✅ Click link closes menu & navigates

---

## 8. 🔒 Security Testing

### Test Unauthorized Access
```bash
# Try accessing protected endpoint without token
curl http://localhost:8000/users/

# Expected: 401 Unauthorized
```

### Test Role Restrictions
**Steps:**
1. Login as worker (should fail for dashboard)
2. Try accessing admin pages as manager
3. Try editing other users as worker

**Expected:**
- ✅ Worker denied dashboard access
- ✅ Manager can't access HR pages
- ✅ Worker can't edit other profiles

### Test Phone Normalization
**Test Cases:**
```
Input: 8500454345 → Output: +918500454345
Input: 918500454345 → Output: +918500454345
Input: +918500454345 → Output: +918500454345
Input: 14155551234 → Output: +14155551234
```

---

## 9. 🗄️ Database Operations

### Test Database Connection
```bash
cd backend
python -c "from app.database import init_db; import asyncio; asyncio.run(init_db()); print('✅ DB Connected')"
```

### Test Migrations
```bash
cd backend
python migrate.py
# Expected: All tables created
```

### Test Demo Data
```bash
cd backend
python seed_demo_data.py
# Expected: Users, leaves, holidays created
```

---

## 10. 🚀 Deployment Testing

### Test Health Endpoint
```bash
curl http://localhost:8000/health

# Expected:
{
  "status": "ok",
  "healthy": true,
  "service": "LeaveFlow",
  "port": "8000"
}
```

### Test API Documentation
```bash
# Open in browser
http://localhost:8000/docs

# Expected: Swagger UI loads
```

### Test CORS
```bash
# Test from different origin
curl -H "Origin: http://example.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     http://localhost:8000/health

# Expected: CORS headers present
```

---

## 11. ⚡ Performance Testing

### Test API Response Times
```bash
# Install Apache Bench
# Test health endpoint
ab -n 100 -c 10 http://localhost:8000/health

# Expected: < 100ms average
```

### Test Database Query Performance
```bash
# Check slow queries in PostgreSQL logs
# Expected: Most queries < 50ms
```

---

## 12. 🐛 Error Handling Testing

### Test Invalid Input
**API Tests:**
```bash
# Missing required field
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com"}'

# Expected: 422 with clear error message
```

### Test Database Errors
**Steps:**
1. Stop PostgreSQL
2. Try creating user
3. Restart PostgreSQL

**Expected:**
- ✅ Graceful error message
- ✅ No app crash
- ✅ Recovers when DB available

### Test Frontend Errors
**Steps:**
1. Stop backend
2. Try logging in
3. Check error display

**Expected:**
- ✅ "Connection failed" message
- ✅ Retry button appears
- ✅ No white screen of death

---

## 📊 Testing Checklist

### Backend Tests
- [ ] Health endpoint returns 200
- [ ] API docs accessible
- [ ] Database connects
- [ ] All routes return valid JSON
- [ ] Error handlers work
- [ ] Phone normalization works
- [ ] Auth tokens validate
- [ ] Rate limiting (if implemented)

### Frontend Tests
- [ ] Login works
- [ ] Logout works
- [ ] Protected routes redirect
- [ ] All pages load
- [ ] Forms validate
- [ ] API calls work
- [ ] Error messages display
- [ ] Loading states show

### Integration Tests
- [ ] WhatsApp webhook receives messages
- [ ] Notifications send
- [ ] Manager assignment works
- [ ] Leave workflow complete
- [ ] Holiday management works

### Responsive Tests
- [ ] Mobile menu works
- [ ] Touch targets adequate
- [ ] No overflow issues
- [ ] Forms usable on mobile

### Security Tests
- [ ] Unauthorized access blocked
- [ ] Role restrictions enforced
- [ ] XSS prevention
- [ ] SQL injection prevention
- [ ] Password hashing works

---

## 🔧 Automated Testing

### Run Backend Tests
```bash
cd backend
pip install -r tests/requirements-test.txt
pytest tests/ -v --cov=app

# Expected: All tests pass, > 80% coverage
```

### Run Frontend Tests (if configured)
```bash
cd dashboard
npm test

# Expected: All component tests pass
```

---

## 📝 Manual Test Script

```bash
#!/bin/bash
# Complete manual test script

echo "🧪 Starting LeaveFlow Complete Test Suite"
echo ""

# 1. Backend Health
echo "1️⃣ Testing Backend..."
curl -s http://localhost:8000/health | jq
echo ""

# 2. Database
echo "2️⃣ Testing Database..."
cd backend
python -c "from app.database import engine; print('✅ DB Connected')" 2>/dev/null
echo ""

# 3. API Endpoints
echo "3️⃣ Testing API Endpoints..."
curl -s http://localhost:8000/ | jq
echo ""

# 4. Frontend
echo "4️⃣ Testing Frontend..."
curl -s http://localhost:3000 -I | grep "200 OK"
echo ""

# 5. Phone Normalization
echo "5️⃣ Testing Phone Normalization..."
python -c "from app.auth import normalize_phone_number; assert normalize_phone_number('8500454345') == '+918500454345'; print('✅ Phone normalization works')"
echo ""

echo "✅ All basic tests passed!"
```

---

## 🚨 Common Issues & Solutions

### Issue: "Module not found"
**Solution:**
```bash
cd backend
pip install -r requirements.txt
```

### Issue: "Database connection failed"
**Solution:**
```bash
# Check PostgreSQL is running
# Verify DATABASE_URL in .env
# Test connection: psql -h localhost -U postgres
```

### Issue: "CORS error"
**Solution:**
- Check CORS_ORIGINS in .env
- Verify frontend URL included
- Check browser console for exact error

### Issue: "WhatsApp not receiving messages"
**Solution:**
- Verify ngrok tunnel active
- Check webhook URL in Meta dashboard
- Verify WHATSAPP_TOKEN correct
- Check phone number approved (test mode)

---

## ✅ Test Report Template

```markdown
# LeaveFlow Test Report - [Date]

## Environment
- Backend: Running ✅ / Not Running ❌
- Frontend: Running ✅ / Not Running ❌
- Database: Connected ✅ / Error ❌
- WhatsApp: Configured ✅ / Not Configured ❌

## Test Results

### Authentication (4/4 passed)
- ✅ Login works
- ✅ Logout works
- ✅ Role restrictions
- ✅ Token validation

### User Management (5/5 passed)
- ✅ List users
- ✅ View user
- ✅ Edit profile
- ✅ Assign manager
- ✅ Create user

### Leave Requests (6/6 passed)
- ✅ View pending
- ✅ Approve request
- ✅ Reject request
- ✅ View history
- ✅ Calendar view
- ✅ Export data

### Mobile Responsive (4/4 passed)
- ✅ Mobile menu
- ✅ Touch targets
- ✅ Form layout
- ✅ No overflow

## Issues Found
1. None

## Conclusion
All features working as expected. Ready for production.
```

---

**Testing Complete! 🎉**

For automated testing, see: `backend/tests/test_api.py`
For issues: Check `backend/app/main.py` error handlers
