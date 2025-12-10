# Deploy LeaveFlow to Vercel

## Prerequisites
- Vercel account: [vercel.com](https://vercel.com)
- PostgreSQL database (Neon, Supabase, or Vercel Postgres)

---

## Step 1: Create Database

**Recommended: Neon** (https://neon.tech)
1. Create project → Copy connection string
2. Format: `postgres://user:pass@host.neon.tech/dbname`

**Alternative: Supabase** (https://supabase.com)
- Project Settings → Database → Copy URI

---

## Step 2: Deploy Backend

### Using CLI (Recommended):
```bash
npm install -g vercel
vercel login
cd backend
vercel
```

### Using Dashboard:
1. vercel.com → Import Project
2. Root Directory: `backend`
3. Deploy

---

## Step 3: Set Environment Variables

In Vercel → Project Settings → Environment Variables:

```bash
DATABASE_URL=postgres://user:pass@host/db
SECRET_KEY=<run: python -c "import secrets; print(secrets.token_urlsafe(32))">
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
CORS_ORIGINS=https://your-frontend.vercel.app
WHATSAPP_TOKEN=your-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-id
WHATSAPP_VERIFY_TOKEN=leaveflow-verify
OPENROUTER_API_KEY=your-key
```

**After adding variables → Redeploy**

---

## Step 4: Initialize Database

```bash
cd backend

# Set DATABASE_URL temporarily
$env:DATABASE_URL="your-vercel-postgres-url"

# Run migrations
python migrate.py
python migrate_account_status.py

# Optional: Seed demo data
python seed_demo_data.py
```

---

## Step 5: Deploy Frontend

```bash
cd dashboard
vercel
```

Add environment variable:
- `NEXT_PUBLIC_API_URL` = `https://your-backend.vercel.app`

---

## Step 6: Test

```bash
# Health check
curl https://your-backend.vercel.app/health

# Login
# Visit: https://your-frontend.vercel.app
# Email: admin@leaveflow.com
# Password: admin123
```

---

## Common Issues

**Database connection failed**
- Verify DATABASE_URL is correct
- Check database is accessible

**CORS error**
- Add frontend URL to CORS_ORIGINS
- Redeploy backend

**Environment variables not loading**
- Ensure variables are in "Production" environment
- Redeploy after adding variables

---

## What You Need to Do:

1. ✅ Create PostgreSQL database (Neon/Supabase)
2. ✅ Deploy backend: `cd backend && vercel`
3. ✅ Add environment variables in Vercel dashboard
4. ✅ Run migrations: `python migrate.py && python migrate_account_status.py`
5. ✅ Deploy frontend: `cd dashboard && vercel`
6. ✅ Test login and features

**Done! Your app is live on Vercel 🎉**
