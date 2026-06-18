"""Add brokerage_integration_credentials for SkySlope (SIL-270).

Revision ID: n0a1b2c3d4e5
Revises: m8f9a0b1c2d3
Create Date: 2026-06-18
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision = "n0a1b2c3d4e5"
down_revision = "m8f9a0b1c2d3"
branch_labels = None
depends_on = None

_TABLE = "brokerage_integration_credentials"
_UQ_BROKERAGE_PROVIDER = "uq_brokerage_integration_credentials_brokerage_provider"
_IX_BROKERAGE_ID = "ix_brokerage_integration_credentials_brokerage_id"
_FK_BROKERAGE_ORG = "brokerage_integration_credentials_brokerage_id_fkey"


def upgrade():
    bind = op.get_bind()
    insp = inspect(bind)

    if insp.has_table(_TABLE):
        return

    op.create_table(
        _TABLE,
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("brokerage_id", sa.String(length=36), nullable=False),
        sa.Column("provider", sa.String(length=64), nullable=False),
        sa.Column("encrypted_payload", sa.Text(), nullable=False),
        sa.Column("key_last4", sa.String(length=4), nullable=True),
        sa.Column("skyslope_org_id", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("last_verified_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["brokerage_id"], ["brokerage_orgs.id"], name=_FK_BROKERAGE_ORG),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("brokerage_id", "provider", name=_UQ_BROKERAGE_PROVIDER),
    )
    op.create_index(_IX_BROKERAGE_ID, _TABLE, ["brokerage_id"], unique=False)


def downgrade():
    bind = op.get_bind()
    insp = inspect(bind)

    if not insp.has_table(_TABLE):
        return

    op.drop_index(_IX_BROKERAGE_ID, table_name=_TABLE)
    op.drop_table(_TABLE)
