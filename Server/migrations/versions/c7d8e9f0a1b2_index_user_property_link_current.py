"""Add composite index for common cached search query: user + current + ranking.

Revision ID: c7d8e9f0a1b2
Revises: 89e5e769b083
Create Date: 2026-04-22

"""

from alembic import op
from sqlalchemy import inspect

revision = "c7d8e9f0a1b2"
down_revision = "89e5e769b083"
branch_labels = None
depends_on = None

_INDEX = "ix_user_property_link_user_id_current_ranking"


def upgrade():
    bind = op.get_bind()
    insp = inspect(bind)
    existing = {ix["name"] for ix in insp.get_indexes("user_property_link")}
    if _INDEX in existing:
        return
    op.create_index(
        _INDEX,
        "user_property_link",
        ["user_id", "current", "ranking"],
        unique=False,
    )


def downgrade():
    op.drop_index(_INDEX, table_name="user_property_link")
