"""
Aggregate user preferences from User + UserFinancials, UserDemographics, UserSearchIntent,
UserImportantLocation, UserIntentAttribute into a single dict for consumers.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from app import db
from app.models import (
    User,
    UserDemographics,
    UserFinancials,
    UserImportantLocation,
    UserIntentAttribute,
    UserSearchIntent,
)


def _build_preferences_dict(user_id: str) -> dict[str, Any] | None:
    """Build a flat preferences dict from related models for the given user_id."""
    user = User.query.get(user_id)
    if not user:
        return None

    out: dict[str, Any] = {}

    # Financials
    fin = (
        getattr(user, "user_financials", None)
        or UserFinancials.query.filter_by(user_id=user_id).first()
    )
    if fin:
        out["home_budget_min"] = fin.home_budget_min
        out["home_budget_max"] = fin.home_budget_max
        out["gross_income"] = fin.gross_income
        out["credit_score_range"] = fin.credit_score_range
        out["down_payment"] = fin.down_payment

    # Demographics
    demo = (
        getattr(user, "user_demographics", None)
        or UserDemographics.query.filter_by(user_id=user_id).first()
    )
    if demo:
        out["age"] = demo.age
        out["pets"] = demo.pets
        out["occupation"] = demo.occupation
        out["gender"] = demo.gender

    # Search intent
    intent = (
        getattr(user, "user_search_intent", None)
        or UserSearchIntent.query.filter_by(user_id=user_id).first()
    )
    if intent:
        out["housing_type"] = intent.housing_type
        out["preferred_bedrooms_min"] = intent.preferred_bedrooms_min
        out["preferred_bedrooms_max"] = intent.preferred_bedrooms_max
        out["preferred_bathrooms_min"] = intent.preferred_bathrooms_min
        out["preferred_bathrooms_max"] = intent.preferred_bathrooms_max
        out["preferred_sqft_min"] = intent.preferred_sqft_min
        out["preferred_sqft_max"] = intent.preferred_sqft_max
        out["walkability_importance"] = intent.walkability_importance

    # Important locations -> important_locations list
    locations_rel = getattr(user, "user_important_locations", None)
    if locations_rel is not None and hasattr(locations_rel, "all"):
        loc_list = locations_rel.all()
    else:
        loc_list = (
            list(locations_rel)
            if locations_rel
            else UserImportantLocation.query.filter_by(user_id=user_id).all()
        )
    out["important_locations"] = [
        {
            "label": getattr(loc, "label", None),
            "address": getattr(loc, "address", None),
            "max_commute_minutes": getattr(loc, "max_commute_minutes", None),
            "commute_mode": getattr(loc, "commute_mode", None),
        }
        for loc in loc_list
    ]
    out["ideal_zip_code"] = None
    for loc in loc_list:
        addr = getattr(loc, "address", None)
        if addr and isinstance(addr, str):
            parts = addr.strip().split()
            for p in reversed(parts):
                if len(p) == 5 and p.isdigit():
                    out["ideal_zip_code"] = p
                    break
            break

    # Intent attributes -> preferred_home_features, deal_breakers
    attrs_rel = getattr(user, "user_intent_attributes", None)
    if attrs_rel is not None and hasattr(attrs_rel, "all"):
        attr_list = attrs_rel.all()
    else:
        attr_list = (
            list(attrs_rel)
            if attrs_rel
            else UserIntentAttribute.query.filter_by(user_id=user_id).all()
        )
    if attr_list is not None:
        features = []
        deal_breakers = []
        for a in attr_list:
            key = getattr(a, "attribute_key", None)
            typ = getattr(a, "attribute_type", None)
            if not key:
                continue
            if typ == "deal_breaker":
                deal_breakers.append(key)
            elif typ in ("feature", "nice_to_have", "must_have", "listing_type"):
                features.append(key)
        out["preferred_home_features"] = features
        out["deal_breakers"] = deal_breakers
    else:
        out["preferred_home_features"] = []
        out["deal_breakers"] = []

    return out if out else None


def get_preferences_dict_optional(user_id: str) -> dict[str, Any] | None:
    """Return aggregated preferences dict for the user, or None if user missing or no prefs."""
    if not user_id:
        return None
    user = User.query.get(user_id)
    if not user:
        return None
    return _build_preferences_dict(user_id)


def get_preferences_updated_at(user_id: str) -> datetime | None:
    """Return the most recent updated_at among user and preference-related records."""
    user = User.query.get(user_id)
    if not user:
        return None
    candidates: list[datetime] = []
    if getattr(user, "updated_at", None):
        candidates.append(user.updated_at)
    fin = UserFinancials.query.filter_by(user_id=user_id).first()
    if fin and getattr(fin, "updated_at", None):
        candidates.append(fin.updated_at)
    demo = UserDemographics.query.filter_by(user_id=user_id).first()
    if demo and getattr(demo, "updated_at", None):
        candidates.append(demo.updated_at)
    intent = UserSearchIntent.query.filter_by(user_id=user_id).first()
    if intent and getattr(intent, "updated_at", None):
        candidates.append(intent.updated_at)
    if not candidates:
        return None
    return max(candidates)


def get_preferences_dict_for_user(
    user_id: str,
) -> tuple[dict[str, Any] | None, tuple[Any, int] | None]:
    """
    Get user preferences dict for the given user_id.
    Returns (preferences_dict, None) on success, or (None, (jsonify_response, status_code)) on error.
    """
    from flask import jsonify

    if not user_id:
        return None, (
            jsonify({"success": False, "error": "USER_NOT_FOUND", "message": "User not found"}),
            404,
        )
    user = User.query.get(user_id)
    if not user:
        return None, (
            jsonify({"success": False, "error": "USER_NOT_FOUND", "message": "User not found"}),
            404,
        )
    prefs = _build_preferences_dict(user_id)
    return prefs, None


def user_has_preferences(user_id: str) -> bool:
    """Return True if the user exists and has preferences (has_preferences flag or aggregated data)."""
    if not user_id:
        return False
    user = User.query.get(user_id)
    if not user:
        return False
    if getattr(user, "has_preferences", False):
        return True
    prefs = _build_preferences_dict(user_id)
    return bool(prefs)


def write_preferences_from_payload(
    user_id: str,
    data: dict[str, Any],
    *,
    user: User | None = None,
) -> dict[str, Any]:
    """
    Write preference payload to User + UserFinancials, UserDemographics, UserSearchIntent,
    and optionally UserImportantLocation / UserIntentAttribute. Sets user.has_preferences = True.
    Returns the aggregated preferences dict after write.
    """
    u = user or User.query.get(user_id)
    if not u:
        raise ValueError(f"User not found: {user_id}")

    # Financials
    fin = UserFinancials.query.filter_by(user_id=user_id).first()
    if fin is None:
        fin = UserFinancials(user_id=user_id)
        db.session.add(fin)
    if "home_budget_min" in data and data["home_budget_min"] is not None:
        fin.home_budget_min = float(data["home_budget_min"])
    if "home_budget_max" in data and data["home_budget_max"] is not None:
        fin.home_budget_max = float(data["home_budget_max"])
    if "gross_income" in data and data["gross_income"] is not None:
        fin.gross_income = float(data["gross_income"])
    if "down_payment" in data and data["down_payment"] is not None:
        fin.down_payment = float(data["down_payment"])
    if "credit_score_range" in data:
        fin.credit_score_range = (
            str(data["credit_score_range"]) if data["credit_score_range"] is not None else None
        )

    # Demographics
    demo = UserDemographics.query.filter_by(user_id=user_id).first()
    if demo is None:
        demo = UserDemographics(user_id=user_id)
        db.session.add(demo)
    if "age" in data and data["age"] is not None:
        demo.age = int(data["age"])
    if "pets" in data:
        demo.pets = str(data["pets"]) if data["pets"] is not None else None
    if "occupation" in data:
        demo.occupation = str(data["occupation"]) if data["occupation"] is not None else None
    if "gender" in data:
        demo.gender = str(data["gender"]) if data["gender"] is not None else None

    # Search intent
    intent = UserSearchIntent.query.filter_by(user_id=user_id).first()
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
    if "walkability_importance" in data:
        intent.walkability_importance = (
            str(data["walkability_importance"])
            if data["walkability_importance"] is not None
            else None
        )

    # Important locations: replace with payload list if present
    locs = data.get("important_locations")
    if isinstance(locs, list):
        UserImportantLocation.query.filter_by(user_id=user_id).delete()
        for loc in locs:
            if isinstance(loc, dict):
                row = UserImportantLocation(
                    user_id=user_id,
                    label=loc.get("label"),
                    address=loc.get("address"),
                    max_commute_minutes=loc.get("max_commute_minutes"),
                    commute_mode=loc.get("commute_mode"),
                )
                db.session.add(row)
            elif isinstance(loc, str):
                row = UserImportantLocation(user_id=user_id, address=loc)
                db.session.add(row)

    # Intent attributes: preferred_home_features, deal_breakers
    features = data.get("preferred_home_features")
    if isinstance(features, list):
        UserIntentAttribute.query.filter(
            UserIntentAttribute.user_id == user_id,
            UserIntentAttribute.attribute_type.in_(["feature", "nice_to_have", "must_have"]),
        ).delete(synchronize_session=False)
        for f in features:
            key = f if isinstance(f, str) else str(f)
            if key:
                db.session.add(
                    UserIntentAttribute(
                        user_id=user_id, attribute_type="feature", attribute_key=key
                    )
                )
    breakers = data.get("deal_breakers")
    if isinstance(breakers, list):
        UserIntentAttribute.query.filter(
            UserIntentAttribute.user_id == user_id,
            UserIntentAttribute.attribute_type == "deal_breaker",
        ).delete(synchronize_session=False)
        for b in breakers:
            key = b if isinstance(b, str) else str(b)
            if key:
                db.session.add(
                    UserIntentAttribute(
                        user_id=user_id, attribute_type="deal_breaker", attribute_key=key
                    )
                )

    u.has_preferences = True
    db.session.commit()
    return get_preferences_dict_optional(user_id) or {}
