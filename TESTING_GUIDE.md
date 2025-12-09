# 🎯 LeaveFlow - Complete Testing Guide for Recruiters

## 📋 Pre-Demo Setup

### 1. Clean Start
```powershell
# In project root
cd D:\Projects\LeaveFlow

# Reset database (if needed)
cd backend
python migrate.py

# Seed demo data
python seed_demo_data.py
```

### 2. Start Services
```powershell
# Terminal 1: Backend
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
cd dashboard
npm run dev

# Terminal 3 (Optional): Ngrok for WhatsApp
ngrok http 8000
```

**Access Points:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 👥 Test Accounts (All Pre-Created)

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| **Admin** | admin@leaveflow.com | admin123 | Full system access |
| **HR** | hr@leaveflow.com | hr123 | HR operations |
| **Manager 1** | emily@leaveflow.com | manager123 | Team management |
| **Manager 2** | david@leaveflow.com | manager123 | Team management |
| **Worker 1** | alex@leaveflow.com | worker123 | Employee view |
| **Worker 2** | jessica@leaveflow.com | worker123 | Employee view |
| **Worker 3** | ryan@leaveflow.com | worker123 | Employee view |

---

## 🧪 Complete Feature Testing Flow

### **Test 1: Worker Journey (10 minutes)**

#### **Login as Worker**
```
Email: alex@leaveflow.com
Password: worker123
```

#### **Dashboard Overview**
- ✅ See leave balance: 12 casual, 12 sick, 5 special
- ✅ View pending/approved requests
- ✅ Check upcoming holidays

#### **Apply for Leave**
1. Go to **Requests** → **New Request**
2. Fill in:
   - Start Date: 2025-12-16
   - End Date: 2025-12-18
   - Type: Casual
   - Reason: "Year-end vacation"
   - Duration: Full Day
3. Click **Submit**
4. ✅ Verify: Request created with status "Pending"
5. ✅ Check: Balance deducted from available (shows pending deduction)

#### **View Request History**
1. Go to **Requests** → **History**
2. ✅ See all past requests
3. ✅ Filter by status (Approved/Rejected/Pending)
4. ✅ Download CSV export

#### **Check Calendar View**
1. Go to **Requests** → **Calendar**
2. ✅ See team leaves on calendar
3. ✅ View holidays marked in calendar

---

### **Test 2: Manager Journey (10 minutes)**

#### **Login as Manager**
```
Email: emily@leaveflow.com
Password: manager123
```

#### **Dashboard Overview**
- ✅ See team statistics
- ✅ View pending approvals count
- ✅ See team members list

#### **Approve Leave Request**
1. Go to **Requests** → **Pending**
2. ✅ See Alex's vacation request (from Test 1)
3. Click on request to view details
4. Click **Approve** button
5. ✅ Verify: Status changes to "Approved"
6. ✅ Check: Worker's balance updated

#### **Reject a Request**
1. Find Ryan's pending request
2. Click **Reject**
3. Add reason: "Team understaffed during that period"
4. ✅ Verify: Status changes to "Rejected"

#### **View Team Calendar**
1. Go to **Requests** → **Calendar**
2. ✅ See all team members' leaves
3. ✅ Check for conflicts/overlaps

#### **Request New Account**
1. Go to **Users** → **Request Account**
2. Fill in:
   - Name: "New Team Member"
   - Email: "newmember@leaveflow.com"
   - Phone: "+1234567100"
   - Role: Worker
3. Submit request
4. ✅ Verify: Request sent to admin for approval

---

### **Test 3: HR Journey (8 minutes)**

#### **Login as HR**
```
Email: hr@leaveflow.com
Password: hr123
```

#### **Manage Holidays**
1. Go to **Holidays**
2. Click **Add Holiday**
3. Fill in:
   - Date: 2025-12-31
   - Name: "New Year's Eve"
   - Description: "Half day"
4. ✅ Verify: Holiday added to system

#### **View All Employees**
1. Go to **Users**
2. ✅ See complete employee list
3. ✅ Filter by role (Worker/Manager/HR)
4. Click on any user to view details

#### **Assign Manager to Worker**
1. Select a worker (e.g., Sophia Kumar)
2. Click **Edit**
3. Change manager from dropdown
4. Save changes
5. ✅ Verify: Manager assignment updated

#### **View Reports**
1. Go to **Requests** → **History**
2. ✅ Export all leave data (CSV)
3. ✅ Filter by date range
4. ✅ Filter by leave type

---

### **Test 4: Admin Journey (10 minutes)**

#### **Login as Admin**
```
Email: admin@leaveflow.com
Password: admin123
```

#### **Approve Account Creation**
1. Go to **Account Requests** (or check notifications)
2. ✅ See manager's request for new employee
3. Click **Review**
4. Click **Approve**
5. ✅ Verify: New user account created
6. ✅ Check: Leave balance auto-created for new user

#### **Carry Forward Leaves**
1. Go to **Leave Management** → **Carry Forward**
2. Click **Process Carry Forward**
3. ✅ System processes all users
4. ✅ Casual leaves carried forward (max 5 days)
5. ✅ View carry forward report

#### **View Balance History**
1. Go to any user details
2. Click **Balance History** tab
3. ✅ See all balance changes
4. ✅ View: Initial allocation, deductions, carry forwards

#### **Advanced Search**
1. Go to **Requests** → **Search**
2. Apply filters:
   - Date Range: Last 30 days
   - Status: Approved
   - Leave Type: Casual
   - User: Alex Thompson
3. Click **Search**
4. ✅ View filtered results

#### **System Administration**
1. Go to **Users** → **All Users**
2. ✅ View complete user hierarchy
3. ✅ See manager-worker relationships
4. ✅ Edit any user's role/details

---

### **Test 5: WhatsApp Integration (5 minutes)**

#### **Setup (One-time)**
1. Start ngrok: `ngrok http 8000`
2. Copy HTTPS URL (e.g., https://abc123.ngrok-free.app)
3. Configure in Meta Developer Console:
   - Webhook URL: `https://abc123.ngrok-free.app/webhook/whatsapp`
   - Subscribe to: messages, message_status

#### **Test Commands**
```
# Check balance
balance

# Apply leave
leave 2025-12-20 to 2025-12-22 casual family function

# Half day leave
half leave 2025-12-21 morning doctor appointment

# Check status
status

# As Manager - Approve
approve 5

# As Manager - Reject
reject 6 insufficient notice
```

#### **Verification**
- ✅ Bot responds with confirmation
- ✅ Leave request created in database
- ✅ Manager gets notification
- ✅ Status updates reflected in dashboard

---

## 🎬 Demo Script for Recruiters (15-20 minutes)

### **Opening (2 minutes)**
"LeaveFlow is a production-grade leave management system with multi-channel access - employees use WhatsApp, managers use the web dashboard. Let me show you the complete workflow."

### **Act 1: Employee Applies Leave (3 minutes)**
1. Login as Worker (alex@leaveflow.com)
2. Show dashboard with balance
3. Apply for leave (Dec 20-22)
4. Show request in pending state
5. Highlight: Real-time balance validation

### **Act 2: Manager Approval (3 minutes)**
1. Switch to Manager account (emily@leaveflow.com)
2. Show pending approvals notification
3. Review request details
4. Approve the request
5. Highlight: Instant update, balance deducted

### **Act 3: Admin Operations (4 minutes)**
1. Switch to Admin (admin@leaveflow.com)
2. Show account creation request
3. Approve new account
4. Demonstrate carry forward process
5. Show advanced search with filters

### **Act 4: HR Management (3 minutes)**
1. Switch to HR (hr@leaveflow.com)
2. Add a holiday
3. View all employees
4. Export leave report (CSV)

### **Act 5: WhatsApp Demo (3 minutes)**
1. Show WhatsApp chat
2. Send "balance" command
3. Apply leave via WhatsApp
4. Show instant sync with dashboard

### **Closing (2 minutes)**
"This demonstrates:
- ✅ Full-stack development (Next.js + FastAPI)
- ✅ Real-time sync between channels
- ✅ Role-based access control (4 tiers)
- ✅ Production patterns (JWT, async DB, audit logs)
- ✅ External API integration (WhatsApp)
- ✅ Modern UI with dark mode
- ✅ Complete CRUD operations
- ✅ Data export and reporting"

---

## 📊 Key Metrics to Highlight

### **Technical Complexity**
- **Backend**: 30+ API endpoints, async operations
- **Frontend**: 9 dashboard pages, real-time updates
- **Database**: 11 tables, complex relationships
- **Auth**: JWT with 4-tier permissions
- **Integration**: WhatsApp Cloud API
- **Testing**: 27 automated tests

### **Features Demonstrated**
1. ✅ Multi-channel access (Web + WhatsApp)
2. ✅ Real-time synchronization
3. ✅ Approval workflows (3 levels)
4. ✅ Leave balance management
5. ✅ Holiday calendar
6. ✅ Account creation requests
7. ✅ Carry forward system
8. ✅ Advanced search & filters
9. ✅ Data export (CSV)
10. ✅ Audit trail (balance history)
11. ✅ Dark mode support
12. ✅ Responsive design

---

## 🔧 Troubleshooting

### **Issue: Login not working**
```powershell
# Verify user exists
python -c "from app.database import *; from app.models import User; import asyncio; asyncio.run(list_users())"

# Re-seed data
python seed_demo_data.py
```

### **Issue: Backend not starting**
```powershell
# Check database connection
psql -U postgres -c "SELECT version();"

# Verify .env.local exists
cat backend/.env.local

# Restart with debug
uvicorn app.main:app --reload --log-level debug
```

### **Issue: Frontend not loading**
```powershell
cd dashboard
rm -rf .next
npm install
npm run dev
```

---

## 📝 Quick Verification Checklist

Before demo:
- [ ] Database has seed data (check pgAdmin or psql)
- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] Can login with test accounts
- [ ] Leave requests visible in dashboard
- [ ] Holidays showing in calendar
- [ ] Dark mode toggle works

---

## 🎯 Questions Recruiters May Ask

### **Q: How did you handle async operations?**
**A:** "Used SQLAlchemy 2.0 with asyncpg driver, FastAPI's native async/await support, and proper eager loading to avoid N+1 queries."

### **Q: How do you ensure data consistency?**
**A:** "Database transactions, optimistic locking, audit logs for all changes, and balance history tracking for compliance."

### **Q: What about security?**
**A:** "JWT tokens with 7-day expiry, bcrypt password hashing, role-based access control, CORS whitelist, and input validation with Pydantic."

### **Q: How would you scale this?**
**A:** "Add Redis for caching, message queue for WhatsApp sends, read replicas for reports, containerize with Docker, deploy to Kubernetes or cloud services."

### **Q: Testing strategy?**
**A:** "27 automated tests covering all endpoints, authentication, authorization, validation. Uses pytest with fixtures for database setup."

---

## 💡 Pro Tips for Demo

1. **Have 2 browsers open**: One for worker, one for manager
2. **Use split screen**: Show real-time updates
3. **Keep terminals visible**: Show backend logs
4. **Prepare WhatsApp**: Have test messages ready
5. **Enable dark mode**: Showcases attention to detail
6. **Show code briefly**: Highlight key patterns (async, JWT, eager loading)

---

**Good luck with your demo! You've got this! 🚀**
