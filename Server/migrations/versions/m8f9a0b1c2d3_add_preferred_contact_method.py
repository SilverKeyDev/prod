"""Add preferred_contact_method to user_communication_prefs.

Revision ID: m8f9a0b1c2d3
Revises: l7e8f9a0b1c2
Create Date: 2026-06-07
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision = "m8f9a0b1c2d3"
down_revision = "l7e8f9a0b1c2"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    insp = inspect(bind)
    if not insp.has_table("user_communication_prefs"):
        return
    cols = {c["name"] for c in insp.get_columns("user_communication_prefs")}
    if "preferred_contact_method" in cols:
        return
    op.add_column(
        "user_communication_prefs",
        sa.Column("preferred_contact_method", sa.String(length=20), nullable=True),
    )


def downgrade():
    bind = op.get_bind()
    insp = inspect(bind)
    if not insp.has_table("user_communication_prefs"):
        return
    cols = {c["name"] for c in insp.get_columns("user_communication_prefs")}
    if "preferred_contact_method" not in cols:
        return
    op.drop_column("user_communication_prefs", "preferred_contact_method")
