"""Merge budget range and existing heads

Revision ID: g2a3b4c5d6e7
Revises: c23fde394e64, f1a2b3c4d5e6
Create Date: 2025-10-13 12:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'g2a3b4c5d6e7'
down_revision = ('c23fde394e64', 'f1a2b3c4d5e6')
branch_labels = None
depends_on = None


def upgrade():
    # Merge migration - no changes needed
    pass


def downgrade():
    # Merge migration - no changes needed
    pass

