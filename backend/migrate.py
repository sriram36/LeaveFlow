"""
Database migration script to add new tables.
Run this after updating models.py to create missing tables.
"""

import asyncio
from sqlalchemy import text
from app.database import engine, Base
from app.config import get_settings

settings = get_settings()


async def migrate():
    """Create all tables (SQLAlchemy will only create missing ones)."""
    async with engine.begin() as conn:
        # This will create new tables: AccountCreationRequest, LeaveBalanceHistory
        await conn.run_sync(Base.metadata.create_all)
        print("✅ Database migration complete!")
        print("✅ New tables created:")
        print("   - account_creation_requests")
        print("   - leave_balance_history")


if __name__ == "__main__":
    asyncio.run(migrate())
