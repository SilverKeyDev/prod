"""Build public (unauthenticated) agent listings from the shared property cache."""

from __future__ import annotations

from sqlalchemy import func, or_, select

from app import db
from app.models import User
from app.models.property.property_cache import PropertyCache
from app.schemas.generated import PublicAgentListing, StatusCategory
from app.services.auth.user_role_helpers import user_is_agent
from app.utils.db.orm_lookup import get_model

# Cap the public payload; the demo surface shows a handful of cards per bucket.
MAX_PUBLIC_AGENT_LISTINGS = 48

# Raw MLS statuses treated as former/closed; anything else on a cached row is
# considered a current listing (cache only holds properties that were listed).
_SOLD_STATUSES = frozenset({"sold", "closed", "recently_sold", "off_market"})


def _canonical_status(raw: str | None) -> str:
    return str(raw or "").strip().lower().replace("-", "_").replace(" ", "_")


def status_category_for_listing_status(raw: str | None) -> StatusCategory:
    """Bucket a raw MLS status into the public active/sold split."""
    if _canonical_status(raw) in _SOLD_STATUSES:
        return StatusCategory.sold
    return StatusCategory.active


def _listing_from_row(row: PropertyCache) -> PublicAgentListing:
    return PublicAgentListing(
        id=row.id,
        zpid=row.zpid,
        address=row.address,
        city=row.city,
        state=row.state,
        zipcode=row.zipcode,
        price=row.price,
        beds=row.beds,
        baths=row.baths,
        sqft=row.sqft or row.living_area,
        primary_image_url=row.primary_image_url,
        listing_status=row.listing_status,
        status_category=status_category_for_listing_status(row.listing_status),
        brokerage=row.brokerage,
        mls_home_id=row.mls_home_id,
        mls_region=row.mls_region,
    )


def build_public_agent_listings(
    user_id: str, status: StatusCategory | None = None
) -> list[PublicAgentListing] | None:
    """Return the agent's MLS listings, or None if the user is missing, not an agent, or inactive.

    Matches ``property_cache`` rows by the agent's MLS id (``users.mls_id`` ↔
    ``property_cache.mls_agent_id``) or listing agent email. An agent with no
    MLS identity simply has no listings (empty list, not None).
    """
    if not user_id or not str(user_id).strip():
        return None
    user = get_model(User, str(user_id).strip())
    if user is None:
        return None
    is_active = user.is_active if user.is_active is not None else True
    if not is_active or not bool(user_is_agent(user)):
        return None

    mls_id = (user.mls_id or "").strip()
    email = (user.email or "").strip().lower()
    match_filters = []
    if mls_id:
        match_filters.append(PropertyCache.mls_agent_id == mls_id)
    if email:
        match_filters.append(func.lower(PropertyCache.listing_agent_email) == email)
    if not match_filters:
        return []

    rows = db.session.scalars(
        select(PropertyCache)
        .where(or_(*match_filters))
        .order_by(PropertyCache.updated_at.desc().nulls_last(), PropertyCache.id)
        .limit(MAX_PUBLIC_AGENT_LISTINGS)
    ).all()

    listings = [_listing_from_row(row) for row in rows]
    if status is not None:
        listings = [item for item in listings if item.status_category == status]
    return listings
