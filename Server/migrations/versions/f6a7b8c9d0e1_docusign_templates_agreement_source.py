"""Add agreement template source and docusign_templates metadata columns.

Revision ID: f6a7b8c9d0e1
Revises: c8a91d2e4f70
Create Date: 2026-04-20

"""

import sqlalchemy as sa
from alembic import op

revision = "f6a7b8c9d0e1"
down_revision = "c8a91d2e4f70"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("agreements", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("docusign_source_template_id", sa.String(length=100), nullable=True)
        )

    with op.batch_alter_table("docusign_templates", schema=None) as batch_op:
        batch_op.add_column(sa.Column("created_by_user_id", sa.String(length=36), nullable=True))
        batch_op.add_column(sa.Column("role_names_json", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("last_edit_synced_at", sa.DateTime(), nullable=True))
        batch_op.create_foreign_key(
            batch_op.f("docusign_templates_created_by_user_id_fkey"),
            "users",
            ["created_by_user_id"],
            ["id"],
        )


def downgrade():
    with op.batch_alter_table("docusign_templates", schema=None) as batch_op:
        batch_op.drop_constraint(
            batch_op.f("docusign_templates_created_by_user_id_fkey"),
            type_="foreignkey",
        )
        batch_op.drop_column("last_edit_synced_at")
        batch_op.drop_column("role_names_json")
        batch_op.drop_column("created_by_user_id")

    with op.batch_alter_table("agreements", schema=None) as batch_op:
        batch_op.drop_column("docusign_source_template_id")
