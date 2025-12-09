"""
LeaveFlow API - WhatsApp-Native Leave Automation System

FastAPI backend for leave management with WhatsApp integration.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
import traceback

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


# Global exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with clear messages."""
    errors = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error["loc"])
        errors.append({
            "field": field,
            "message": error["msg"],
            "type": error["type"]
        })
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation error",
            "errors": errors
        }
    )


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    """Handle database errors gracefully."""
    print(f"[Database Error] {exc}")
    traceback.print_exc()
    
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "detail": "Database temporarily unavailable. Please try again later.",
            "error_type": "database_error"
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Catch-all exception handler for unexpected errors."""
    print(f"[Unhandled Error] {exc}")
    traceback.print_exc()
    
    # Don't expose internal error details in production
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An unexpected error occurred. Our team has been notified.",
            "error_type": "internal_error"
        }
    )


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
