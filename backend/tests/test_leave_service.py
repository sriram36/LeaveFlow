import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.leave import LeaveService
from app.models import User, UserRole

@pytest.mark.asyncio
async def test_leave_service_init(db_session: AsyncSession):
    # Verify the service initializes correctly with DB
    service = LeaveService(db_session)
    assert service.db is not None
    
    # Try to add a test user to see if DB works
    test_user = User(
        name="Test User",
        phone="+919999999999",
        role=UserRole.worker
    )
    db_session.add(test_user)
    await db_session.commit()
    
    assert test_user.id is not None
