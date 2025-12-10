"""
Migration script to add account_status fields to existing users table.
Run this ONCE after deploying the updated models.
"""

import asyncio
from sqlalchemy import text
from app.database import engine


async def migrate_account_status():
    """Add account_status, approved_by, and approved_at columns to users table."""
    
    async with engine.begin() as conn:
        try:
            # First, create the enum type if it doesn't exist
            await conn.execute(text("""
                DO $$ BEGIN
                    CREATE TYPE accountstatus AS ENUM ('pending', 'active', 'suspended');
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            """))
            
            # Add account_status column (default to 'active' for existing users)
            await conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS account_status accountstatus DEFAULT 'active' NOT NULL;
            """))
            
            # Add approved_by column
            await conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id);
            """))
            
            # Add approved_at column
            await conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
            """))
            
            # Set all existing users to active status
            await conn.execute(text("""
                UPDATE users 
                SET account_status = 'active' 
                WHERE account_status IS NULL;
            """))
            
            print("✅ Migration completed successfully!")
            print("   - Added account_status column (default: active)")
            print("   - Added approved_by column")
            print("   - Added approved_at column")
            print("   - All existing users set to 'active' status")
            
        except Exception as e:
            print(f"❌ Migration failed: {e}")
            raise


if __name__ == "__main__":
    print("🚀 Starting account_status migration...")
    asyncio.run(migrate_account_status())
