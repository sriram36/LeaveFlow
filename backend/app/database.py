from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from app.config import get_settings
import ssl

settings = get_settings()

# Validate database URL
if not settings.database_url or settings.database_url.strip() == "":
    raise ValueError(
        "DATABASE_URL is not configured! "
        "Please set the DATABASE_URL environment variable in your .env file or Vercel settings. "
        "Example: postgresql+asyncpg://user:pass@host/db"
    )

# Normalize database URL for cloud compatibility
url = settings.database_url.strip()

# Handle both postgres:// and postgresql:// formats
if url.startswith("postgres://"):
    url = url.replace("postgres://", "postgresql+asyncpg://", 1)
elif url.startswith("postgresql://") and "asyncpg" not in url:
    url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

# Parse to get host info for SSL decision
parsed = urlparse(url)

# Remove query parameters that asyncpg doesn't understand (sslmode, channel_binding)
query_params = parse_qs(parsed.query, keep_blank_values=True)
query_params.pop("sslmode", None)
query_params.pop("channel_binding", None)

# Rebuild query string
new_query = urlencode({k: v[0] if isinstance(v, list) else v for k, v in query_params.items()})
url = urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, new_query, parsed.fragment))

# asyncpg specific SSL configuration
connect_args = {"timeout": 10, "command_timeout": 10}
is_local = "localhost" in parsed.netloc or "127.0.0.1" in parsed.netloc

if not is_local:
    # Cloud database - use SSL
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = True
    connect_args["ssl"] = ssl_context
    print(f"[Database] Cloud database detected: {parsed.hostname}")
else:
    # Local database - no SSL
    connect_args["ssl"] = False
    print(f"[Database] Local database detected: {parsed.hostname}")

print(f"[Database] URL configured successfully")

engine = create_async_engine(
    url,
    echo=False,
    connect_args=connect_args
)
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
