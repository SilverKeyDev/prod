"""Persistence behavior for checklist checked-id rows (last-write-wins replace)."""

from __future__ import annotations

import pytest


@pytest.mark.services
def test_replace_checked_ids_for_user_sequential_last_write_wins(app) -> None:
    """
    `perform_task_checklist_put` ends with `replace_checked_ids_for_user`, which deletes
    all prior rows for the subject+category then inserts the merged id set. Sequential
    replaces must leave DB matching the last call (no merge logic here — see unit tests).
    """
    buyer = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
    with app.app_context():
        from app.services.transactions.unified_task_checklist_read import (
            get_checked_ids_for_user,
            replace_checked_ids_for_user,
        )

        replace_checked_ids_for_user(buyer, "closing", [1])
        assert get_checked_ids_for_user(buyer, "closing") == [1]

        replace_checked_ids_for_user(buyer, "closing", [1, 2, 3])
        assert get_checked_ids_for_user(buyer, "closing") == [1, 2, 3]
