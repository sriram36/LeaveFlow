# 🚀 COPY-PASTE DEPLOYMENT COMMANDS

Follow these commands in order. No additional setup needed!

---

## 📋 Prerequisites (One-time Setup)

Create accounts at:
1. https://railway.app (sign up with GitHub)
2. https://vercel.com (sign up with GitHub)
3. Get WhatsApp API credentials from Meta/Facebook

---

## 🎯 Step 1: Deploy Backend to Railway (Copy & Paste)

```bash
# 1. Login to Railway (opens browser)
npx railway login

# 2. Navigate to backend
cd D:\Projects\LeaveFlow\backend

# 3. Initialize Railway project (creates project + PostgreSQL database)
npx railway init

# 4. Set Database (Railway creates automatically)
npx railway variable set DATABASE_URL "postgresql+asyncpg://postgres:password@localhost/leaveflow"

# 5. Set your Secret Key (generate unique one)
npx railway variable set SECRET_KEY "your-super-secret-key-12345"

# 6. Set JWT settings
npx railway variable set ALGORITHM "HS256"
npx railway variable set ACCESS_TOKEN_EXPIRE_MINUTES "10080"

# 7. Set WhatsApp credentials
npx railway variable set WHATSAPP_TOKEN "your-whatsapp-access-token"
npx railway variable set WHATSAPP_PHONE_NUMBER_ID "your-phone-id"
npx railway variable set WHATSAPP_VERIFY_TOKEN "your-verify-token"

# 8. Set CORS to allow Vercel frontend
npx railway variable set CORS_ORIGINS "https://leaveflow-app.vercel.app,http://localhost:3000"

# 9. Deploy!
npx railway up

# ✅ Wait for deployment to complete
# 📋 Copy the URL shown (e.g., https://leaveflow-api-production.up.railway.app)
```

---

## 🎨 Step 2: Deploy Frontend to Vercel (Copy & Paste)

```bash
# 1. Navigate to frontend
cd D:\Projects\LeaveFlow\dashboard

# 2. Deploy to Vercel
npx vercel --prod

# When prompted:
# - "Set up and deploy?" → Type "Y" and press Enter
# - "Which scope?" → Select your personal account
# - "Link to existing project?" → Type "N" and press Enter
# - "Project name?" → Type "leaveflow-app" and press Enter
# - "Root directory?" → Just press Enter (use default)
# - "Build and Output settings?" → Just press Enter (use default)

# 3. When asked for environment variables:
# - Click the link shown or go to: https://vercel.com/settings/environment-variables
# - Add new variable:
#   - Name: NEXT_PUBLIC_API_URL
#   - Value: (paste the FULL URL from Step 1, e.g., https://leaveflow-api-production.up.railway.app)
#   - IMPORTANT: Do NOT include trailing slash!

# 4. Redeploy with the new variable
npx vercel --prod --force

# ✅ Your app is now live!
# 📋 Copy the URL shown (e.g., https://leaveflow-app.vercel.app)
```

---

## ✅ Step 3: Verify Everything Works

```bash
# 1. Open your frontend
# https://leaveflow-app.vercel.app

# 2. Try to login
# Email: hr@leaveflow.com
# Password: hr123

# 3. Check API docs
# https://leaveflow-api-production.up.railway.app/docs

# 4. If login works, you're done! 🎉
```

---

## 🔄 Step 4: Enable Auto-Deployment

The GitHub Actions workflow is already created!

```bash
# Just push your changes to GitHub
cd D:\Projects\LeaveFlow
git add .
git commit -m "Deploy to production"
git push origin main

# ✅ GitHub Actions will automatically:
#    1. Run tests
#    2. Build backend
#    3. Build frontend
#    4. Deploy both to Railway and Vercel
#
# ⏱️ Wait 10-15 minutes, then refresh your app!
```

---

## 📊 Command-by-Command Walkthrough

### If you're doing this step-by-step:

**Terminal 1 - Backend Setup:**
```bash
npx railway login
cd D:\Projects\LeaveFlow\backend
npx railway init
npx railway variable set SECRET_KEY "your-generated-secret-key-here"
npx railway variable set ALGORITHM "HS256"
npx railway variable set ACCESS_TOKEN_EXPIRE_MINUTES "10080"
npx railway variable set WHATSAPP_TOKEN "your-whatsapp-token-here"
npx railway variable set WHATSAPP_PHONE_NUMBER_ID "your-phone-id-here"
npx railway variable set WHATSAPP_VERIFY_TOKEN "your-verify-token-here"
npx railway variable set CORS_ORIGINS "https://leaveflow-app.vercel.app,http://localhost:3000"
npx railway up
# Wait for "✓ Deployed!" message
# Copy the URL: https://leaveflow-api-production.up.railway.app
```

**Terminal 2 - Frontend Setup:**
```bash
cd D:\Projects\LeaveFlow\dashboard
npx vercel --prod
# Follow prompts (press Enter for defaults)
# When asked for NEXT_PUBLIC_API_URL, paste the Railway URL from above
# Wait for "✓ Production" message
# Copy the URL: https://leaveflow-app.vercel.app
```

**Terminal 3 - Test & Verify:**
```bash
# Open browser and test:
# 1. https://leaveflow-app.vercel.app
# 2. Login with hr@leaveflow.com / hr123
# 3. Check browser console (F12) for any errors
# 4. Try clicking "Pending Requests"
```

---

## 🆘 If Something Goes Wrong

### Backend won't deploy
```bash
# Check status
railway status

# View logs
railway logs

# Redeploy
railway up

# Check variables are set
railway variable list
```

### Frontend won't connect to backend
```bash
# 1. Verify backend is running
#    Visit: https://leaveflow-api-production.up.railway.app/docs

# 2. Check Vercel environment variable
#    Go to: https://vercel.com/dashboard → Project → Settings → Environment Variables
#    Make sure NEXT_PUBLIC_API_URL is set to your Railway backend URL

# 3. Redeploy frontend
cd D:\Projects\LeaveFlow\dashboard
npx vercel --prod
```

### Database issues
```bash
# Railway PostgreSQL is automatic
# If you need to check:
railway variable list
# Look for DATABASE_URL

# If missing, create PostgreSQL:
# 1. Go to railway.app dashboard
# 2. Click "New"
# 3. Select "PostgreSQL"
```

---

## 🔑 Where to Get Your Credentials

### SECRET_KEY
```bash
# Generate random secret (run once):
# Windows PowerShell:
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).Guid + (New-Guid).Guid))

# Copy output and use as SECRET_KEY
```

### WhatsApp Credentials
1. Go to https://www.facebook.com/business
2. Create Business Account (if needed)
3. Go to Apps & Assets → Apps
4. Create new App → Business type → WhatsApp
5. Follow setup wizard
6. Get:
   - WHATSAPP_BUSINESS_ACCOUNT_ID
   - WHATSAPP_PHONE_NUMBER_ID
   - WHATSAPP_ACCESS_TOKEN

---

## 📱 After Deployment URLs

| Service | URL |
|---------|-----|
| **Your App** | https://leaveflow-app.vercel.app |
| **Backend API** | https://leaveflow-api-production.up.railway.app |
| **API Documentation** | https://leaveflow-api-production.up.railway.app/docs |
| **Railway Dashboard** | https://railway.app |
| **Vercel Dashboard** | https://vercel.com |
| **GitHub Actions** | https://github.com/sriram36/LeaveFlow/actions |

---

## 📈 Next Deployments (Every Day After This)

```bash
# Your normal workflow:
1. Make changes locally
2. git add .
3. git commit -m "Your message"
4. git push origin main

# GitHub Actions automatically:
✅ Runs tests
✅ Builds backend
✅ Builds frontend
✅ Deploys both
✅ Notifies you

# Your app updates in 10-15 minutes!
```

---

## ⏱️ Timeline

| Step | Time | Action |
|------|------|--------|
| 1 | 5 min | Deploy backend to Railway |
| 2 | 3 min | Deploy frontend to Vercel |
| 3 | 2 min | Verify everything works |
| **Total** | **10 min** | ✅ App live and auto-deploying |

---

## ✨ You're Done When:

1. ✅ Login works at https://leaveflow-app.vercel.app
2. ✅ API docs available at https://leaveflow-api-production.up.railway.app/docs
3. ✅ You can see leave requests in the dashboard
4. ✅ Next git push triggers auto-deployment

---

## 🎯 Final Checklist

- [ ] Created Railway account
- [ ] Created Vercel account
- [ ] Backend deployed to Railway
- [ ] PostgreSQL database created (automatic)
- [ ] Frontend deployed to Vercel
- [ ] Environment variables set
- [ ] Login works
- [ ] API docs accessible
- [ ] Ready to use!

---

**Ready? Start with Step 1 above! 🚀**

Questions? Check RAILWAY_VERCEL_DEPLOY.md for detailed explanations.
