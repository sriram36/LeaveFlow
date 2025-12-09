"""
Test manager notification system
"""
import asyncio
from sqlalchemy import select
from app.database import get_db
from app.models import User, UserRole
from app.services.whatsapp import whatsapp
from app.services.whatsapp import format_leave_request_notification


async def test_notifications():
    """Test manager WhatsApp notifications."""
    print("\n" + "="*80)
    print("TESTING MANAGER NOTIFICATION SYSTEM")
    print("="*80 + "\n")
    
    async for db in get_db():
        # Find a worker with a manager
        result = await db.execute(
            select(User)
            .where(User.role == UserRole.worker)
            .where(User.manager_id.isnot(None))
            .limit(1)
        )
        worker = result.scalar_one_or_none()
        
        if not worker:
            print("❌ No worker with manager found!")
            break
        
        print(f"✅ Found worker: {worker.name} (ID: {worker.id})")
        print(f"   Phone: {worker.phone}")
        print(f"   Manager ID: {worker.manager_id}")
        
        # Get the manager
        manager_result = await db.execute(
            select(User).where(User.id == worker.manager_id)
        )
        manager = manager_result.scalar_one_or_none()
        
        if not manager:
            print(f"❌ Manager with ID {worker.manager_id} not found!")
            break
        
        print(f"\n✅ Found manager: {manager.name} (ID: {manager.id})")
        print(f"   Phone: {manager.phone}")
        print(f"   Role: {manager.role}")
        
        # Check WhatsApp credentials
        print("\n" + "-"*80)
        print("WHATSAPP CONFIGURATION CHECK")
        print("-"*80)
        print(f"Token present: {bool(whatsapp.token)}")
        print(f"Phone ID present: {bool(whatsapp.phone_id)}")
        
        if whatsapp.token:
            print(f"Token (first 20 chars): {whatsapp.token[:20]}...")
        if whatsapp.phone_id:
            print(f"Phone ID: {whatsapp.phone_id}")
        
        # Test send notification
        print("\n" + "-"*80)
        print("SENDING TEST NOTIFICATION")
        print("-"*80)
        
        test_message = format_leave_request_notification(
            request_id=9999,
            employee_name=worker.name,
            start_date="2025-12-15",
            end_date="2025-12-16",
            days=2,
            leave_type="Sick",
            reason="Testing manager notification system"
        )
        
        print(f"\nMessage to send:\n{test_message}\n")
        
        success = await whatsapp.send_text(manager.phone, test_message)
        
        if success:
            print("\n✅ TEST PASSED - Manager notification sent successfully!")
        else:
            print("\n❌ TEST FAILED - Manager notification failed!")
            print("\nPossible issues:")
            print("1. WhatsApp credentials missing in .env")
            print("2. Manager phone number format incorrect")
            print("3. WhatsApp API token expired")
        
        break
    
    print("\n" + "="*80 + "\n")


if __name__ == "__main__":
    asyncio.run(test_notifications())
