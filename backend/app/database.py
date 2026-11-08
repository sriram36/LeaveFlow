from app.logging_config import logger
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from fastapi import HTTPException
from app.config import get_settings
import ssl

settings = get_settings()

def prepare_database_url(raw_url: str):
    """Turn a DATABASE_URL into (asyncpg URL, connect_args).

    - postgres:// and postgresql:// are rewritten to postgresql+asyncpg://
    - sslmode / channel_binding are removed (asyncpg does not understand them)
    - SSL is verified for remote hosts, and off for localhost or when the URL says
      sslmode=disable (e.g. a Postgres container reached as host "db")
    """
    url = raw_url.strip()

    # Handle both postgres:// and postgresql:// formats
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://") and "asyncpg" not in url:
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

    parsed = urlparse(url)

    query_params = parse_qs(parsed.query, keep_blank_values=True)
    sslmode = (query_params.pop("sslmode", [""])[0] or "").lower()
    query_params.pop("channel_binding", None)

    new_query = urlencode({k: v[0] if isinstance(v, list) else v for k, v in query_params.items()})
    url = urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, new_query, parsed.fragment))

    connect_args = {"timeout": 10, "command_timeout": 10}
    is_local = "localhost" in parsed.netloc or "127.0.0.1" in parsed.netloc

    if is_local or sslmode == "disable":
        connect_args["ssl"] = False
    else:
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = True
        connect_args["ssl"] = ssl_context

    return url, connect_args


# Validate database URL - but don't crash in serverless
engine = None
async_session_maker = None

if not settings.database_url or settings.database_url.strip() == "":
    logger.warning("[WARN] DATABASE_URL is not configured!")
    logger.warning("[WARN] Database features will not be available.")
else:
    url, connect_args = prepare_database_url(settings.database_url)
    host = urlparse(url).hostname
    logger.info(f"[Database] {'SSL off' if connect_args['ssl'] is False else 'SSL on'} for host: {host}")
    logger.info("[Database] URL configured successfully")

    engine = create_async_engine(
        url,
        echo=False,
        connect_args=connect_args
    )
    async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    if not async_session_maker:
        raise HTTPException(
            status_code=503,
            detail="Database not configured. Please set DATABASE_URL environment variable."
        )
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    if not engine:
        logger.warning("[WARN] Cannot initialize database - no engine configured")
        return
    async with engine.begin() as conn:
        # Note: In production, do not use create_all().
        # Run 'alembic upgrade head' as part of the deployment process instead.
        # This is kept for development convenience.
        # await conn.run_sync(Base.metadata.create_all)
        pass
