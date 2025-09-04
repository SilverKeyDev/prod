"""Add id primary key to home_universal table

Revision ID: add_id_pk_home_universal
Revises: 
Create Date: 2025-09-04 12:48:00.000000

"""
from alembic import op
import sqlalchemy as sa
import uuid

# revision identifiers, used by Alembic.
revision = 'add_id_pk_home_universal'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # First, add the new id column as nullable
    op.add_column('home_universal', sa.Column('id', sa.String(36), nullable=True))
    
    # Populate existing rows with UUIDs
    connection = op.get_bind()
    connection.execute(
        sa.text("UPDATE home_universal SET id = :uuid WHERE id IS NULL"),
        {"uuid": str(uuid.uuid4())}
    )
    
    # For each existing row, generate a unique UUID
    result = connection.execute(sa.text("SELECT user_id FROM home_universal"))
    for row in result:
        connection.execute(
            sa.text("UPDATE home_universal SET id = :uuid WHERE user_id = :user_id AND id IS NULL"),
            {"uuid": str(uuid.uuid4()), "user_id": row[0]}
        )
    
    # Drop the old primary key constraint
    op.drop_constraint('home_universal_pkey', 'home_universal', type_='primary')
    
    # Make the new id column non-nullable and set it as primary key
    op.alter_column('home_universal', 'id', nullable=False)
    op.create_primary_key('home_universal_pkey', 'home_universal', ['id'])
    
    # Make user_id non-nullable but not primary key
    op.alter_column('home_universal', 'user_id', nullable=False)

def downgrade():
    # Remove the id column and restore user_id as primary key
    op.drop_constraint('home_universal_pkey', 'home_universal', type_='primary')
    op.create_primary_key('home_universal_pkey', 'home_universal', ['user_id'])
    op.drop_column('home_universal', 'id')
