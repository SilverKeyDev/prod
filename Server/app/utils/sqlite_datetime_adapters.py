"""Register sqlite3 datetime/date adapters (Python 3.12+ deprecates built-in defaults)."""

from __future__ import annotations

import sqlite3
from datetime import date, datetime

_registered = False


def register_sqlite_datetime_adapters() -> None:
    """Use explicit ISO adapters so sqlite3 does not invoke deprecated default adapters."""
    global _registered
    if _registered:
        return

    def adapt_datetime(val: datetime) -> str:
        return val.isoformat()

    def adapt_date(val: date) -> str:
        return val.isoformat()

    sqlite3.register_adapter(datetime, adapt_datetime)
    sqlite3.register_adapter(date, adapt_date)
    _registered = True
