# Deploy LeaveFlow to Vercel

## Prerequisites
- Vercel account: [vercel.com](https://vercel.com)
- PostgreSQL database (Neon, Supabase, or Vercel Postgres)

---

## Step 1: Create Database

**Recommended: Neon (Free Tier)** - https://neon.tech
1. Sign up at neon.tech
2. Create new project → Name it "LeaveFlow"
3. Copy connection string from dashboard
4. Format: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`

**Alternative: Vercel Postgres** - https://vercel.com/storage/postgres
1. Vercel Dashboard → Storage → Create Database → Postgres
2. Connect to your project
3. Copy `POSTGRES_PRISMA_URL` (this will be your DATABASE_URL)

**Alternative: Supabase (Free Tier)** - https://supabase.com
1. Create project → Copy connection string
2. Project Settings → Database → Connection String → URI

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

**Option A: Using Local Environment (Recommended)**
```bash
cd backend

# Install dependencies if not already installed
pip install -r requirements.txt

# Set DATABASE_URL to your production database
$env:DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# Run migrations to create tables
python migrate.py
python migrate_account_status.py

# Optional: Create demo admin account
python seed_demo_data.py
```

**Option B: Using Vercel CLI**
```bash
# Install Vercel CLI
npm install -g vercel

# Set production DATABASE_URL
vercel env add DATABASE_URL production

# Run migration script through Vercel function
# (Create a one-time migration endpoint in your code)
```

**Important Notes:**
- Make sure `sslmode=require` is in the connection string
- For Neon: Use the connection string with `?sslmode=require`
- For Vercel Postgres: Use `POSTGRES_PRISMA_URL` 
- Migrations create all necessary tables (users, leave_requests, etc.)
- `seed_demo_data.py` creates an admin account: admin@leaveflow.com / admin123

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
