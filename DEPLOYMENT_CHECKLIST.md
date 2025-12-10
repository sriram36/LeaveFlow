# LeaveFlow - Vercel Deployment Checklist

## What You Need to Do:

### 1. Create PostgreSQL Database
- **Neon** (Recommended): https://neon.tech
  - Create project → Copy connection string
  - Format: `postgres://user:pass@host.neon.tech/dbname`

### 2. Deploy Backend
```bash
npm install -g vercel
vercel login
cd backend
vercel
```
Copy the deployment URL (e.g., `https://leaveflow-backend.vercel.app`)

### 3. Add Environment Variables in Vercel
Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

Add these:
```bash
DATABASE_URL=<your-postgres-url-from-step-1>
SECRET_KEY=<generate: python -c "import secrets; print(secrets.token_urlsafe(32))">
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
CORS_ORIGINS=<your-frontend-url-will-add-in-step-6>
WHATSAPP_TOKEN=<your-whatsapp-token>
WHATSAPP_PHONE_NUMBER_ID=<your-phone-id>
WHATSAPP_VERIFY_TOKEN=leaveflow-verify
OPENROUTER_API_KEY=<your-openrouter-key>
```

**Important**: Click "Redeploy" after adding variables

### 4. Initialize Database
```bash
cd backend
$env:DATABASE_URL="<your-postgres-url>"
python migrate.py
python migrate_account_status.py
python seed_demo_data.py
```

### 5. Deploy Frontend
```bash
cd dashboard
vercel
```
Copy the deployment URL (e.g., `https://leaveflow.vercel.app`)

### 6. Update CORS in Backend
- Go back to backend environment variables
- Update `CORS_ORIGINS` with your frontend URL from step 5
- Redeploy backend

### 7. Test
- Visit your frontend URL
- Login: `admin@leaveflow.com` / `admin123`
- Test features

---

## Quick Troubleshooting

**Database connection failed**
→ Check DATABASE_URL is correct in Vercel env vars

**CORS error**
→ Add frontend URL to CORS_ORIGINS and redeploy backend

**Environment variables not working**
→ Ensure they're in "Production" environment and redeploy

---

## Done! ✅
Your LeaveFlow app is live on Vercel.

- Backend: https://your-backend.vercel.app
- Frontend: https://your-frontend.vercel.app
- API Docs: https://your-backend.vercel.app/docs
