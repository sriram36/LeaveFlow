#!/usr/bin/env python3
"""
Migrate local PostgreSQL data to Railway PostgreSQL
"""
import os
import sys
import asyncio
from sqlalchemy import create_engine, text, MetaData, Table
from sqlalchemy.engine import reflection

# Local database URL
LOCAL_DB = "postgresql://postgres:sriram@localhost:5432/leaveflow"

# Railway database URL (will be injected by Railway)
RAILWAY_DB = os.getenv("DATABASE_URL", "")

if not RAILWAY_DB:
    print("❌ DATABASE_URL not found. Make sure you're running this on Railway.")
    print("   Or set DATABASE_URL manually: export DATABASE_URL='postgresql://...'")
    sys.exit(1)

# Convert asyncpg to psycopg2 for SQLAlchemy sync operations
if RAILWAY_DB.startswith("postgresql+asyncpg://"):
    RAILWAY_DB = RAILWAY_DB.replace("postgresql+asyncpg://", "postgresql://")


def migrate_data():
    """Migrate all data from local to Railway database."""
    try:
        print("🔄 Starting database migration...\n")
        
        # Connect to local database
        print(f"📡 Connecting to local database...")
        local_engine = create_engine(LOCAL_DB)
        
        # Connect to Railway database
        print(f"📡 Connecting to Railway database...")
        railway_engine = create_engine(RAILWAY_DB)
        
        # Get all tables using reflection
        inspector = reflection.Inspector.from_engine(local_engine)
        tables = inspector.get_table_names()
        
        print(f"✓ Found {len(tables)} tables to migrate\n")
        
        total_rows = 0
        
        for table_name in tables:
            print(f"📦 Migrating table: {table_name}")
            
            # Get all data from local table
            with local_engine.connect() as local_conn:
                result = local_conn.execute(text(f'SELECT * FROM "{table_name}"'))
                rows = result.fetchall()
                columns = result.keys()
            
            if not rows:
                print(f"   ⚠️  Table is empty, skipping")
                continue
            
            # Insert into Railway database
            with railway_engine.connect() as railway_conn:
                # Disable foreign key checks temporarily
                railway_conn.execute(text("SET CONSTRAINTS ALL DEFERRED"))
                
                # Clear existing data
                railway_conn.execute(text(f'TRUNCATE TABLE "{table_name}" CASCADE'))
                
                # Prepare insert statement
                column_names = ", ".join([f'"{col}"' for col in columns])
                placeholders = ", ".join([f":{col}" for col in columns])
                insert_sql = f'INSERT INTO "{table_name}" ({column_names}) VALUES ({placeholders})'
                
                # Insert all rows
                for row in rows:
                    row_dict = dict(zip(columns, row))
                    railway_conn.execute(text(insert_sql), row_dict)
                
                railway_conn.commit()
            
            print(f"   ✓ Migrated {len(rows)} rows")
            total_rows += len(rows)
        
        print(f"\n✅ Migration complete! Total rows migrated: {total_rows}")
        
        # Update sequences for auto-increment columns
        print("\n🔧 Updating sequences...")
        with railway_engine.connect() as conn:
            for table_name in tables:
                try:
                    # Update sequence for id column if it exists
                    conn.execute(text(f"""
                        SELECT setval(
                            pg_get_serial_sequence('"{table_name}"', 'id'),
                            COALESCE((SELECT MAX(id) FROM "{table_name}"), 1)
                        )
                    """))
                    conn.commit()
                    print(f"   ✓ Updated sequence for {table_name}")
                except Exception as e:
                    # Skip if no id column or sequence
                    pass
        
        print("\n🎉 Database migration successful!")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {str(e)}")
        sys.exit(1)
    finally:
        local_engine.dispose()
        railway_engine.dispose()


if __name__ == "__main__":
    migrate_data()
