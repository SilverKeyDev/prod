"""Option B: multi-deal transactions, active pointer, dispatch transaction_id.

Revision ID: k6f7a8b9c0d1
Revises: j5e6f7a8b9c0
Create Date: 2026-06-04

Operator note: drops one-deal-per-buyer unique constraint; existing buyers keep rows.
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "k6f7a8b9c0d1"
down_revision = "j5e6f7a8b9c0"
branch_labels = None
depends_on = None

_UQ_TRANSACTIONS_BUYER_ID = "uq_transactions_buyer_id"
_IX_TRANSACTIONS_BUYER_UPDATED = "ix_transactions_buyer_id_updated_at"
_FK_USERS_ACTIVE_TRANSACTION_ID = "fk_users_active_transaction_id_transactions"
_IX_DISPATCH_TRANSACTION_ID = op.f("ix_checklist_item_dispatch_settings_transaction_id")
_FK_DISPATCH_TRANSACTION_ID = "fk_checklist_dispatch_settings_transaction_id"


def upgrade() -> None:
    with op.batch_alter_table("transactions", schema=None) as batch_op:
        batch_op.add_column(sa.Column("status", sa.String(length=32), nullable=True))
        batch_op.add_column(sa.Column("display_label", sa.String(length=500), nullable=True))
        batch_op.drop_constraint(_UQ_TRANSACTIONS_BUYER_ID, type_="unique")

    op.create_index(
        _IX_TRANSACTIONS_BUYER_UPDATED,
        "transactions",
        ["buyer_id", "updated_at"],
        unique=False,
    )

    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.add_column(sa.Column("active_transaction_id", sa.String(length=36), nullable=True))
        batch_op.create_foreign_key(
            _FK_USERS_ACTIVE_TRANSACTION_ID,
            "transactions",
            ["active_transaction_id"],
            ["id"],
            ondelete="SET NULL",
        )
        batch_op.create_index(
            op.f("ix_users_active_transaction_id"),
            ["active_transaction_id"],
            unique=False,
        )

    with op.batch_alter_table("checklist_item_dispatch_settings", schema=None) as batch_op:
        batch_op.add_column(sa.Column("transaction_id", sa.String(length=36), nullable=True))
        batch_op.create_foreign_key(
            _FK_DISPATCH_TRANSACTION_ID,
            "transactions",
            ["transaction_id"],
            ["id"],
            ondelete="CASCADE",
        )
        batch_op.create_index(_IX_DISPATCH_TRANSACTION_ID, ["transaction_id"], unique=False)

    bind = op.get_bind()
    bind.execute(
        sa.text(
            """
            UPDATE checklist_item_dispatch_settings AS s
            SET transaction_id = t.id
            FROM transactions AS t
            WHERE t.buyer_id = s.client_user_id
              AND s.transaction_id IS NULL
            """
        )
    )


def downgrade() -> None:
    bind = op.get_bind()
    bind.execute(sa.text("UPDATE users SET active_transaction_id = NULL"))

    with op.batch_alter_table("checklist_item_dispatch_settings", schema=None) as batch_op:
        batch_op.drop_index(_IX_DISPATCH_TRANSACTION_ID)
        batch_op.drop_constraint(_FK_DISPATCH_TRANSACTION_ID, type_="foreignkey")
        batch_op.drop_column("transaction_id")

    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.drop_index(op.f("ix_users_active_transaction_id"))
        batch_op.drop_constraint(_FK_USERS_ACTIVE_TRANSACTION_ID, type_="foreignkey")
        batch_op.drop_column("active_transaction_id")

    op.drop_index(_IX_TRANSACTIONS_BUYER_UPDATED, table_name="transactions")

    with op.batch_alter_table("transactions", schema=None) as batch_op:
        batch_op.drop_column("display_label")
        batch_op.drop_column("status")
        batch_op.create_unique_constraint(_UQ_TRANSACTIONS_BUYER_ID, ["buyer_id"])
