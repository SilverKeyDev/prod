"""Add brokerage onboarding fields to brokerage orgs.

Revision ID: p1b2c3d4e5f6
Revises: 762ca378e56d
Create Date: 2026-07-12
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision = "p1b2c3d4e5f6"
down_revision = "762ca378e56d"
branch_labels = None
depends_on = None

_TABLE = "brokerage_orgs"

_COLUMNS = (
    ("legal_business_name", sa.String(length=255)),
    ("primary_admin_name", sa.String(length=255)),
    ("primary_admin_email", sa.String(length=255)),
    ("primary_admin_phone", sa.String(length=64)),
    ("primary_admin_title", sa.String(length=128)),
    ("license_number", sa.String(length=128)),
)


def upgrade():
    bind = op.get_bind()
    insp = inspect(bind)

    if not insp.has_table(_TABLE):
        return

    existing_columns = {column["name"] for column in insp.get_columns(_TABLE)}

    for name, column_type in _COLUMNS:
        if name not in existing_columns:
            op.add_column(_TABLE, sa.Column(name, column_type, nullable=True))


def downgrade():
    bind = op.get_bind()
    insp = inspect(bind)

    if not insp.has_table(_TABLE):
        return

    existing_columns = {column["name"] for column in insp.get_columns(_TABLE)}

    for name, _column_type in reversed(_COLUMNS):
        if name in existing_columns:
            op.drop_column(_TABLE, name)
