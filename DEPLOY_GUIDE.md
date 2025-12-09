# Deployment Guide

## ✅ Database Migration Complete

Your local database has been successfully migrated to Railway PostgreSQL:
- 52 users
- 41 leave requests  
- 52 leave balances
- 7 holidays
- 2 account creation requests

## Backend Deployment (Railway)

1. **Link your project:**
   ```bash
   cd backend
   npx railway link
   # Select: LeaveFlow project
   # Select: backend service (or create new service)
   ```

2. **Set environment variables** (if not already set):
   ```bash
   npx railway variables set SECRET_KEY="your-secret-key-here"
   npx railway variables set ALGORITHM="HS256"
   npx railway variables set ACCESS_TOKEN_EXPIRE_MINUTES="10080"
   npx railway variables set WHATSAPP_TOKEN="your-whatsapp-token"
   npx railway variables set WHATSAPP_PHONE_NUMBER_ID="your-phone-number-id"
   npx railway variables set WHATSAPP_VERIFY_TOKEN="your-verify-token"
   npx railway variables set GEMINI_API_KEY="your-gemini-api-key"
   npx railway variables set CORS_ORIGINS="https://your-vercel-app.vercel.app,http://localhost:3000"
   ```

3. **Deploy:**
   ```bash
   npx railway up
   ```

4. **Get your backend URL:**
   ```bash
   npx railway status
   # Copy the URL (e.g., https://leaveflow-backend.up.railway.app)
   ```

## Frontend Deployment (Vercel)

1. **Update environment variable:**
   ```bash
   cd dashboard
   # Create/update .env.local
   echo "NEXT_PUBLIC_API_URL=https://your-railway-backend-url.railway.app" > .env.local
   ```

2. **Test build locally:**
   ```bash
   npm run build
   ```

3. **Deploy to Vercel:**
   ```bash
   npx vercel --prod
   
   # When prompted:
   # - Link to existing project or create new one
   # - Set NEXT_PUBLIC_API_URL in Vercel dashboard
   ```

4. **Or use Vercel dashboard:**
   - Go to https://vercel.com/dashboard
   - Import your GitHub repository
   - Set environment variable: `NEXT_PUBLIC_API_URL` = your Railway backend URL
   - Deploy

## WhatsApp Webhook Setup

Once backend is deployed:

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Select your app → WhatsApp → Configuration
3. Edit webhook:
   - Callback URL: `https://your-railway-backend-url.railway.app/webhook/whatsapp`
   - Verify token: (use same value as WHATSAPP_VERIFY_TOKEN)
4. Subscribe to `messages` webhook field
5. Test by sending a message to your WhatsApp Business number

## Verify Deployment

**Backend health check:**
```bash
curl https://your-railway-backend-url.railway.app/health
# Should return: {"status":"healthy"}
```

**API documentation:**
Visit: `https://your-railway-backend-url.railway.app/docs`

**Frontend:**
Visit your Vercel URL and login with:
- Email: `admin@leaveflow.com`
- Password: `admin123`

**Test WhatsApp:**
Send: "balance" to your WhatsApp Business number

## Troubleshooting

**Backend not starting:**
```bash
npx railway logs
```

**Database connection issues:**
- Check DATABASE_URL is set automatically by Railway PostgreSQL service
- Verify it uses `postgresql+asyncpg://` protocol

**Frontend API errors:**
- Verify NEXT_PUBLIC_API_URL is set correctly
- Check CORS_ORIGINS includes your Vercel domain
- Rebuild and redeploy frontend

**WhatsApp not responding:**
- Verify webhook is configured in Meta dashboard
- Check backend logs: `npx railway logs`
- Verify WHATSAPP_TOKEN is valid
- Test webhook manually: `curl https://your-backend.railway.app/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=test`
