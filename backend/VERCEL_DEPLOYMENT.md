# LeaveFlow Backend - Vercel Deployment Guide

This guide explains how to deploy the LeaveFlow backend to Vercel.

## Prerequisites

- Vercel account (https://vercel.com)
- Vercel CLI (optional): `npm i -g vercel`
- PostgreSQL database (can use Vercel Postgres, Supabase, or any other PostgreSQL provider)

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Connect Repository**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Select the `backend` directory as the root directory

2. **Configure Environment Variables**
   Add the following environment variables in the Vercel project settings:
   
   ```
   DATABASE_URL=postgresql+asyncpg://user:password@host:5432/database
   SECRET_KEY=your-secure-secret-key-here
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=10080
   WHATSAPP_TOKEN=your-whatsapp-token
   WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
   WHATSAPP_VERIFY_TOKEN=leaveflow-verify
   CORS_ORIGINS=https://your-frontend-domain.vercel.app
   OPENROUTER_API_KEY=your-openrouter-api-key
   ESCALATION_HOURS=24
   ```

3. **Deploy**
   - Click "Deploy"
   - Vercel will automatically detect the Python project and use the `vercel.json` configuration

### Option 2: Deploy via Vercel CLI

1. **Login to Vercel**
   ```bash
   vercel login
   ```

2. **Navigate to Backend Directory**
   ```bash
   cd backend
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   
   For production:
   ```bash
   vercel --prod
   ```

## Important Notes

### Scheduler Limitations
⚠️ **Background Jobs**: Vercel's serverless functions are stateless and don't support persistent background jobs. The APScheduler will be automatically disabled when running on Vercel.

To handle scheduled tasks on Vercel, you have two options:

1. **Vercel Cron Jobs** (Recommended)
   - Add cron jobs in your `vercel.json`:
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/daily-summary",
         "schedule": "0 8 * * *"
       },
       {
         "path": "/api/cron/check-escalations",
         "schedule": "0 * * * *"
       }
     ]
   }
   ```
   - Create corresponding API endpoints to handle these cron jobs

2. **External Cron Service**
   - Use services like cron-job.org or EasyCron to hit your API endpoints on a schedule

### Database Connections
- Use connection pooling carefully in serverless environments
- Consider using Vercel Postgres or Supabase for managed PostgreSQL
- Set appropriate connection limits in your database settings

### File Storage
- Vercel's file system is read-only except for `/tmp`
- Use external storage (Supabase, AWS S3, etc.) for file uploads

### Cold Starts
- First request after inactivity may be slower (cold start)
- Keep your dependencies minimal to reduce cold start time
- Consider using a keep-alive service for critical production apps

## Testing Locally

To test the Vercel configuration locally:

```bash
# Install Vercel CLI
npm i -g vercel

# Run in development mode
vercel dev
```

This will simulate the Vercel environment locally.

## Monitoring & Logs

- View logs in Vercel Dashboard: https://vercel.com/dashboard
- Real-time logs: `vercel logs [deployment-url]`

## Troubleshooting

### "Module not found" errors
- Ensure all dependencies are in `requirements.txt`
- Check that the Python version is compatible (Vercel supports Python 3.9+)

### Database connection errors
- Verify `DATABASE_URL` is correctly formatted for asyncpg
- Check if your database allows connections from Vercel's IP ranges
- For Vercel Postgres, use the connection string from the Vercel dashboard

### CORS errors
- Ensure `CORS_ORIGINS` includes your frontend domain
- Use comma-separated values for multiple origins

## Vercel Configuration Files

- `vercel.json` - Main configuration file
- `.vercelignore` - Files to exclude from deployment
- `api/index.py` - Serverless function entry point

## Additional Resources

- [Vercel Python Documentation](https://vercel.com/docs/functions/serverless-functions/runtimes/python)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
