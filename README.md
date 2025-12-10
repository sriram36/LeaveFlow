# LeaveFlow 📋

Smart leave management system with WhatsApp bot and web dashboard.

## ✨ Features
- 💬 WhatsApp bot for natural language leave requests
- 🎨 Responsive web dashboard (mobile, tablet, desktop)
- 👤 User profiles with self-service editing
- 🔐 JWT authentication with role-based access
- 📊 Automatic leave balance tracking
- 🎉 Holiday calendar management
- ✅ Multi-level approval workflow
- 📝 Complete audit logging

## 🛠️ Tech Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: FastAPI, PostgreSQL, SQLAlchemy 2.0
- **Integrations**: WhatsApp Cloud API, OpenRouter AI (Free)
- **Auth**: JWT tokens with bcrypt
- **Testing**: Pytest

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- WhatsApp Business API (from Meta)

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows (Linux: source venv/bin/activate)
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Initialize database with demo data
python seed_demo_data.py

# Start server
uvicorn app.main:app --reload
```

**API**: http://localhost:8000 | **Docs**: http://localhost:8000/docs

### Frontend Setup
```bash
cd dashboard
npm install

echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env

npm run dev
```

**Dashboard**: http://localhost:3000

## 🔑 Demo Credentials

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Admin | admin@leaveflow.com | admin123 | Full access |
| HR | hr1@leaveflow.com | hr123 | User management |
| Manager | manager1@leaveflow.com | manager123 | Team approvals |
| Worker | worker1@leaveflow.com | worker123 | Own requests |
- 51 users across all roles
- 58 leave requests (approved, pending, rejected, cancelled)
- 4 account creation requests
- 7 holidays for 2025
- Complete leave balance records

## WhatsApp Bot Setup

### 1. Get WhatsApp Credentials
1. Go to [Meta for Developers](https://developers.facebook.com/)

## 📱 WhatsApp Setup

### 1. Get WhatsApp API Credentials
1. Go to [Meta Developer Console](https://developers.facebook.com/)
2. Create an app → Select "WhatsApp" product
3. Get your credentials:
   - **Access Token** (WHATSAPP_TOKEN)
   - **Phone Number ID** (WHATSAPP_PHONE_NUMBER_ID)
   - **Verify Token** (create any random string)

### 2. Configure Webhook
For local development with ngrok:
```bash
ngrok http 8000
```

In Meta Developer Console:
- **Webhook URL**: `https://your-ngrok-url/webhook/whatsapp`
- **Verify Token**: Match your .env WHATSAPP_VERIFY_TOKEN
- **Subscribe to**: `messages` event

### 3. Try WhatsApp Commands
- `balance` → Check leave balance
- _"Apply 2 days sick leave from tomorrow"_ → Natural language request
- `cancel 5` → Cancel request #5
- `pending` → View pending (managers)

## 🤖 AI Service (Free)

Uses OpenRouter with free AI models:

1. Get API key at [OpenRouter](https://openrouter.ai/keys) (no credit card)
2. Add to `.env`: `OPENROUTER_API_KEY=sk-or-v1-...`
3. Model: `mistralai/mistral-7b-instruct:free`

**Without AI**: System uses structured parsing (`leave from DD/MM/YYYY to DD/MM/YYYY for [reason]`)

## 🌍 Environment Variables

**Backend** (`.env`):
```env
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/leaveflow
SECRET_KEY=generate-with-secrets-module
WHATSAPP_TOKEN=your-token
WHATSAPP_PHONE_NUMBER_ID=your-id
WHATSAPP_VERIFY_TOKEN=your-verify-token
OPENROUTER_API_KEY=sk-or-v1-...
CORS_ORIGINS=http://localhost:3000
```

**Frontend** (`.env`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🚢 Deployment

### Backend (Render/Railway)

#### 1. Create PostgreSQL Database
**Render**: Dashboard → New → PostgreSQL (Free tier available)
**Railway**: New Project → Add PostgreSQL

Copy the **DATABASE_URL** (will look like `postgres://user:pass@host:5432/db`)

#### 2. Deploy Backend
**Render**:
1. Dashboard → New → Web Service
2. Connect your GitHub repo
3. Root Directory: `backend`
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

**Railway**:
1. New Project → Deploy from GitHub
2. Select `backend` folder
3. Add Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

#### 3. Set Environment Variables

Add these in your platform dashboard:

```env
DATABASE_URL=<your-postgres-url-from-step-1>
SECRET_KEY=<generate-random-key>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
WHATSAPP_TOKEN=<your-whatsapp-token>
WHATSAPP_PHONE_NUMBER_ID=<your-phone-id>
WHATSAPP_VERIFY_TOKEN=<any-random-string>
OPENROUTER_API_KEY=<your-openrouter-key>
CORS_ORIGINS=*
```

**Note**: The app automatically converts Render's `postgres://` URLs to `postgresql+asyncpg://` format.

#### 4. Initialize Database
After first deploy, run once:
```bash
python seed_demo_data.py
```

### Frontend (Vercel)
```bash
cd dashboard
npx vercel --prod
```
Add environment variable in Vercel dashboard:
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
```

### ✅ Local vs Cloud

| Setting | Local (.env) | Cloud (Platform Vars) |
|---------|-------------------|----------------------|
| DATABASE_URL | `postgresql+asyncpg://localhost:5432/leaveflow` | Auto-converted from `postgres://` |
| CORS_ORIGINS | `http://localhost:3000` | `*` (or specific domains) |
| Config file | Uses `.env` | Ignores file, uses platform vars |
| Health check | Always passes | Always passes |

## 📁 Project Structure
```
LeaveFlow/
├── backend/
│   ├── app/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic (AI, WhatsApp, Leave)
│   │   ├── models.py       # Database models
│   │   ├── schemas.py      # Pydantic schemas
│   │   ├── auth.py         # JWT authentication
│   │   └── main.py         # FastAPI app
│   ├── tests/              # Test suite
│   ├── requirements.txt    # Dependencies
│   └── seed_demo_data.py   # Demo data
├── dashboard/
│   ├── app/                # Next.js pages
│   │   ├── lib/           # API & auth
│   │   ├── profile/       # User profile
│   │   ├── requests/      # Leave requests
│   │   ├── users/         # User management
│   │   └── holidays/      # Holidays
│   └── components/         # UI components
├── TESTING_GUIDE.md        # Complete testing procedures
├── TROUBLESHOOTING.md      # Common issues & solutions
├── API_DOCUMENTATION.md    # API endpoint reference
├── ERROR_PREVENTION_SUMMARY.md  # Error handling overview
└── README.md
```

## 📚 Documentation

### For Users
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Complete testing procedures for all features
  - 12 feature testing sections
  - Step-by-step test cases
  - Manual and automated testing
  - Test report template

### For Developers
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Complete API reference
  - All endpoints with examples
  - Request/response formats
  - Authentication flow
  - Postman collection
  
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions
  - 20+ common problems
  - Step-by-step fixes
  - Diagnostic scripts
  - Emergency reset procedures

- **[ERROR_PREVENTION_SUMMARY.md](ERROR_PREVENTION_SUMMARY.md)** - Error handling overview
  - Backend error handlers
  - Frontend error handling
  - Validation strategies
  - Production readiness checklist

## 🧪 Testing
```bash
# Backend tests
cd backend
pip install -r tests/requirements-test.txt
pytest tests/ -v --cov=app

# For complete testing guide, see TESTING_GUIDE.md
```

## 🔧 Troubleshooting
Having issues? Check **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** for:
- Module not found errors
- Database connection issues
- WhatsApp webhook problems
- Deployment failures
- And 20+ more common issues

## 📄 License
MIT

---

**Made with ❤️ for modern teams**
