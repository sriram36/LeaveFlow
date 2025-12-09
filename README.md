# 🚀 LeaveFlow - Enterprise Leave Management System

![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-316192?logo=postgresql)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python)

> **A production-grade leave management system featuring WhatsApp integration and role-based web dashboard.**

## 🎯 Project Overview

LeaveFlow revolutionizes employee leave management by combining **WhatsApp's accessibility** with a **professional web dashboard**. Employees apply for leave via simple WhatsApp messages, while managers/HR approve through an intuitive web interface.

### **Key Innovation**: Multi-Channel Architecture
- 📱 **Workers**: WhatsApp-native (no app installation needed)
- 💼 **Managers/HR/Admin**: Professional web dashboard with real-time updates
- 🔔 **Notifications**: Instant WhatsApp alerts for all stakeholders

---

## ✨ Features

### **Core Functionality**
- ✅ Natural language leave requests via WhatsApp
- ✅ Multi-tier approval workflow (Manager → HR → Admin)
- ✅ Automatic leave balance validation & deduction
- ✅ Support for full-day, half-day (morning/afternoon) leaves
- ✅ Media attachment handling (sick leave certificates)
- ✅ Real-time leave status tracking
- ✅ Company holiday management
- ✅ Leave balance inquiry system

### **Advanced Features**
- 🔐 **JWT Authentication** with 7-day token expiry
- 👥 **4-Tier Role System**: Worker, Manager, HR, Admin
- 📊 **Dashboard Analytics**: Pending/approved/rejected metrics
- 🌙 **Dark Mode**: Full theme support with CSS variables
- 📋 **Account Request System**: Manager/HR submit account creation requests for admin approval
- 🔄 **Audit Trail**: Complete history of all actions with balance change tracking
- ⚡ **Auto-Escalation**: Pending requests escalate after 24 hours
- 📸 **Media Downloads**: WhatsApp image/document integration
- 🔍 **Advanced Search**: Multi-filter search with date ranges
- 📅 **Carry Forward**: Automated year-end leave rollover (max 5 days)

### **Production Features**
- 🧪 **Unit Tests**: 15+ test cases with pytest
- 📚 **API Documentation**: Auto-generated Swagger/ReDoc
- 🐳 **Environment Config**: Secure .env template
- 📊 **Balance History**: Complete audit trail for compliance

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     LeaveFlow System                         │
├──────────────────────┬──────────────────────────────────────┤
│   Frontend (Web)     │         Backend (API)                │
│                      │                                       │
│  Next.js 14 + React  │    FastAPI + SQLAlchemy 2.0          │
│  TypeScript          │    PostgreSQL (Async)                 │
│  Tailwind CSS        │    WhatsApp Cloud API                │
│  Radix UI            │    JWT Authentication                │
│  TanStack Query      │    Pydantic Validation               │
└──────────────────────┴──────────────────────────────────────┘
           │                           │
           └───────────┬───────────────┘
                       │
              ┌────────▼────────┐
              │   Ngrok Tunnel  │
              │   (Webhook)     │
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │  WhatsApp API   │
              │  (Meta/Facebook)│
              └─────────────────┘
```

---

## 🛠️ Technology Stack

### **Frontend**
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.2.33 | React framework with SSR |
| React | 18 | UI library |
| TypeScript | 5.0 | Type safety |
| Tailwind CSS | 3.3 | Styling |
| Radix UI | Latest | Accessible components |
| TanStack Query | 5.17 | Data fetching & caching |

### **Backend**
| Technology | Version | Purpose |
|------------|---------|---------|
| FastAPI | 0.115 | High-performance API framework |
| SQLAlchemy | 2.0.25 | Async ORM |
| PostgreSQL | 18 | Primary database |
| Pydantic | 2.5 | Data validation |
| Python | 3.11+ | Backend language |
| Uvicorn | Latest | ASGI server |

### **Integration & DevOps**
- **WhatsApp Cloud API**: Message processing & notifications
- **Ngrok**: Webhook tunnel for local development
- **JWT**: Token-based authentication
- **Bcrypt**: Password hashing
- **Pytest**: Unit testing framework

---

## 📁 Project Structure

```
LeaveFlow/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── routes/            # API endpoints
│   │   │   ├── auth.py       # Authentication
│   │   │   ├── leave.py      # Leave requests (with search & carry forward)
│   │   │   ├── users.py      # User management
│   │   │   ├── holidays.py   # Holiday management
│   │   │   ├── webhook.py    # WhatsApp webhook
│   │   │   └── account_requests.py  # Account approval workflow
│   │   ├── models.py          # Database models (11 tables)
│   │   ├── schemas.py         # Pydantic schemas
│   │   ├── auth.py            # JWT & permissions
│   │   ├── database.py        # Async DB setup
│   │   ├── config.py          # Environment config
│   │   ├── scheduler.py       # Background tasks
│   │   └── services/          # Business logic
│   │       ├── leave.py
│   │       ├── parser.py      # Message parsing
│   │       ├── validator.py
│   │       └── whatsapp.py    # WhatsApp client
│   ├── tests/                 # Unit tests
│   │   ├── test_api.py        # 15+ test cases
│   │   └── requirements-test.txt
│   ├── migrate.py             # Database migrations
│   ├── schema.sql             # Initial schema
│   ├── requirements.txt       # Python dependencies
│   └── .env.example           # Environment template
│
├── dashboard/                  # Next.js Frontend
│   ├── app/
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Dashboard home
│   │   ├── requests/          # Leave requests pages
│   │   │   ├── page.tsx       # All requests
│   │   │   ├── [id]/page.tsx  # Request details
│   │   │   ├── calendar/      # Calendar view
│   │   │   └── history/       # Request history
│   │   ├── users/             # User management
│   │   │   ├── page.tsx       # All users
│   │   │   └── [id]/page.tsx  # User details + manager assignment
│   │   ├── holidays/          # Holiday management
│   │   ├── signup/            # Registration
│   │   └── lib/
│   │       ├── api.ts         # API client
│   │       ├── auth-context.tsx
│   │       └── providers.tsx
│   ├── components/            # Reusable components
│   │   ├── theme-provider.tsx
│   │   ├── theme-toggle.tsx
│   │   └── ui/                # Radix UI components
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md                  # This file
```

---

## 🚀 Quick Start

### **Prerequisites**
- Python 3.11+
- Node.js 18+
- PostgreSQL 18
- WhatsApp Business API credentials (optional for full features)
- Ngrok account (optional for webhook)

### **1. Clone Repository**
```bash
git clone https://github.com/sriram36/LeaveFlow.git
cd LeaveFlow
```

### **2. Backend Setup**

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Create PostgreSQL database
createdb leaveflow
# Or using psql:
# psql -U postgres -c "CREATE DATABASE leaveflow;"

# Run migrations
python migrate.py

# Start backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: `http://localhost:8000`

### **3. Frontend Setup**

```bash
cd dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: `http://localhost:3000`

### **4. WhatsApp Integration (Optional)**

```bash
# Install ngrok
# Download from: https://ngrok.com/download

# Start ngrok tunnel
ngrok http 8000

# Copy the HTTPS URL (e.g., https://abc123.ngrok-free.app)
# Configure in Meta Developer Console:
# Webhook URL: https://abc123.ngrok-free.app/webhook/whatsapp
# Verify Token: (your WHATSAPP_VERIFY_TOKEN from .env.local)
```

**Meta Developer Console Setup:**
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create WhatsApp Business API app
3. Configure webhook with ngrok URL
4. Subscribe to webhook fields: **messages**, **message_status**
5. Copy credentials to `.env.local`

---

## 📚 API Documentation

### **Interactive Docs**
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### **Key Endpoints**

#### Authentication
```bash
POST /auth/login          # Login with email/password
GET  /auth/me             # Get current user info
POST /auth/register       # Register new user
```

#### Leave Management
```bash
GET  /leave/requests                      # List leave requests
POST /leave/requests                      # Create leave request
GET  /leave/requests/{id}                 # Get specific request
POST /leave/requests/{id}/approve         # Approve request
POST /leave/requests/{id}/reject          # Reject request
GET  /leave/requests/search               # Advanced search (NEW)
GET  /leave/balance/history               # Balance change history (NEW)
POST /leave/carry-forward                 # Year-end rollover (NEW)
```

#### User Management
```bash
GET  /users/              # List all users (HR/Admin)
GET  /users/{id}          # Get user details with balance
PUT  /users/{id}          # Update user (assign manager)
GET  /users/team          # Get manager's team
```

#### Account Requests
```bash
POST /account-requests/                   # Submit account creation request
GET  /account-requests/                   # List all requests (Admin)
POST /account-requests/{id}/approve       # Approve/reject request (Admin)
```

#### Holidays
```bash
GET  /holidays/           # List holidays
POST /holidays/           # Create holiday (HR/Admin)
DELETE /holidays/{id}     # Delete holiday (HR/Admin)
```

#### WhatsApp Webhook
```bash
GET  /webhook/whatsapp    # Webhook verification
POST /webhook/whatsapp    # Receive WhatsApp messages
```

---

## 👥 User Roles & Permissions

### **4-Tier Permission System**

| Role | Access | Capabilities |
|------|--------|-------------|
| **Worker** | WhatsApp Only | • Apply for leave<br>• Check balance<br>• View own requests<br>• Cancel pending requests |
| **Manager** | WhatsApp + Dashboard | • All Worker features<br>• Approve/reject team requests<br>• View team calendar<br>• Submit account creation requests |
| **HR** | WhatsApp + Dashboard | • All Manager features<br>• View all employees<br>• Manage holidays<br>• Assign managers to workers<br>• Access all leave records |
| **Admin** | WhatsApp + Dashboard | • All HR features<br>• Approve account requests<br>• Carry forward leaves<br>• Full system access |

---

## 💬 WhatsApp Commands

### **Worker Commands**
```
leave 2025-12-20 to 2025-12-22 casual family function
leave tomorrow sick fever
half leave 2025-12-15 morning doctor appointment
balance
status
cancel 123
```

### **Manager Commands**
```
approve 123
reject 123 insufficient notice
pending
team today
```

### **Message Parsing Examples**
- `"leave tomorrow casual"`
- `"leave 15-12-2025 sick fever"`
- `"half leave monday morning"`
- `"balance"`
- `"approve 45"`

---

## 🧪 Testing

### **Run Unit Tests**
```bash
cd backend
pip install -r tests/requirements-test.txt
pytest -v
```

### **Test Coverage**
```bash
pytest --cov=app tests/
```

### **Test Categories**
- ✅ Authentication (login, token validation)
- ✅ Leave requests (create, approve, reject)
- ✅ User management (list, get, update)
- ✅ Holiday management
- ✅ Webhook verification

**15+ test cases** covering critical paths.

---

## 🔒 Security Features

### **Authentication & Authorization**
- JWT tokens with 7-day expiry
- Bcrypt password hashing (cost factor 12)
- Role-based access control (4 tiers)
- Token validation on every protected route

### **Data Security**
- SQL injection prevention via SQLAlchemy ORM
- Input validation with Pydantic schemas
- CORS whitelist for allowed origins
- WhatsApp webhook verification token
- Environment variable management
- Phone number & email uniqueness constraints

### **Audit & Compliance**
- Complete leave balance change history
- Audit logs for all actions
- Timestamps on all records
- Actor tracking (who did what)

---

## 🌐 Environment Variables

### **Backend (.env.local)**
```bash
# Database
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/leaveflow

# Security (Generate with: python -c "import secrets; print(secrets.token_hex(32))")
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# WhatsApp Cloud API
WHATSAPP_TOKEN=your-whatsapp-business-api-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_VERIFY_TOKEN=your-custom-verify-token

# CORS (comma-separated)
CORS_ORIGINS=http://localhost:3000

# App Config
ESCALATION_HOURS=24
```

### **Frontend (.env.local)**
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
# Or with ngrok:
NEXT_PUBLIC_API_URL=https://your-ngrok-url.ngrok-free.app
```

---

## 🗄️ Database Schema

### **11 Tables**

1. **users** - User accounts with roles
2. **leave_requests** - Leave applications
3. **leave_balances** - Current year balances
4. **leave_balance_history** - Audit trail of balance changes (NEW)
5. **holidays** - Company holidays
6. **attachments** - Leave certificates/documents
7. **audit_logs** - Action history
8. **processed_messages** - WhatsApp message idempotency
9. **account_creation_requests** - Approval workflow for new accounts
10. **Session tables** (managed by framework)

---

## 📊 Dashboard Pages

1. **Home** (`/`) - Dashboard overview with stats
2. **Requests** (`/requests`) - All leave requests with filters
3. **Request Details** (`/requests/[id]`) - Individual request with approval
4. **Calendar** (`/requests/calendar`) - Visual leave calendar
5. **History** (`/requests/history`) - Past requests with CSV export
6. **Users** (`/users`) - Employee list (HR/Admin only)
7. **User Details** (`/users/[id]`) - Profile with manager assignment
8. **Holidays** (`/holidays`) - Holiday management
9. **Signup** (`/signup`) - New user registration

All pages support **dark mode** with theme toggle.

---

## 🎨 UI Features

- **Professional SaaS Design**: Modern gradient cards and animations
- **Dark Mode**: Complete theme support with CSS variables
- **Responsive**: Mobile-friendly layout
- **Accessible**: Radix UI components with keyboard navigation
- **Real-time Updates**: TanStack Query with cache invalidation
- **Loading States**: Skeleton screens and spinners
- **Error Handling**: User-friendly error messages

---

## 🔄 Workflow Examples

### **1. Leave Application Flow**
```
Worker sends WhatsApp: "leave tomorrow sick fever"
    ↓
System validates balance
    ↓
Creates request (status: pending)
    ↓
Manager gets WhatsApp notification
    ↓
Manager approves via dashboard/WhatsApp
    ↓
Balance deducted automatically
    ↓
Worker gets approval notification
    ↓
Balance history recorded
```

### **2. Account Creation Flow**
```
Manager submits account request (via API)
    ↓
Request stored (status: pending)
    ↓
Admin reviews in dashboard
    ↓
Admin approves
    ↓
User created with leave balance
    ↓
Manager notified
```

### **3. Year-End Carry Forward**
```
Admin runs: POST /leave/carry-forward
    ↓
System reads all current year balances
    ↓
Calculates carryover (max 5 casual days)
    ↓
Creates next year balances
    ↓
Records in balance history
    ↓
Completion report generated
```

---

## 🚨 Troubleshooting

### **Backend won't start**
```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT version();"

# Verify database exists
psql -U postgres -l | grep leaveflow

# Check .env.local file exists
cat backend/.env.local

# Test database connection
python -c "from app.database import engine; print('Connected')"
```

### **Frontend errors**
```bash
# Clear Next.js cache
rm -rf dashboard/.next
npm run dev

# Check API connection
curl http://localhost:8000/health
```

### **WhatsApp webhook not working**
```bash
# Check ngrok is running
curl http://127.0.0.1:4040/api/tunnels

# Verify webhook verification
curl "http://localhost:8000/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test"

# Check backend logs for incoming messages
```

---

## 📈 Performance Considerations

### **Current Capacity**
- **Users**: 50-500 employees
- **Requests/day**: 100-500
- **WhatsApp messages/minute**: 60 (API limit)

### **Scaling Strategies** (Future)
- Add Redis for session caching
- Implement database connection pooling (already async)
- Use message queue for WhatsApp sends (Celery)
- Add read replicas for reports
- Implement pagination (currently loads all)

---

## 🎯 Future Enhancements

### **Planned Features**
- [ ] Email notifications (fallback)
- [ ] Bulk approve/reject
- [ ] CSV export for all data
- [ ] Mobile app (React Native)
- [ ] Calendar integration (Outlook/Google)
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Docker Compose setup
- [ ] CI/CD pipeline
- [ ] Kubernetes deployment

---

## 📝 Development

### **Code Quality**
```bash
# Format code
black backend/app
prettier --write dashboard

# Lint
flake8 backend/app
npm run lint

# Type checking
mypy backend/app
npm run type-check
```

### **Database Migrations**
```bash
# After model changes, run:
python backend/migrate.py
```

---

## 🤝 Contributing

This is a portfolio project. For production use, consider:
1. Adding more comprehensive tests
2. Implementing CI/CD pipeline
3. Setting up error monitoring (Sentry)
4. Adding database backup strategy
5. Implementing rate limiting
6. Adding email notifications

---

## 📄 License

MIT License - Free for personal and commercial use.

---

## 👨‍💻 Author

**Sriram**
- GitHub: [@sriram36](https://github.com/sriram36)
- Repository: [LeaveFlow](https://github.com/sriram36/LeaveFlow)

---

## 🎓 Technical Highlights

### **What Makes This Project Stand Out**

1. **Multi-Channel Architecture**: WhatsApp + Web (unique approach)
2. **Async/Await Mastery**: SQLAlchemy 2.0 with proper eager loading
3. **Production Patterns**: JWT auth, role-based access, audit trails
4. **Modern Tech Stack**: Next.js 14 App Router, FastAPI latest
5. **Real Business Logic**: Not just CRUD - actual workflow automation
6. **API Integration**: WhatsApp Cloud API with webhook handling
7. **Type Safety**: TypeScript frontend + Pydantic backend
8. **Testing**: Unit tests with pytest
9. **Documentation**: Swagger auto-docs + comprehensive README
10. **Dark Mode**: Complete theme support

### **Skills Demonstrated**
- ✅ Full-stack development (Python + TypeScript)
- ✅ RESTful API design
- ✅ Database design (PostgreSQL + SQLAlchemy)
- ✅ Authentication & authorization
- ✅ External API integration (WhatsApp)
- ✅ Webhook handling
- ✅ Natural language processing (basic)
- ✅ Real-time updates
- ✅ Responsive UI design
- ✅ State management (React Query)
- ✅ Testing strategies
- ✅ Security best practices

---

## 🏆 Project Stats

- **Backend**: 2,500+ lines of Python
- **Frontend**: 1,500+ lines of TypeScript/React
- **Database**: 11 tables, 60+ columns
- **API Endpoints**: 30+ routes
- **Pages**: 9 dashboard pages
- **Test Cases**: 15+ unit tests
- **Features**: 25+ core features
- **Roles**: 4-tier permission system

---

## 📞 Support

For issues or questions:
1. Check the [Troubleshooting](#-troubleshooting) section
2. Review [API Documentation](#-api-documentation)
3. Open an issue on GitHub

---

## ⭐ Acknowledgments

- FastAPI for excellent async Python framework
- Next.js for modern React development
- Radix UI for accessible components
- WhatsApp Business API for messaging integration
- PostgreSQL for reliable data storage

---

**Built with ❤️ for modern leave management**

```
┌─────────────────────────────────────────┐
│  LeaveFlow v1.0.0                       │
│  Making leave management simple         │
│  🚀 Production-ready architecture       │
└─────────────────────────────────────────┘
```

