"""
Vercel serverless function entry point for LeaveFlow API.

This module wraps the FastAPI application for deployment on Vercel.
"""

from app.main import app

# Vercel expects a variable named 'app' or 'handler'
# FastAPI apps are ASGI apps that Vercel can handle directly
# The 'app' is already accessible at module level via the import above
# We also create an alias 'handler' for maximum compatibility
handler = app
