# 🔄 Transfer Local PostgreSQL Data to Railway

## Step 1: Export Local Database

```bash
# Navigate to backend folder
cd D:\Projects\LeaveFlow\backend

# Export your local database to a SQL file
pg_dump -U postgres -d leaveflow -F p -f leaveflow_backup.sql

# Or if you need to specify host and password:
$env:PGPASSWORD="sriram"; pg_dump -h localhost -U postgres -d leaveflow -F p -f leaveflow_backup.sql
```

## Step 2: Get Railway Database Credentials

```bash
# After running 'npx railway init', get your database URL
npx railway variables

# Look for DATABASE_URL - it will look like:
# postgresql://postgres:password@hostname.railway.app:5432/railway
```

## Step 3: Import Data to Railway

### Option A: Using psql (Direct Import)

```bash
# Set the Railway DATABASE_URL
$RAILWAY_DB_URL = "postgresql://postgres:PASSWORD@HOST.railway.app:5432/railway"

# Import the backup
psql $RAILWAY_DB_URL -f leaveflow_backup.sql
```

### Option B: Using Railway CLI

```bash
# Connect to Railway database directly
npx railway connect postgres

# Once connected, you can run:
\i leaveflow_backup.sql
```

### Option C: Using Python Script (Recommended)

```bash
# Run this command - it will migrate your data
python migrate_to_railway.py
```

## Step 4: Railway Auto-Connects Backend to Database

**Railway automatically sets DATABASE_URL** when you add PostgreSQL:

1. In Railway Dashboard:
   - Click "New" → "Database" → "PostgreSQL"
   - Railway creates the database
   - **DATABASE_URL is automatically added to your backend service**

2. No manual connection needed! Railway links them automatically.

3. Verify connection:
```bash
npx railway run python -c "from app.database import engine; print('✓ Connected to Railway DB')"
```

## Step 5: Verify Data Transfer

```bash
# Check if data was imported
npx railway connect postgres

# Then run:
\dt                           # List all tables
SELECT COUNT(*) FROM users;   # Count users
SELECT COUNT(*) FROM leave_requests;  # Count leave requests
\q                            # Quit
```

---

## 🔧 Quick Migration Script

Save this as `migrate_to_railway.py`:

```python
import os
import asyncio
from sqlalchemy import create_engine, text

# Local database
LOCAL_DB = "postgresql://postgres:sriram@localhost:5432/leaveflow"

# Get Railway DB URL from environment or Railway CLI
RAILWAY_DB = os.getenv("DATABASE_URL") or input("Enter Railway DATABASE_URL: ")

async def migrate():
    # Connect to local DB
    local_engine = create_engine(LOCAL_DB)
    
    # Connect to Railway DB
    railway_engine = create_engine(RAILWAY_DB.replace("postgresql://", "postgresql+psycopg2://"))
    
    # Get all table names
    with local_engine.connect() as conn:
        result = conn.execute(text("""
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public'
        """))
        tables = [row[0] for row in result]
    
    print(f"Found {len(tables)} tables to migrate...")
    
    # Migrate each table
    for table in tables:
        print(f"Migrating {table}...")
        
        # Read from local
        with local_engine.connect() as conn:
            data = conn.execute(text(f"SELECT * FROM {table}"))
            rows = data.fetchall()
            columns = data.keys()
        
        # Write to Railway
        if rows:
            with railway_engine.connect() as conn:
                # Clear existing data
                conn.execute(text(f"TRUNCATE TABLE {table} CASCADE"))
                
                # Insert new data
                placeholders = ", ".join([f":{col}" for col in columns])
                insert_query = f"INSERT INTO {table} ({', '.join(columns)}) VALUES ({placeholders})"
                
                for row in rows:
                    row_dict = dict(zip(columns, row))
                    conn.execute(text(insert_query), row_dict)
                
                conn.commit()
        
        print(f"✓ Migrated {len(rows)} rows from {table}")
    
    print("\n✅ Migration complete!")

if __name__ == "__main__":
    asyncio.run(migrate())
```

Run it:
```bash
cd D:\Projects\LeaveFlow\backend
npx railway run python migrate_to_railway.py
```

---

## 🔗 How Railway Connects Backend to Database

**Automatic Connection:**
1. Railway detects PostgreSQL service in your project
2. Automatically injects `DATABASE_URL` environment variable
3. Your backend reads it from `app/config.py`:
   ```python
   database_url: str = "postgresql+asyncpg://..."  # Falls back if not set
   ```
4. SQLAlchemy uses `DATABASE_URL` to connect

**Manual Verification:**
```bash
# Check if DATABASE_URL is set
npx railway variables

# Should show:
# DATABASE_URL=postgresql://postgres:xxx@xxx.railway.app:5432/railway
```

**Test Connection:**
```bash
npx railway run python -c "from app.database import init_db; import asyncio; asyncio.run(init_db()); print('✓ DB Connected')"
```

---

## ⚡ Quick Transfer (One Command)

```bash
# 1. Export local data
pg_dump -U postgres -d leaveflow > backup.sql

# 2. Get Railway DB URL
npx railway variables | Select-String "DATABASE_URL"

# 3. Import to Railway
psql "postgresql://user:pass@host.railway.app:5432/railway" -f backup.sql
```

Done! Your data is now on Railway. 🚀
