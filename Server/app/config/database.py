import json
import os
from datetime import date, time
from typing import Any

database_url = os.getenv("DATABASE_URL")
if not database_url:
    raise RuntimeError("DATABASE_URL environment variable must be set")

SQLALCHEMY_DATABASE_URI = database_url
SQLALCHEMY_TRACK_MODIFICATIONS = False


def _sqlalchemy_json_serializer(value: Any) -> str:
    """Serialize Python values for JSON/JSONB columns (SQLAlchemy engine hook)."""

    def _default(obj: object) -> str:
        if isinstance(obj, date | time):
            return obj.isoformat()
        raise TypeError(f"Object of type {type(obj)!r} is not JSON serializable")

    return json.dumps(value, default=_default)


_JSON_ENGINE_OPTS = {"json_serializer": _sqlalchemy_json_serializer}

# Configure engine options based on database type
# For testing with SQLite in-memory, use minimal config (no pool settings)
is_testing = os.getenv("TESTING") == "true"

if database_url.startswith("sqlite://"):
    if is_testing or ":memory:" in database_url:
        # SQLite in-memory (testing) - no pool settings (uses StaticPool)
        SQLALCHEMY_ENGINE_OPTIONS = {
            "pool_pre_ping": True,
            "pool_recycle": 300,
            **_JSON_ENGINE_OPTS,
        }
    else:
        # SQLite file-based - pool settings
        SQLALCHEMY_ENGINE_OPTIONS = {
            "pool_pre_ping": True,
            "pool_recycle": 300,
            "pool_timeout": 300,
            "pool_size": 10,
            "max_overflow": 20,
            **_JSON_ENGINE_OPTS,
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
        **_JSON_ENGINE_OPTS,
    }

__all__ = [
    "database_url",
    "SQLALCHEMY_DATABASE_URI",
    "SQLALCHEMY_TRACK_MODIFICATIONS",
    "SQLALCHEMY_ENGINE_OPTIONS",
]
