"""Quick verification that demo data is working"""
import asyncio
from app.auth import verify_password
from app.database import async_session_maker
from app.models import User, LeaveRequest, UserRole
from sqlalchemy import select, func

async def verify_demo_data():
    async with async_session_maker() as db:
        # Count users by role
        result = await db.execute(
            select(User.role, func.count(User.id))
            .group_by(User.role)
        )
        role_counts = result.all()
        
        print("\n📊 Database Statistics:")
        print("="*60)
        
        total_users = 0
        for role, count in role_counts:
            print(f"   {role.value.title():15} : {count}")
            total_users += count
        
        print(f"   {'Total Users':15} : {total_users}")
        print("-"*60)
        
        # Count leave requests by status
        result = await db.execute(
            select(LeaveRequest.status, func.count(LeaveRequest.id))
            .group_by(LeaveRequest.status)
        )
        status_counts = result.all()
        
        print("\n📋 Leave Requests:")
        total_requests = 0
        for status, count in status_counts:
            print(f"   {status.value.title():15} : {count}")
            total_requests += count
        
        print(f"   {'Total Requests':15} : {total_requests}")
        print("="*60)
        
        # Verify admin login
        result = await db.execute(select(User).where(User.email == "admin@leaveflow.com"))
        admin = result.scalar_one_or_none()
        
        if admin:
            print(f"\n✅ Admin user: {admin.name}")
            print(f"✅ Password works: {verify_password('admin123', admin.password_hash)}")
        
        print("\n📧 Sample Login Credentials:")
        print("-"*60)
        print("   Admin:    admin@leaveflow.com    / admin123")
        print("   HR:       hr1@leaveflow.com      / hr123")
        print("   Manager:  manager1@leaveflow.com / manager123")
        print("   Worker:   worker1@leaveflow.com  / worker123")
        print("-"*60)

if __name__ == "__main__":
    asyncio.run(verify_demo_data())
