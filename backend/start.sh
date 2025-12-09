#!/bin/bash

# Railway startup script
echo "🚀 Starting LeaveFlow API..."
echo "PORT: ${PORT:-8000}"
echo "HOST: 0.0.0.0"

# Start uvicorn
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --log-level info
