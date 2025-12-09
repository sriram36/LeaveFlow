# LeaveFlow

WhatsApp-based leave management system with web dashboard.

## Features
- WhatsApp bot for leave requests (natural language processing)
- Web dashboard for managers, HR, and admins
- JWT authentication with role-based access control
- Automatic leave balance tracking and deduction
- Holiday management with calendar integration
- Multi-level approval workflow with notifications
- Account creation approval system
- Audit logging for all actions

## Tech Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: FastAPI, PostgreSQL, SQLAlchemy 2.0 (async)
- **Integrations**: WhatsApp Cloud API, Google Gemini AI
- **Auth**: JWT tokens with bcrypt password hashing
- **Testing**: Pytest with 15+ test cases

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- WhatsApp Business API credentials (from Meta)

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows (Linux: source venv/bin/activate)
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your credentials

# Initialize database and seed demo data
python seed_demo_data.py

# Start server
uvicorn app.main:app --reload
```

Backend runs at: http://localhost:8000
API docs at: http://localhost:8000/docs

### Frontend Setup
```bash
cd dashboard
npm install

# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start development server
npm run dev
```

Frontend runs at: http://localhost:3000

## Demo Credentials

After running `seed_demo_data.py`, use these credentials to login:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| Admin | admin@leaveflow.com | admin123 | Full system access |
| HR | hr1@leaveflow.com | hr123 | User & leave management |
| Manager | manager1@leaveflow.com | manager123 | Team leave approval |
| Worker | worker1@leaveflow.com | worker123 | Own leave requests |

The demo data includes:
- 51 users across all roles
- 58 leave requests (approved, pending, rejected, cancelled)
- 4 account creation requests
- 7 holidays for 2025
- Complete leave balance records

## WhatsApp Bot Setup

### 1. Get WhatsApp Credentials
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create an app and select "WhatsApp" product
3. Get your:
   - Access Token (WHATSAPP_TOKEN)
   - Phone Number ID (WHATSAPP_PHONE_NUMBER_ID)
   - Create a verify token (any random string)

### 2. Configure Webhook
For local development, use ngrok:
```bash
ngrok http 8000
```

In Meta Developer Console:
- Webhook URL: `https://your-ngrok-url.ngrok.io/webhook/whatsapp`
- Verify Token: (same as WHATSAPP_VERIFY_TOKEN in .env)
- Subscribe to: `messages` event

### 3. Test WhatsApp Commands
Send messages to your WhatsApp Business number:
- "Balance" → Check leave balance
- "Apply 2 days sick leave from tomorrow" → Create leave request
- "Cancel request #5" → Cancel a pending request
- "My leaves" → View your leave history

The bot uses Google Gemini AI for natural language understanding.

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/leaveflow
SECRET_KEY=your-secret-key-generate-with-secrets-module
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
WHATSAPP_TOKEN=your-whatsapp-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_VERIFY_TOKEN=your-verify-token
GEMINI_API_KEY=your-gemini-api-key
CORS_ORIGINS=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Deployment

### Railway (Backend)
```bash
cd backend
npx railway login
npx railway init
# Set all environment variables in Railway dashboard
npx railway up
```

### Vercel (Frontend)
```bash
cd dashboard
npx vercel --prod
# Add NEXT_PUBLIC_API_URL in Vercel dashboard
```

## Project Structure
```
LeaveFlow/
├── backend/
│   ├── app/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── models.py       # Database models
│   │   ├── schemas.py      # Pydantic schemas
│   │   ├── auth.py         # JWT authentication
│   │   ├── database.py     # Database connection
│   │   └── main.py         # FastAPI app
│   ├── tests/              # Pytest test suite
│   ├── requirements.txt    # Python dependencies
│   └── seed_demo_data.py   # Demo data loader
├── dashboard/
│   ├── app/                # Next.js app directory
│   │   ├── lib/           # API client & auth
│   │   ├── requests/      # Leave request pages
│   │   ├── users/         # User management
│   │   └── holidays/      # Holiday management
│   └── components/         # Reusable UI components
└── README.md
```

## Testing
```bash
cd backend
pip install -r tests/requirements-test.txt
pytest tests/ -v
```

## License
MIT


