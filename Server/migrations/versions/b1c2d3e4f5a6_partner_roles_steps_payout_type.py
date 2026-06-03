"""Extend partners table for multi-step, role targeting, and payout type."""

import sqlalchemy as sa
from alembic import op

revision = "b1c2d3e4f5a6"
down_revision = "a9b0c1d2e3f4"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "partners",
        sa.Column("step_ids", sa.JSON(), nullable=False, server_default="[]"),
    )
    op.add_column(
        "partners",
        sa.Column("target_roles", sa.JSON(), nullable=False, server_default='["buyer"]'),
    )
    op.add_column(
        "partners",
        sa.Column(
            "payout_type",
            sa.String(length=32),
            nullable=False,
            server_default="on_click",
        ),
    )
    # JSON equality is not defined in PostgreSQL; compare via text cast.
    op.execute(
        "UPDATE partners SET step_ids = json_build_array(step_id) "
        "WHERE step_ids IS NULL OR step_ids::text = '[]'"
    )
    op.drop_column("partners", "assumed_conversion_rate")


def downgrade():
    op.add_column(
        "partners",
        sa.Column("assumed_conversion_rate", sa.Numeric(8, 6), nullable=False, server_default="0"),
    )
    op.drop_column("partners", "payout_type")
    op.drop_column("partners", "target_roles")
    op.drop_column("partners", "step_ids")
