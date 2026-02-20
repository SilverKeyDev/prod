"""Migrate home_budget to budget range fields

Revision ID: h3a4b5c6d7e8
Revises: g2a3b4c5d6e7
Create Date: 2025-10-13 13:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "h3a4b5c6d7e8"
down_revision = "g2a3b4c5d6e7"
branch_labels = None
depends_on = None


def upgrade():
    # Migrate existing home_budget data to the new range fields
    # home_budget_max = home_budget
    # home_budget_min = home_budget * 0.8
    connection = op.get_bind()

    # Update records where home_budget exists but range fields don't
    connection.execute(
        sa.text("""
            UPDATE user_preferences
            SET
                home_budget_max = home_budget,
                home_budget_min = home_budget * 0.8
            WHERE
                home_budget IS NOT NULL
                AND (home_budget_max IS NULL OR home_budget_min IS NULL)
        """)
    )

    # Drop the deprecated home_budget column
    with op.batch_alter_table("user_preferences", schema=None) as batch_op:
        batch_op.drop_column("home_budget")


def downgrade():
    # Add back the home_budget column
    with op.batch_alter_table("user_preferences", schema=None) as batch_op:
        batch_op.add_column(sa.Column("home_budget", sa.Float(), nullable=True))

    # Restore home_budget from home_budget_max
    connection = op.get_bind()
    connection.execute(
        sa.text("""
            UPDATE user_preferences
            SET home_budget = home_budget_max
            WHERE home_budget_max IS NOT NULL
        """)
    )
