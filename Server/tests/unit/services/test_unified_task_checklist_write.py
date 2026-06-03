"""Persistence behavior for checklist checked-id rows (last-write-wins replace)."""

from __future__ import annotations

import pytest

from app.services.brokerage.constants import DEFAULT_BROKERAGE_ORG_ID


@pytest.mark.services
def test_replace_checked_ids_for_transaction_sequential_last_write_wins(app) -> None:
    """
    `perform_task_checklist_put` ends with `replace_checked_ids_for_transaction`, which deletes
    all prior rows for the transaction+category then inserts the merged id set.
    """
    buyer = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
    tx_id = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
    with app.app_context():
        from app import db
        from app.models import Transaction, User
        from app.services.transactions.unified_task_checklist_read import (
            get_checked_ids_for_transaction,
            replace_checked_ids_for_transaction,
        )

        db.session.add(
            User(
                id=buyer,
                cognito_id="cog-buyer",
                email="buyer@test.com",
                name="Buyer",
            )
        )
        db.session.add(
            Transaction(
                id=tx_id,
                buyer_id=buyer,
                brokerage_org_id=DEFAULT_BROKERAGE_ORG_ID,
            )
        )
        db.session.commit()

        replace_checked_ids_for_transaction(tx_id, "closing", [1])
        assert get_checked_ids_for_transaction(tx_id, "closing") == [1]

        replace_checked_ids_for_transaction(tx_id, "closing", [1, 2, 3])
        assert get_checked_ids_for_transaction(tx_id, "closing") == [1, 2, 3]
