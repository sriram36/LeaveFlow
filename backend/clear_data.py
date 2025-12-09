"""Clear all data from database"""
import asyncio
from app.database import async_session_maker
from app.models import User, LeaveRequest, Holiday, AccountCreationRequest, LeaveBalance, LeaveBalanceHistory, AuditLog
from sqlalchemy import delete

async def clear_all_data():
    async with async_session_maker() as db:
        print("🗑️  Clearing all data from database...")
        
        # Delete in order to respect foreign key constraints
        await db.execute(delete(AuditLog))
        print("   ✅ Cleared audit logs")
        
        await db.execute(delete(LeaveRequest))
        print("   ✅ Cleared leave requests")
        
        await db.execute(delete(AccountCreationRequest))
        print("   ✅ Cleared account requests")
        
        await db.execute(delete(Holiday))
        print("   ✅ Cleared holidays")
        
        await db.execute(delete(LeaveBalanceHistory))
        print("   ✅ Cleared leave balance history")
        
        await db.execute(delete(LeaveBalance))
        print("   ✅ Cleared leave balances")
        
        await db.execute(delete(User))
        print("   ✅ Cleared users")
        
        await db.commit()
        print("\n✅ All data cleared! Ready for fresh seed.\n")

if __name__ == "__main__":
    asyncio.run(clear_all_data())
