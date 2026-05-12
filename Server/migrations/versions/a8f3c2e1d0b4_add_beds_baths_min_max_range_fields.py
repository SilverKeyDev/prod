"""Add beds/baths min/max range fields to user_search_intent

Revision ID: a8f3c2e1d0b4
Revises: 49f1e1fd6f5d
Create Date: 2026-04-07

"""

import sqlalchemy as sa
from alembic import op

revision = "a8f3c2e1d0b4"
down_revision = "49f1e1fd6f5d"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("user_search_intent", schema=None) as batch_op:
        batch_op.add_column(sa.Column("preferred_bedrooms_min", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("preferred_bedrooms_max", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("preferred_bathrooms_min", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("preferred_bathrooms_max", sa.Integer(), nullable=True))

    op.execute(
        """
        UPDATE user_search_intent
        SET preferred_bedrooms_min = preferred_bedrooms
        WHERE preferred_bedrooms IS NOT NULL
    """
    )
    op.execute(
        """
        UPDATE user_search_intent
        SET preferred_bathrooms_min = preferred_bathrooms
        WHERE preferred_bathrooms IS NOT NULL
    """
    )

    with op.batch_alter_table("user_search_intent", schema=None) as batch_op:
        batch_op.drop_column("preferred_bedrooms")
        batch_op.drop_column("preferred_bathrooms")


def downgrade():
    with op.batch_alter_table("user_search_intent", schema=None) as batch_op:
        batch_op.add_column(sa.Column("preferred_bedrooms", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("preferred_bathrooms", sa.Integer(), nullable=True))

    op.execute(
        """
        UPDATE user_search_intent
        SET preferred_bedrooms = preferred_bedrooms_min
        WHERE preferred_bedrooms_min IS NOT NULL
    """
    )
    op.execute(
        """
        UPDATE user_search_intent
        SET preferred_bathrooms = preferred_bathrooms_min
        WHERE preferred_bathrooms_min IS NOT NULL
    """
    )

    with op.batch_alter_table("user_search_intent", schema=None) as batch_op:
        batch_op.drop_column("preferred_bathrooms_max")
        batch_op.drop_column("preferred_bathrooms_min")
        batch_op.drop_column("preferred_bedrooms_max")
        batch_op.drop_column("preferred_bedrooms_min")
