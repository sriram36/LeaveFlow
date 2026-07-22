from app.logging_config import logger
"""
LeaveFlow API - WhatsApp-Native Leave Automation System

FastAPI backend for leave management with WhatsApp integration.
"""

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
import traceback
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import get_settings
from app.routes import auth, leave, webhook, users, holidays, account_requests

settings = get_settings()

# Initialize FastAPI app without lifespan (for serverless compatibility)
app = FastAPI(
    title="LeaveFlow API",
    description="WhatsApp-Native Leave Automation & Approval System",
    version="1.0.0",
    swagger_ui_init_oauth={
        "usePkceWithAuthorizationCodeGrant": True,
    }
)

from app.limiter import limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware
cors_origins = settings.cors_origins or "*"
allow_origins_list = cors_origins.split(",")

# Security fix: Do not allow credentials if origins is wildcard
allow_credentials = True
if "*" in allow_origins_list:
    allow_credentials = False

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins_list,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
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
    logger.error(f"[Database Error] {exc}")
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
    logger.error(f"[Unhandled Error] {exc}")
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
    """Root endpoint - simple health check."""
    import os
    return {
        "status": "ok",
        "service": "LeaveFlow API",
        "version": "1.0.0",
        "message": "API is running",
        "port": os.getenv("PORT", "8000"),
        "host": "0.0.0.0"
    }


@app.get("/health")
async def health():
    """Health check endpoint - Always returns 200 OK for deployment.
    
    This endpoint is designed to always pass, even if dependencies fail.
    Railway, Render, Vercel, and other platforms use this for deployment health checks.
    """
    try:
        import os
        return {
            "status": "ok",
            "healthy": True,
            "service": "LeaveFlow",
            "port": os.getenv("PORT", "8000")
        }
    except Exception:
        # Even if something goes wrong, return success for deployment
        return {"status": "ok", "healthy": True}


from fastapi import WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.websockets import manager
from app.database import get_db
from app.models import User
import jwt

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, db: AsyncSession = Depends(get_db)):
    # Authenticate via cookie or query param
    token = websocket.cookies.get("access_token")
    if not token:
        token = websocket.query_params.get("token")
        
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Authentication required")
        return
        
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id = int(payload.get("sub"))
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        
        if not user:
            raise Exception("User not found")
            
        await manager.connect(websocket, user)
        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            manager.disconnect(websocket)
            
    except Exception as e:
        logger.error(f"[WebSocket] Authentication failed: {e}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Authentication failed")
