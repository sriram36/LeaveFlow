from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from app.config import get_settings
import ssl

settings = get_settings()

# Validate database URL
if not settings.database_url or settings.database_url == "":
    raise ValueError(
        "DATABASE_URL is not configured! "
        "Please set the DATABASE_URL environment variable. "
        "Example: postgresql://user:pass@host/db"
    )

# Normalize database URL for cloud compatibility
url = settings.database_url.replace("postgres://", "postgresql+asyncpg://")

# Remove query parameters that asyncpg doesn't understand (sslmode, channel_binding)
parsed = urlparse(url)
query_params = parse_qs(parsed.query, keep_blank_values=True)
# Remove SSL-related params - asyncpg handles these via connect_args
query_params.pop("sslmode", None)
query_params.pop("channel_binding", None)

# Rebuild query string
new_query = urlencode({k: v[0] if isinstance(v, list) else v for k, v in query_params.items()})
url = urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, new_query, parsed.fragment))

# asyncpg specific SSL configuration
# Only use SSL for cloud databases (not for localhost)
connect_args = {"timeout": 10, "command_timeout": 10}
is_local = "localhost" in parsed.netloc or "127.0.0.1" in parsed.netloc
if not is_local:
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = True
    connect_args["ssl"] = ssl_context
else:
    # Explicitly disable SSL for local connections
    connect_args["ssl"] = False

print(f"[Database] Connecting to: {parsed.netloc}")
print(f"[Database] SSL enabled: {not is_local}")

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
