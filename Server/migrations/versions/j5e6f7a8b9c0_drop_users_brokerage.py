"""Drop legacy users.brokerage — attribution via user_org_memberships."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "j5e6f7a8b9c0"
down_revision = "i4d5e6f7a8b9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.drop_column("brokerage")


def downgrade() -> None:
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.add_column(sa.Column("brokerage", sa.String(length=200), nullable=True))
