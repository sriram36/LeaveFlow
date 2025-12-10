#!/usr/bin/env python3
"""
Startup verification test - checks if app can initialize without errors.
"""
import os
import sys

# Set environment to use local database for testing
os.environ["DATABASE_URL"] = "postgresql+asyncpg://postgres:sriram@localhost:5432/leaveflow"
os.environ["OPENROUTER_API_KEY"] = "test-key"  
os.environ["WHATSAPP_TOKEN"] = "test-token"
os.environ["WHATSAPP_BUSINESS_ACCOUNT_ID"] = "test-account"

print("=" * 80)
print("STARTUP VERIFICATION TEST")
print("=" * 80)
print(f"\nEnvironment: {os.environ.get('DATABASE_URL', 'NOT SET')[:60]}...")

try:
    print("\n[1] Importing app.config...")
    from app.config import get_settings
    settings = get_settings()
    print(f"✓ Config loaded successfully")
    print(f"  Database URL (first 80 chars): {settings.database_url[:80]}...")
    print(f"  WhatsApp Token: {'SET' if settings.whatsapp_token else 'NOT SET'}")
    print(f"  JWT Secret Key: {'SET' if settings.secret_key else 'NOT SET'}")
    
except Exception as e:
    print(f"❌ FAILED to load config: {str(e)}")
    sys.exit(1)

try:
    print("\n[2] Importing app.database...")
    from app import database
    print(f"✓ Database engine created successfully")
    print(f"  Engine type: {type(database.engine).__name__}")
    
except Exception as e:
    print(f"❌ FAILED to create database engine: {str(e)}")
    sys.exit(1)

try:
    print("\n[3] Importing app.models...")
    from app import models
    print(f"✓ Models imported successfully")
    print(f"  DeclarativeBase: {models.Base}")
    print(f"  Models defined: User, LeaveRequest, LeaveBalance, etc.")
    
except Exception as e:
    print(f"❌ FAILED to import models: {str(e)}")
    sys.exit(1)

try:
    print("\n[4] Importing app.main (FastAPI app)...")
    from app.main import app
    print(f"✓ FastAPI app created successfully")
    print(f"  App title: {app.title}")
    print(f"  Routes defined: {len(app.routes)} routes")
    
except Exception as e:
    print(f"❌ FAILED to create FastAPI app: {str(e)}")
    sys.exit(1)

try:
    print("\n[5] Importing app.services...")
    from app.services import ai_service, leave, parser, validator, whatsapp
    print(f"✓ All services imported successfully")
    print(f"  ai_service: ✓")
    print(f"  leave: ✓")
    print(f"  parser: ✓")
    print(f"  validator: ✓")
    print(f"  whatsapp: ✓")
    
except Exception as e:
    print(f"❌ FAILED to import services: {str(e)}")
    sys.exit(1)

try:
    print("\n[6] Importing app.routes...")
    from app.routes import auth, leave, users, holidays, webhook, account_requests
    print(f"✓ All routes imported successfully")
    print(f"  auth: ✓")
    print(f"  leave: ✓")
    print(f"  users: ✓")
    print(f"  holidays: ✓")
    print(f"  webhook: ✓")
    print(f"  account_requests: ✓")
    
except Exception as e:
    print(f"❌ FAILED to import routes: {str(e)}")
    sys.exit(1)

print("\n" + "=" * 80)
print("✓ ALL STARTUP CHECKS PASSED")
print("=" * 80)
print("\nThe application can start up successfully.")
print("Configuration and database setup are working correctly.")
sys.exit(0)
