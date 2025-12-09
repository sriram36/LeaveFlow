"""
LeaveFlow API - WhatsApp-Native Leave Automation System

FastAPI backend for leave management with WhatsApp integration.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db
from app.scheduler import start_scheduler, stop_scheduler
from app.routes import auth, leave, webhook, users, holidays, account_requests

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    try:
        await init_db()
        start_scheduler()
    except Exception as e:
        print(f"[Startup Warning] {e}")
        # Continue anyway - health endpoint should still work
    yield
    # Shutdown
    try:
        stop_scheduler()
    except Exception as e:
        print(f"[Shutdown Warning] {e}")


app = FastAPI(
    title="LeaveFlow API",
    description="WhatsApp-Native Leave Automation & Approval System",
    version="1.0.0",
    lifespan=lifespan,
    swagger_ui_init_oauth={
        "usePkceWithAuthorizationCodeGrant": True,
    }
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(leave.router)
app.include_router(webhook.router)
app.include_router(users.router)
app.include_router(holidays.router)
app.include_router(account_requests.router)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "LeaveFlow API",
        "version": "1.0.0"
    }


@app.get("/health")
async def health():
    """Detailed health check - always returns 200."""
    return {
        "status": "healthy"
    }
