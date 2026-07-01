"""[SIL-272] Add skyslope transaction history tables.

Revision ID: 762ca378e56d
Revises: n0a1b2c3d4e5
Create Date: 2026-06-23
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

revision = "762ca378e56d"
down_revision = "n0a1b2c3d4e5"
branch_labels = None
depends_on = None

_TX_TABLE = "skyslope_transactions"
_SYNC_TABLE = "skyslope_sync_states"
_UQ_TX_BROKERAGE_EXTERNAL = "uq_skyslope_tx_brokerage_external_id"
_IX_TX_BROKERAGE_ID = "ix_skyslope_transactions_brokerage_id"
_IX_TX_AGENT_ID = "ix_skyslope_transactions_agent_id"
_IX_TX_BROKERAGE_CLOSED_AT = "ix_skyslope_tx_brokerage_closed_at"
_IX_TX_BROKERAGE_STATUS = "ix_skyslope_tx_brokerage_status"
_FK_TX_BROKERAGE = "skyslope_transactions_brokerage_id_fkey"
_FK_TX_AGENT = "skyslope_transactions_agent_id_fkey"
_FK_SYNC_BROKERAGE = "skyslope_sync_states_brokerage_id_fkey"


def upgrade():
    bind = op.get_bind()
    insp = inspect(bind)

    if not insp.has_table(_TX_TABLE):
        op.create_table(
            _TX_TABLE,
            sa.Column("id", sa.String(length=36), nullable=False),
            sa.Column("brokerage_id", sa.String(length=36), nullable=False),
            sa.Column("skyslope_transaction_id", sa.String(length=128), nullable=False),
            sa.Column("agent_id", sa.String(length=36), nullable=True),
            sa.Column("status", sa.String(length=64), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("closed_at", sa.DateTime(), nullable=True),
            sa.Column("cancelled_at", sa.DateTime(), nullable=True),
            sa.Column("is_cancelled", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("sale_price", sa.Numeric(14, 2), nullable=True),
            sa.Column("list_price", sa.Numeric(14, 2), nullable=True),
            sa.Column("address", sa.String(length=500), nullable=True),
            sa.Column("city", sa.String(length=128), nullable=True),
            sa.Column("state", sa.String(length=32), nullable=True),
            sa.Column("zip", sa.String(length=20), nullable=True),
            sa.Column("latitude", sa.Float(), nullable=True),
            sa.Column("longitude", sa.Float(), nullable=True),
            sa.Column("side", sa.String(length=32), nullable=True),
            sa.Column("property_type", sa.String(length=64), nullable=True),
            sa.Column("title_vendor", sa.String(length=255), nullable=True),
            sa.Column("lender", sa.String(length=255), nullable=True),
            sa.Column("escrow_company", sa.String(length=255), nullable=True),
            sa.Column("has_home_warranty", sa.Boolean(), nullable=True),
            sa.Column("raw_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column("synced_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["brokerage_id"], ["brokerage_orgs.id"], name=_FK_TX_BROKERAGE),
            sa.ForeignKeyConstraint(["agent_id"], ["users.id"], name=_FK_TX_AGENT),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint(
                "brokerage_id",
                "skyslope_transaction_id",
                name=_UQ_TX_BROKERAGE_EXTERNAL,
            ),
        )
        op.create_index(_IX_TX_BROKERAGE_ID, _TX_TABLE, ["brokerage_id"], unique=False)
        op.create_index(_IX_TX_AGENT_ID, _TX_TABLE, ["agent_id"], unique=False)
        op.create_index(
            _IX_TX_BROKERAGE_CLOSED_AT, _TX_TABLE, ["brokerage_id", "closed_at"], unique=False
        )
        op.create_index(
            _IX_TX_BROKERAGE_STATUS, _TX_TABLE, ["brokerage_id", "status"], unique=False
        )

    if not insp.has_table(_SYNC_TABLE):
        op.create_table(
            _SYNC_TABLE,
            sa.Column("brokerage_id", sa.String(length=36), nullable=False),
            sa.Column("status", sa.String(length=32), nullable=False, server_default="idle"),
            sa.Column("last_synced_at", sa.DateTime(), nullable=True),
            sa.Column("last_full_sync_at", sa.DateTime(), nullable=True),
            sa.Column("sync_cursor", sa.String(length=255), nullable=True),
            sa.Column("last_error", sa.Text(), nullable=True),
            sa.Column(
                "records_imported_last_run",
                sa.Integer(),
                nullable=False,
                server_default="0",
            ),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(
                ["brokerage_id"], ["brokerage_orgs.id"], name=_FK_SYNC_BROKERAGE
            ),
            sa.PrimaryKeyConstraint("brokerage_id"),
        )


def downgrade():
    bind = op.get_bind()
    insp = inspect(bind)

    if insp.has_table(_SYNC_TABLE):
        op.drop_table(_SYNC_TABLE)

    if insp.has_table(_TX_TABLE):
        op.drop_index(_IX_TX_BROKERAGE_STATUS, table_name=_TX_TABLE)
        op.drop_index(_IX_TX_BROKERAGE_CLOSED_AT, table_name=_TX_TABLE)
        op.drop_index(_IX_TX_AGENT_ID, table_name=_TX_TABLE)
        op.drop_index(_IX_TX_BROKERAGE_ID, table_name=_TX_TABLE)
        op.drop_table(_TX_TABLE)
