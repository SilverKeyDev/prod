"""Add partner integration display mode and optional embed URL template."""

import sqlalchemy as sa
from alembic import op

revision = "c2d3e4f5a6b7"
down_revision = "b1c2d3e4f5a6"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "partners",
        sa.Column(
            "integration_display_mode",
            sa.String(length=32),
            nullable=False,
            server_default="iframe_and_link",
        ),
    )
    op.add_column(
        "partners",
        sa.Column("embed_url_template", sa.Text(), nullable=True),
    )


def downgrade():
    op.drop_column("partners", "embed_url_template")
    op.drop_column("partners", "integration_display_mode")
