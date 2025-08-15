"""Refactor to_dict for onboarding fields only

Revision ID: 30359e4ac8ce
Revises: 84c86e3daa4e
Create Date: 2025-08-15 09:21:54.258220

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '30359e4ac8ce'
down_revision = '84c86e3daa4e'
branch_labels = None
depends_on = None


def upgrade():
    # Ensure gen_random_uuid() is available for backfill
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto";')

    # --- home_descriptions changes ---
    with op.batch_alter_table('home_descriptions', schema=None) as batch_op:
        batch_op.add_column(sa.Column('property_analysis', sa.JSON(), nullable=True))
        batch_op.drop_column('positives')
        batch_op.drop_column('negatives')
        batch_op.drop_column('user_description')

    # --- home_universal changes ---
    # Important: add id with a server_default so existing rows get values immediately.
    with op.batch_alter_table('home_universal', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                'id',
                sa.String(length=36),
                nullable=False,
                server_default=sa.text("gen_random_uuid()::text"),
            )
        )

    # Drop the default so future inserts are controlled by the app/ORM
    op.alter_column('home_universal', 'id', server_default=None, existing_type=sa.String(length=36))

    # If user_id had FKs pointing out, drop them defensively (no-op if none).
    # Replace constraint names if you know the exact names; IF EXISTS keeps this safe.
    op.execute('ALTER TABLE home_universal DROP CONSTRAINT IF EXISTS home_universal_user_id_fkey;')

    with op.batch_alter_table('home_universal', schema=None) as batch_op:
        # Add all new columns
        batch_op.add_column(sa.Column('bedrooms', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('bathrooms', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('lat', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('lng', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('property_type', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('listing_status', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('zpid', sa.BigInteger(), nullable=True))
        batch_op.add_column(sa.Column('street_address', sa.String(length=500), nullable=True))
        batch_op.add_column(sa.Column('city', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('state', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('zipcode', sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column('year_built', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('living_area', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('living_area_value', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('price_per_square_foot', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('property_type_dimension', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('home_type', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('home_status', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('time_on_zillow', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('days_on_zillow', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('on_market_date', sa.BigInteger(), nullable=True))
        batch_op.add_column(sa.Column('zestimate', sa.BigInteger(), nullable=True))
        batch_op.add_column(sa.Column('tax_annual_amount', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('property_tax_rate', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('hoa_fee', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('association_fee', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('monthly_hoa_fee', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('annual_homeowners_insurance', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('rent_zestimate', sa.BigInteger(), nullable=True))
        batch_op.add_column(sa.Column('architectural_style', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('structure_type', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('property_condition', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('is_new_construction', sa.Boolean(), nullable=True))
        batch_op.add_column(sa.Column('has_garage', sa.Boolean(), nullable=True))
        batch_op.add_column(sa.Column('has_attached_garage', sa.Boolean(), nullable=True))
        batch_op.add_column(sa.Column('garage_spaces', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('parking', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('has_view', sa.Boolean(), nullable=True))
        batch_op.add_column(sa.Column('water_view', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('has_fireplace', sa.Boolean(), nullable=True))
        batch_op.add_column(sa.Column('has_cooling', sa.Boolean(), nullable=True))
        batch_op.add_column(sa.Column('has_heating', sa.Boolean(), nullable=True))
        batch_op.add_column(sa.Column('has_association', sa.Boolean(), nullable=True))
        batch_op.add_column(sa.Column('view', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('flooring', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('heating', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('cooling', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('appliances', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('interior_features', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('exterior_features', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('lot_features', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('community_features', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('parking_features', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('utilities', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('inclusions', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('rooms', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('bathrooms_full', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('bathrooms_half', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('bathrooms_partial', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('bathrooms_three_quarter', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('main_level_bedrooms', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('main_level_bathrooms', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('stories', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('roof_type', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('foundation_details', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('construction_materials', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('window_features', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('subdivision', sa.String(length=200), nullable=True))
        batch_op.add_column(sa.Column('subdivision_name', sa.String(length=200), nullable=True))
        batch_op.add_column(sa.Column('county', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('city_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('parcel_number', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('contact_recipients', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('listed_by', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('schools', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('price_history', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('nearby_homes', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('at_a_glance_facts', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('description', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('url', sa.String(length=500), nullable=True))
        batch_op.add_column(sa.Column('mlsid', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('page_view_count', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('favorite_count', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('virtual_tour', sa.String(length=500), nullable=True))
        batch_op.add_column(sa.Column('building_name', sa.String(length=200), nullable=True))
        batch_op.add_column(sa.Column('mortgage_rates', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('images', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('photos', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('commute_data', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('zillow_url', sa.String(length=500), nullable=True))
        batch_op.add_column(sa.Column('features', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('image_features', sa.JSON(), nullable=True))

        # Safe cast: VARCHAR(36) -> INTEGER, stripping non-digits; empty -> NULL
        batch_op.alter_column(
            'sqft',
            existing_type=sa.VARCHAR(length=36),
            type_=sa.Integer(),
            existing_nullable=True,
            postgresql_using="NULLIF(regexp_replace(sqft, '[^0-9]', '', 'g'), '')::integer"
        )

        # Drop columns that are being removed
        batch_op.drop_column('user_id')
        batch_op.drop_column('beds')
        batch_op.drop_column('baths')


def downgrade():
    with op.batch_alter_table('home_universal', schema=None) as batch_op:
        # Re-add removed columns as nullable to avoid failures on downgrade
        batch_op.add_column(sa.Column('baths', sa.VARCHAR(length=36), autoincrement=False, nullable=True))
        batch_op.add_column(sa.Column('beds', sa.VARCHAR(length=36), autoincrement=False, nullable=True))
        batch_op.add_column(sa.Column('user_id', sa.VARCHAR(length=36), autoincrement=False, nullable=True))

        # Revert sqft to VARCHAR(36)
        batch_op.alter_column(
            'sqft',
            existing_type=sa.Integer(),
            type_=sa.VARCHAR(length=36),
            existing_nullable=True,
            postgresql_using="sqft::text"
        )

        # Drop added columns (reverse order not strictly required in batch)
        batch_op.drop_column('image_features')
        batch_op.drop_column('features')
        batch_op.drop_column('zillow_url')
        batch_op.drop_column('commute_data')
        batch_op.drop_column('photos')
        batch_op.drop_column('images')
        batch_op.drop_column('mortgage_rates')
        batch_op.drop_column('building_name')
        batch_op.drop_column('virtual_tour')
        batch_op.drop_column('favorite_count')
        batch_op.drop_column('page_view_count')
        batch_op.drop_column('mlsid')
        batch_op.drop_column('url')
        batch_op.drop_column('description')
        batch_op.drop_column('at_a_glance_facts')
        batch_op.drop_column('nearby_homes')
        batch_op.drop_column('price_history')
        batch_op.drop_column('schools')
        batch_op.drop_column('listed_by')
        batch_op.drop_column('contact_recipients')
        batch_op.drop_column('parcel_number')
        batch_op.drop_column('city_id')
        batch_op.drop_column('county')
        batch_op.drop_column('subdivision_name')
        batch_op.drop_column('subdivision')
        batch_op.drop_column('window_features')
        batch_op.drop_column('construction_materials')
        batch_op.drop_column('foundation_details')
        batch_op.drop_column('roof_type')
        batch_op.drop_column('stories')
        batch_op.drop_column('main_level_bathrooms')
        batch_op.drop_column('main_level_bedrooms')
        batch_op.drop_column('bathrooms_three_quarter')
        batch_op.drop_column('bathrooms_partial')
        batch_op.drop_column('bathrooms_half')
        batch_op.drop_column('bathrooms_full')
        batch_op.drop_column('rooms')
        batch_op.drop_column('inclusions')
        batch_op.drop_column('utilities')
        batch_op.drop_column('parking_features')
        batch_op.drop_column('community_features')
        batch_op.drop_column('lot_features')
        batch_op.drop_column('exterior_features')
        batch_op.drop_column('interior_features')
        batch_op.drop_column('appliances')
        batch_op.drop_column('cooling')
        batch_op.drop_column('heating')
        batch_op.drop_column('flooring')
        batch_op.drop_column('view')
        batch_op.drop_column('has_association')
        batch_op.drop_column('has_heating')
        batch_op.drop_column('has_cooling')
        batch_op.drop_column('has_fireplace')
        batch_op.drop_column('water_view')
        batch_op.drop_column('has_view')
        batch_op.drop_column('parking')
        batch_op.drop_column('garage_spaces')
        batch_op.drop_column('has_attached_garage')
        batch_op.drop_column('has_garage')
        batch_op.drop_column('is_new_construction')
        batch_op.drop_column('property_condition')
        batch_op.drop_column('structure_type')
        batch_op.drop_column('architectural_style')
        batch_op.drop_column('rent_zestimate')
        batch_op.drop_column('annual_homeowners_insurance')
        batch_op.drop_column('monthly_hoa_fee')
        batch_op.drop_column('association_fee')
        batch_op.drop_column('hoa_fee')
        batch_op.drop_column('property_tax_rate')
        batch_op.drop_column('tax_annual_amount')
        batch_op.drop_column('zestimate')
        batch_op.drop_column('on_market_date')
        batch_op.drop_column('days_on_zillow')
        batch_op.drop_column('time_on_zillow')
        batch_op.drop_column('home_status')
        batch_op.drop_column('home_type')
        batch_op.drop_column('property_type_dimension')
        batch_op.drop_column('price_per_square_foot')
        batch_op.drop_column('living_area_value')
        batch_op.drop_column('living_area')
        batch_op.drop_column('year_built')
        batch_op.drop_column('zipcode')
        batch_op.drop_column('state')
        batch_op.drop_column('city')
        batch_op.drop_column('street_address')
        batch_op.drop_column('zpid')
        batch_op.drop_column('listing_status')
        batch_op.drop_column('property_type')
        batch_op.drop_column('lng')
        batch_op.drop_column('lat')
        batch_op.drop_column('bathrooms')
        batch_op.drop_column('bedrooms')

        # Finally drop id (no PK manipulations here)
        batch_op.drop_column('id')

    with op.batch_alter_table('home_descriptions', schema=None) as batch_op:
        batch_op.add_column(sa.Column('user_description', sa.VARCHAR(length=500), autoincrement=False, nullable=True))
        batch_op.add_column(sa.Column('negatives', sa.VARCHAR(length=500), autoincrement=False, nullable=True))
        batch_op.add_column(sa.Column('positives', sa.VARCHAR(length=500), autoincrement=False, nullable=True))
        batch_op.drop_column('property_analysis')
