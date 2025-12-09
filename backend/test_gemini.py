"""Test Gemini natural language processing"""
import asyncio
from app.services.gemini import gemini_service

async def test_gemini():
    print("🧪 Testing Gemini Natural Language Processing\n")
    
    test_messages = [
        "I need leave on 15th December for sick",
        "Apply 3 days casual leave from tomorrow",
        "I want half day leave tomorrow morning for personal work",
        "Can I take leave from 20th to 22nd December?",
        "balance",
        "I'm not feeling well, need 2 days sick leave starting today"
    ]
    
    for i, message in enumerate(test_messages, 1):
        print(f"\n{i}. User message: '{message}'")
        print("-" * 60)
        
        result = await gemini_service.parse_leave_request(message, "Test User")
        
        if "error" in result:
            print(f"   ⚠️  Error: {result['error']}")
        else:
            print(f"   ✅ Parsed successfully:")
            print(f"      Start: {result.get('start_date')}")
            print(f"      End: {result.get('end_date')}")
            print(f"      Type: {result.get('leave_type')}")
            print(f"      Duration: {result.get('duration_type')}")
            print(f"      Reason: {result.get('reason')}")
    
    print("\n" + "="*60)
    print("\n🎯 Testing friendly response generation\n")
    
    test_response = await gemini_service.generate_friendly_response(
        "leave_submitted",
        {"id": 123, "start_date": "2025-12-15", "end_date": "2025-12-16"}
    )
    print(f"Response: {test_response}")

if __name__ == "__main__":
    asyncio.run(test_gemini())
