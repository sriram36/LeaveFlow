"""
Seed Demo Data for LeaveFlow - Recruiter Demo
Creates realistic test data to showcase all features
"""

import asyncio
import random
from datetime import date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from passlib.context import CryptContext

from app.database import async_session_maker
from app.models import (
    User, LeaveBalance, LeaveRequest, Holiday, 
    AccountCreationRequest, LeaveBalanceHistory, AuditLog,
    UserRole, LeaveType, LeaveStatus, DurationType, AccountCreationRequestStatus
)

# Simple password hasher for demo seeding (low rounds for speed)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=4)

def hash_password(password: str) -> str:
    """Hash password for demo accounts"""
    return pwd_context.hash(password)


async def seed_data():
    """Seed demo data for recruiter presentation"""
    
    async with async_session_maker() as db:
        print("\n🌱 Starting data seeding...")
        
        # Check if data already exists
        from sqlalchemy import select
        result = await db.execute(select(User).where(User.email == "admin@leaveflow.com"))
        existing_admin = result.scalar_one_or_none()
        
        if existing_admin:
            print("⚠️  Demo data already exists! Skipping seed.")
            print("\n✅ Database contains:")
            print("   • 51 Users (1 Admin + 3 HR + 7 Managers + 40 Workers)")
            print("   • 40 Leave Requests")
            print("   • 7 Holidays")
            print("\n📧 Sample credentials:")
            print("   Admin: admin@leaveflow.com / admin123")
            print("   HR: hr1@leaveflow.com / hr123")
            print("   Manager: manager1@leaveflow.com / manager123")
            print("   Worker: worker1@leaveflow.com / worker123")
            return
        
        # 1. Create Users with different roles
        print("\n👥 Creating users...")
        
        # Admin
        admin = User(
            name="Sarah Johnson",
            phone="+1234567001",
            email="admin@leaveflow.com",
            password_hash=hash_password("admin123"),
            role=UserRole.admin
        )
        db.add(admin)
        await db.flush()
        
        # HR Team (3 HR personnel)
        hr_team = []
        hr_data = [
            ("Michael Chen", "+1234567002", "hr1@leaveflow.com"),
            ("Priya Sharma", "+1234567003", "hr2@leaveflow.com"),
            ("Robert Williams", "+1234567004", "hr3@leaveflow.com"),
        ]
        
        for name, phone, email in hr_data:
            hr = User(
                name=name,
                phone=phone,
                email=email,
                password_hash=hash_password("hr123"),
                role=UserRole.hr
            )
            db.add(hr)
            await db.flush()
            hr_team.append(hr)
        
        # Managers (7 managers)
        managers = []
        manager_data = [
            ("Emily Rodriguez", "+1234567010", "manager1@leaveflow.com"),
            ("David Park", "+1234567011", "manager2@leaveflow.com"),
            ("Amanda Foster", "+1234567012", "manager3@leaveflow.com"),
            ("Kevin Zhang", "+1234567013", "manager4@leaveflow.com"),
            ("Lisa Brown", "+1234567014", "manager5@leaveflow.com"),
            ("Carlos Garcia", "+1234567015", "manager6@leaveflow.com"),
            ("Nina Patel", "+1234567016", "manager7@leaveflow.com"),
        ]
        
        for name, phone, email in manager_data:
            manager = User(
                name=name,
                phone=phone,
                email=email,
                password_hash=hash_password("manager123"),
                role=UserRole.manager
            )
            db.add(manager)
            await db.flush()
            managers.append(manager)
        
        # Workers (40 workers randomly assigned to managers)
        workers = []
        worker_names = [
            "Alex Thompson", "Jessica Lee", "Ryan Martinez", "Sophia Kumar", "James Wilson",
            "Emma Davis", "Oliver Johnson", "Ava Miller", "Liam Anderson", "Isabella Taylor",
            "Noah Thomas", "Mia Jackson", "Ethan White", "Charlotte Harris", "Mason Martin",
            "Amelia Thompson", "Logan Garcia", "Harper Martinez", "Lucas Robinson", "Evelyn Clark",
            "Benjamin Rodriguez", "Abigail Lewis", "Henry Lee", "Emily Walker", "Alexander Hall",
            "Sofia Allen", "Daniel Young", "Avery Hernandez", "Matthew King", "Ella Wright",
            "Joseph Lopez", "Scarlett Hill", "David Scott", "Grace Green", "Jackson Adams",
            "Chloe Baker", "Sebastian Nelson", "Victoria Carter", "Jack Mitchell", "Aria Perez"
        ]
        
        for i, name in enumerate(worker_names):
            # Randomly assign to one of the 7 managers
            assigned_manager = random.choice(managers)
            
            worker = User(
                name=name,
                phone=f"+12345670{50 + i:02d}",
                email=f"worker{i+1}@leaveflow.com",
                password_hash=hash_password("worker123"),
                role=UserRole.worker,
                manager_id=assigned_manager.id
            )
            db.add(worker)
            await db.flush()
            workers.append(worker)
        
        await db.commit()
        print(f"✅ Created 1 Admin, {len(hr_team)} HR, {len(managers)} Managers, {len(workers)} Workers = {1 + len(hr_team) + len(managers) + len(workers)} total users")
        
        # 2. Create Leave Balances
        print("\n💰 Creating leave balances...")
        all_users = [admin] + hr_team + managers + workers
        for user in all_users:
            balance = LeaveBalance(
                user_id=user.id,
                casual=12.0,
                sick=12.0,
                special=5.0,
                year=2025
            )
            db.add(balance)
        
        await db.commit()
        print(f"✅ Created {len(all_users)} leave balances")
        
        # 3. Create Holidays
        print("\n🎉 Creating holidays...")
        holidays_data = [
            (date(2025, 1, 1), "New Year's Day", "New Year celebration"),
            (date(2025, 1, 26), "Republic Day", "India's Republic Day"),
            (date(2025, 3, 14), "Holi", "Festival of Colors"),
            (date(2025, 8, 15), "Independence Day", "India's Independence"),
            (date(2025, 10, 2), "Gandhi Jayanti", "Birth of Mahatma Gandhi"),
            (date(2025, 10, 24), "Diwali", "Festival of Lights"),
            (date(2025, 12, 25), "Christmas", "Christmas Day"),
        ]
        
        for holiday_date, name, desc in holidays_data:
            holiday = Holiday(
                date=holiday_date,
                name=name,
                description=desc
            )
            db.add(holiday)
        
        await db.commit()
        print(f"✅ Created {len(holidays_data)} holidays")
        
        # 4. Create Leave Requests with different statuses
        print("\n📋 Creating leave requests...")
        
        # Create more diverse leave requests across all workers
        # Approved leaves (15 requests)
        approved_count = 0
        for i in range(15):
            worker = random.choice(workers)
            manager = next((m for m in managers if m.id == worker.manager_id), managers[0])
            
            days_count = random.choice([1.0, 2.0, 3.0, 0.5])
            start = date(2025, 11, random.randint(1, 28))
            end = start + timedelta(days=int(days_count) - 1) if days_count >= 1 else start
            
            req = LeaveRequest(
                user_id=worker.id,
                start_date=start,
                end_date=end,
                leave_type=random.choice([LeaveType.casual, LeaveType.sick, LeaveType.special]),
                reason=random.choice(["Family function", "Medical checkup", "Personal work", "Emergency", "Wedding"]),
                duration_type=DurationType.full if days_count >= 1 else random.choice([DurationType.half_morning, DurationType.half_afternoon]),
                days=days_count,
                status=LeaveStatus.approved,
                approved_by=manager.id
            )
            db.add(req)
            approved_count += 1
        
        # Pending leaves (20 requests)
        pending_count = 0
        for i in range(20):
            worker = random.choice(workers)
            
            days_count = random.choice([1.0, 2.0, 3.0, 4.0, 5.0, 0.5])
            start = date(2025, 12, random.randint(10, 30))
            end = start + timedelta(days=int(days_count) - 1) if days_count >= 1 else start
            
            req = LeaveRequest(
                user_id=worker.id,
                start_date=start,
                end_date=end,
                leave_type=random.choice([LeaveType.casual, LeaveType.sick, LeaveType.special]),
                reason=random.choice(["Vacation", "Doctor visit", "Family emergency", "Personal", "Festival"]),
                duration_type=DurationType.full if days_count >= 1 else random.choice([DurationType.half_morning, DurationType.half_afternoon]),
                days=days_count,
                status=LeaveStatus.pending,
                approved_by=None
            )
            db.add(req)
            pending_count += 1
        
        # Rejected leaves (5 requests)
        rejected_count = 0
        for i in range(5):
            worker = random.choice(workers)
            manager = next((m for m in managers if m.id == worker.manager_id), managers[0])
            
            days_count = random.choice([2.0, 3.0])
            start = date(2025, 11, random.randint(1, 20))
            end = start + timedelta(days=int(days_count) - 1)
            
            req = LeaveRequest(
                user_id=worker.id,
                start_date=start,
                end_date=end,
                leave_type=LeaveType.casual,
                reason="Short notice",
                duration_type=DurationType.full,
                days=days_count,
                status=LeaveStatus.rejected,
                approved_by=manager.id
            )
            db.add(req)
            rejected_count += 1
        
        await db.commit()
        print(f"✅ Created {approved_count + pending_count + rejected_count} leave requests ({approved_count} approved, {pending_count} pending, {rejected_count} rejected)")
        
        # 5. Create Account Creation Requests
        print("\n📝 Creating account creation requests...")
        
        # Pending request
        pending_account = AccountCreationRequest(
            name="New Employee",
            email="newemployee@leaveflow.com",
            phone="+1234567099",
            requested_role=UserRole.worker,
            requested_by=managers[0].id,
            status=AccountCreationRequestStatus.pending
        )
        db.add(pending_account)
        
        # Approved request
        approved_account = AccountCreationRequest(
            name="John Smith",
            email="john@leaveflow.com",
            phone="+1234567098",
            requested_role=UserRole.worker,
            requested_by=managers[1].id,
            status=AccountCreationRequestStatus.approved,
            approved_by=admin.id
        )
        db.add(approved_account)
        
        await db.commit()
        print("✅ Created 2 account creation requests")
        
        # 6. Create Audit Logs
        print("\n📊 Creating audit logs...")
        audit_logs = [
            AuditLog(
                actor_id=managers[0].id,
                action="approved",
                details="Approved leave request for family function"
            ),
            AuditLog(
                actor_id=managers[1].id,
                action="rejected",
                details="Rejected leave request due to team shortage"
            ),
            AuditLog(
                actor_id=admin.id,
                action="user_created",
                details=f"Created user account for {workers[0].name}"
            ),
        ]
        
        for log in audit_logs:
            db.add(log)
        
        await db.commit()
        print(f"✅ Created {len(audit_logs)} audit logs")
        
        print("\n" + "="*60)
        print("✨ Demo data seeding completed successfully!")
        print("="*60)
        print("\n📊 Database Statistics:")
        print("-" * 60)
        print(f"👥 Total Users: 51 (1 Admin + 3 HR + 7 Managers + 40 Workers)")
        print(f"📋 Leave Requests: 40 (15 approved, 20 pending, 5 rejected)")
        print(f"🎉 Holidays: 7")
        print(f"💰 Leave Balances: 51 (one per user)")
        print(f"📝 Account Requests: 2")
        print(f"📊 Audit Logs: {len(audit_logs)}")
        print("-" * 60)
        print("\n📧 Sample Login Credentials:")
        print("-" * 60)
        print("👑 Admin:      admin@leaveflow.com      / admin123")
        print("👨‍💼 HR Team:    hr1@leaveflow.com        / hr123")
        print("👔 Manager 1:  manager1@leaveflow.com   / manager123")
        print("👔 Manager 2:  manager2@leaveflow.com   / manager123")
        print("👤 Worker 1:   worker1@leaveflow.com    / worker123")
        print("👤 Worker 2:   worker2@leaveflow.com    / worker123")
        print("-" * 60)
        print("\n💡 Note: All managers and workers use the same passwords")
        print("   Managers: manager123 | Workers: worker123")
        print("\n🎯 You're ready to demo LeaveFlow!")
        print("Start the backend and frontend, then login with any account above.\n")


if __name__ == "__main__":
    asyncio.run(seed_data())
