"""Search intent and housing preference writes."""

from typing import Any

from sqlalchemy import select

from app import db
from app.models import User, UserSearchIntent
from app.services.aggregation.extended_buyer_preferences import (
    merge_extended_buyer_preferences,
    normalize_listing_status,
)
from app.services.auth.user_role_helpers import user_is_agent
from app.utils.db.orm_lookup import get_model


def write_search_intent_from_payload(user_id: str, data: dict[str, Any]) -> UserSearchIntent:
    """Write UserSearchIntent from preferences payload."""
    intent = db.session.scalar(select(UserSearchIntent).where(UserSearchIntent.user_id == user_id))
    if intent is None:
        intent = UserSearchIntent(user_id=user_id)
        db.session.add(intent)
    if "housing_type" in data:
        intent.housing_type = (
            str(data["housing_type"]) if data["housing_type"] is not None else None
        )
    if "preferred_bedrooms_min" in data and data["preferred_bedrooms_min"] is not None:
        intent.preferred_bedrooms_min = int(data["preferred_bedrooms_min"])
    if "preferred_bedrooms_max" in data and data["preferred_bedrooms_max"] is not None:
        intent.preferred_bedrooms_max = int(data["preferred_bedrooms_max"])
    if "preferred_bathrooms_min" in data and data["preferred_bathrooms_min"] is not None:
        intent.preferred_bathrooms_min = int(data["preferred_bathrooms_min"])
    if "preferred_bathrooms_max" in data and data["preferred_bathrooms_max"] is not None:
        intent.preferred_bathrooms_max = int(data["preferred_bathrooms_max"])
    if "walkability_importance" in data:
        intent.walkability_importance = (
            str(data["walkability_importance"])
            if data["walkability_importance"] is not None
            else None
        )
    if "preferred_sqft_min" in data and data["preferred_sqft_min"] is not None:
        intent.preferred_sqft_min = int(data["preferred_sqft_min"])
    if "preferred_sqft_max" in data and data["preferred_sqft_max"] is not None:
        intent.preferred_sqft_max = int(data["preferred_sqft_max"])
    if "preferred_lot_size_min" in data and data["preferred_lot_size_min"] is not None:
        intent.preferred_lot_size_min = float(data["preferred_lot_size_min"])
    if "preferred_lot_size_max" in data and data["preferred_lot_size_max"] is not None:
        intent.preferred_lot_size_max = float(data["preferred_lot_size_max"])
    if "preferred_home_age_min" in data and data["preferred_home_age_min"] is not None:
        intent.preferred_home_age_min = int(data["preferred_home_age_min"])
    if "preferred_home_age_max" in data and data["preferred_home_age_max"] is not None:
        intent.preferred_home_age_max = int(data["preferred_home_age_max"])
    if "days_on_market_min" in data and data["days_on_market_min"] is not None:
        intent.days_on_market_min = int(data["days_on_market_min"])
    if "days_on_market_max" in data and data["days_on_market_max"] is not None:
        intent.days_on_market_max = int(data["days_on_market_max"])
    if "listing_status" in data:
        raw_ls = data.get("listing_status")
        if raw_ls is None or (isinstance(raw_ls, str) and not str(raw_ls).strip()):
            intent.listing_status = None
        else:
            intent.listing_status = normalize_listing_status(raw_ls)
    if "extended_buyer_preferences" in data:
        subject = get_model(User, user_id)
        allow_availability = bool(subject and user_is_agent(subject))
        merged = merge_extended_buyer_preferences(
            getattr(intent, "extended_buyer_preferences", None),
            data.get("extended_buyer_preferences"),
            allow_availability=allow_availability,
        )
        intent.extended_buyer_preferences = merged
    return intent
