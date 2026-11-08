"""Demo helpers: let the shared demo account put the demo data back to its starting state."""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user_required
from app.database import get_db
from app.limiter import limiter
from app.models import User
from app.services.demo_seed import DEMO_EMAIL, reset_demo_team

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
