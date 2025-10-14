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
    # Check if the id column already exists
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    columns = [col['name'] for col in inspector.get_columns('home_universal')]
    
    if 'id' not in columns:
        # First, add the new id column as nullable
        op.add_column('home_universal', sa.Column('id', sa.String(36), nullable=True))
        
        # Populate existing rows with UUIDs
        connection.execute(
            sa.text("UPDATE home_universal SET id = gen_random_uuid()::text WHERE id IS NULL")
        )
        
        # Drop the old primary key constraint if it exists
        try:
            op.drop_constraint('home_universal_pkey', 'home_universal', type_='primary')
        except:
            pass  # Constraint might not exist
        
        # Make the new id column non-nullable and set it as primary key
        op.alter_column('home_universal', 'id', nullable=False)
        op.create_primary_key('home_universal_pkey', 'home_universal', ['id'])
        
        # Make user_id non-nullable but not primary key
        try:
            op.alter_column('home_universal', 'user_id', nullable=False)
        except:
            pass  # Column might already be non-nullable
    else:
        # Column exists, just ensure constraints are correct
        try:
            # Check if id is already primary key
            pk_constraint = inspector.get_pk_constraint('home_universal')
            if pk_constraint and pk_constraint['constrained_columns'] != ['id']:
                op.drop_constraint('home_universal_pkey', 'home_universal', type_='primary')
                op.create_primary_key('home_universal_pkey', 'home_universal', ['id'])
        except:
            pass

def downgrade():
    # Remove the id column and restore user_id as primary key
    op.drop_constraint('home_universal_pkey', 'home_universal', type_='primary')
    op.create_primary_key('home_universal_pkey', 'home_universal', ['user_id'])
    op.drop_column('home_universal', 'id')
