import ssl

from app.database import prepare_database_url


def test_sslmode_disable_turns_ssl_off_for_non_local_host():
    """Docker/compose hosts like 'db' are not 'localhost' but have no SSL."""
    url, connect_args = prepare_database_url("postgresql://u:p@db:5432/leaveflow?sslmode=disable")

    assert url == "postgresql+asyncpg://u:p@db:5432/leaveflow"
    assert connect_args["ssl"] is False


def test_cloud_host_uses_verified_ssl_by_default():
    url, connect_args = prepare_database_url("postgres://u:p@ep-abc.neon.tech/neondb?sslmode=require&channel_binding=require")

    assert url == "postgresql+asyncpg://u:p@ep-abc.neon.tech/neondb"
    assert isinstance(connect_args["ssl"], ssl.SSLContext)
    assert connect_args["ssl"].check_hostname is True


def test_localhost_has_no_ssl():
    _, connect_args = prepare_database_url("postgresql+asyncpg://u:p@localhost:5432/x")

    assert connect_args["ssl"] is False
