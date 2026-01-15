import os

database_url = os.getenv("DATABASE_URL")
if not database_url:
    raise RuntimeError("DATABASE_URL environment variable must be set")

SQLALCHEMY_DATABASE_URI = database_url
SQLALCHEMY_TRACK_MODIFICATIONS = False

# Configure engine options based on database type
if database_url.startswith("sqlite://"):
    # SQLite-specific configuration
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
        "pool_timeout": 300,
        "pool_size": 10,
        "max_overflow": 20,
    }
else:
    # PostgreSQL/other database configuration with connection args
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
        "pool_timeout": 300,
        "pool_size": 10,
        "max_overflow": 20,
        "connect_args": {
            "connect_timeout": 300,
            "keepalives_idle": 600,
            "keepalives_interval": 30,
            "keepalives_count": 3,
        },
    }

__all__ = [
    "database_url",
    "SQLALCHEMY_DATABASE_URI",
    "SQLALCHEMY_TRACK_MODIFICATIONS",
    "SQLALCHEMY_ENGINE_OPTIONS",
]

