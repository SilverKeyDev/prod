"""merge google_id/cognito change with budget fields

Revision ID: 42049c945e9d
Revises: h3a4b5c6d7e8, b7c8d9e0f1a2
Create Date: 2025-10-28 15:25:59.634593

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '42049c945e9d'
down_revision = ('h3a4b5c6d7e8', 'b7c8d9e0f1a2')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
