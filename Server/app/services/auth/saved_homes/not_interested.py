"""Not-interested homes write paths."""

from __future__ import annotations

from datetime import datetime, timezone

from app.models.property.home_not_interested import HomeNotInterested
from app.utils.db import db_transaction


def clear_not_interested_flag(home: HomeNotInterested) -> None:
    """Persist undo of not-interested status."""
    with db_transaction():
        home.is_not_interested = False


def update_not_interested_reason(home: HomeNotInterested, why: str) -> None:
    """Update why text and append or patch not_interested_history."""
    with db_transaction():
        home.why = why
        if home.not_interested_history is None:
            home.not_interested_history = []
        updated = False
        for entry in reversed(home.not_interested_history):
            if entry.get("action") == "not_interested":
                entry["why"] = why
                updated = True
                break
        if not updated:
            home.not_interested_history.append(
                {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "action": "not_interested",
                    "why": why,
                }
            )
