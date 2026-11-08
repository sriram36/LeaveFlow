"""Demo helpers: a public "try the parser" endpoint, and a reset for the shared demo account."""
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user_required
from app.database import get_db
from app.limiter import limiter
from app.models import User
from app.services.demo_seed import DEMO_EMAIL, reset_demo_team
from app.services.parser import parse_message

router = APIRouter(prefix="/demo", tags=["Demo"])


@router.post("/reset")
@limiter.limit("5/minute")
async def reset_demo(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user_required),
) -> dict:
    """Reset the demo team's data. Only the shared demo account may call this."""
    if (user.email or "").lower() != DEMO_EMAIL:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the demo account can reset the demo")
    return await reset_demo_team(db)


class ParseRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=200)


class ParseResponse(BaseModel):
    command: str
    leave_type: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    half_day_period: Optional[str] = None
    reason: Optional[str] = None
    request_id: Optional[int] = None
    error: Optional[str] = None


@router.post("/parse", response_model=ParseResponse)
@limiter.limit("30/minute")
async def try_the_parser(request: Request, body: ParseRequest) -> ParseResponse:
    """Run a WhatsApp-style message through the real rule-based parser.

    Public on purpose (it powers the landing-page demo): it reads nothing, writes nothing,
    and only returns what the parser understood.
    """
    parsed = parse_message(body.message)
    return ParseResponse(
        command=parsed.command_type.value,
        leave_type=parsed.leave_type,
        start_date=parsed.start_date,
        end_date=parsed.end_date,
        half_day_period=parsed.half_day_period,
        reason=parsed.reason,
        request_id=parsed.request_id,
        error=parsed.error,
    )
