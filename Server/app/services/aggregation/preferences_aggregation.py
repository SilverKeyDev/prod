"""
Aggregate user preferences from User + UserFinancials, UserDemographics, UserSearchIntent,
UserImportantLocation, UserIntentAttribute, UserAgentProfile into a single dict for consumers.
"""

from __future__ import annotations

import json
from datetime import datetime
from typing import Any

from sqlalchemy import select

from app import db
from app.models import (
    User,
    UserAgentProfile,
    UserCommunicationPrefs,
    UserDemographics,
    UserFinancials,
    UserImportantLocation,
    UserIntentAttribute,
    UserSearchIntent,
)
from app.services.aggregation.extended_buyer_preferences import (
    apply_extended_buyer_preference_canonical_keys,
    coerce_extension_value,
    normalize_stored_document,
)
from app.services.auth.user_role_helpers import user_is_agent
from app.utils.db.orm_lookup import get_model


def apply_canonical_housing_preference_keys(out: dict[str, Any]) -> None:
    """
    Mutate aggregated prefs so map_user_preferences_to_filters and MCDA see canonical keys.
    Safe to call on any flat dict shaped like _build_preferences_dict output.
    """
    if out.get("preferred_bathrooms") is None and out.get("preferred_bathrooms_min") is not None:
        out["preferred_bathrooms"] = out["preferred_bathrooms_min"]
    ht = out.get("housing_type")
    if not out.get("preferred_housing_type") and ht is not None and str(ht).strip():
        out["preferred_housing_type"] = ht


def _build_preferences_dict(user_id: str) -> dict[str, Any] | None:
    """Build a flat preferences dict from related models for the given user_id."""
    user = get_model(User, user_id)
    if not user:
        return None

    out: dict[str, Any] = {}

    # User-level: name (stored on User; exposed here so profile "About you" gets it)
    out["name"] = getattr(user, "name", None) or ""
    out["has_preferences"] = bool(getattr(user, "has_preferences", False))
    out["preferences_version"] = getattr(user, "preferences_version", None)

    # Financials
    fin = getattr(user, "user_financials", None) or db.session.scalar(
        select(UserFinancials).where(UserFinancials.user_id == user_id)
    )
    if fin:
        out["home_budget_min"] = fin.home_budget_min
        out["home_budget_max"] = fin.home_budget_max
        out["gross_income"] = fin.gross_income
        out["credit_score_range"] = fin.credit_score_range
        out["down_payment"] = fin.down_payment

    # Demographics
    demo = getattr(user, "user_demographics", None) or db.session.scalar(
        select(UserDemographics).where(UserDemographics.user_id == user_id)
    )
    if demo:
        out["age"] = demo.age
        out["pets"] = demo.pets
        out["occupation"] = demo.occupation
        out["gender"] = demo.gender
        out["why_joining_silverkey"] = _parse_json_array(
            getattr(demo, "why_joining_silverkey", None)
        )

    # Communication prefs (has_buyers_agent, looking_for_buyers_agent, etc.)
    comm = getattr(user, "user_communication_prefs", None) or db.session.scalar(
        select(UserCommunicationPrefs).where(UserCommunicationPrefs.user_id == user_id)
    )
    if comm:
        out["communication_frequency"] = comm.communication_frequency
        out["information_detail_level"] = comm.information_detail_level
        out["has_buyers_agent"] = comm.has_buyers_agent
        out["looking_for_buyers_agent"] = comm.looking_for_buyers_agent

    # Search intent
    intent = getattr(user, "user_search_intent", None) or db.session.scalar(
        select(UserSearchIntent).where(UserSearchIntent.user_id == user_id)
    )
    if intent:
        out["housing_type"] = intent.housing_type
        out["preferred_bedrooms_min"] = intent.preferred_bedrooms_min
        out["preferred_bedrooms_max"] = intent.preferred_bedrooms_max
        out["preferred_bathrooms_min"] = intent.preferred_bathrooms_min
        out["preferred_bathrooms_max"] = intent.preferred_bathrooms_max
        out["preferred_sqft_min"] = intent.preferred_sqft_min
        out["preferred_sqft_max"] = intent.preferred_sqft_max
        out["preferred_lot_size_min"] = intent.preferred_lot_size_min
        out["preferred_lot_size_max"] = intent.preferred_lot_size_max
        out["preferred_home_age_min"] = intent.preferred_home_age_min
        out["preferred_home_age_max"] = intent.preferred_home_age_max
        out["days_on_market_min"] = intent.days_on_market_min
        out["days_on_market_max"] = intent.days_on_market_max
        out["walkability_importance"] = intent.walkability_importance
        out["listing_status"] = getattr(intent, "listing_status", None)
        raw_ext = getattr(intent, "extended_buyer_preferences", None)
        ext = coerce_extension_value(raw_ext)
        if isinstance(ext, dict):
            include_availability = user_is_agent(user)
            norm = normalize_stored_document(ext, include_availability=include_availability)
            if len(norm) > 1:
                out["extended_buyer_preferences"] = norm

    # Important locations -> important_locations list
    locations_rel = getattr(user, "user_important_locations", None)
    if locations_rel is not None and hasattr(locations_rel, "all"):
        loc_list = locations_rel.all()
    else:
        loc_list = (
            list(locations_rel)
            if locations_rel
            else db.session.scalars(
                select(UserImportantLocation).where(UserImportantLocation.user_id == user_id)
            ).all()
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
            else db.session.scalars(
                select(UserIntentAttribute).where(UserIntentAttribute.user_id == user_id)
            ).all()
        )
    if attr_list is not None:
        features = []
        deal_breakers = []
        must_have = []
        listing_type = []
        for a in attr_list:
            key = getattr(a, "attribute_key", None)
            typ = getattr(a, "attribute_type", None)
            if not key:
                continue
            if typ == "deal_breaker":
                deal_breakers.append(key)
            elif typ == "must_have":
                must_have.append(key)
            elif typ == "listing_type":
                listing_type.append(key)
            elif typ in ("feature", "nice_to_have"):
                features.append(key)
            elif typ == "preferred_architectural_style":
                out["preferred_architectural_style"] = key
            elif typ == "renovation_preference":
                out["renovation_preference"] = key
            elif typ == "intended_property_use":
                out["intended_property_use"] = key
            elif typ == "paying_cash":
                out["paying_cash"] = str(key).lower() in ("yes", "true", "1")
        out["preferred_home_features"] = features
        out["deal_breakers"] = deal_breakers
        out["must_have"] = must_have
        out["listing_type"] = listing_type
    else:
        out["preferred_home_features"] = []
        out["deal_breakers"] = []
        out["must_have"] = []
        out["listing_type"] = []

    # Merged list for unified "Other requirements" UI (preferred + deal breakers)
    out["other_requirements"] = list(out.get("preferred_home_features", [])) + list(
        out.get("deal_breakers", [])
    )

    apply_canonical_housing_preference_keys(out)
    apply_extended_buyer_preference_canonical_keys(out)

    # Agent profile (only when user has agent role)
    if user_is_agent(user):
        out["public_profile_slug"] = getattr(user, "public_profile_slug", None)
        agent = getattr(user, "user_agent_profile", None) or db.session.scalar(
            select(UserAgentProfile).where(UserAgentProfile.user_id == user_id)
        )
        if agent:
            out["agent_physical_mailing_address"] = agent.physical_mailing_address
            out["agent_licensed_states"] = _parse_json_array(agent.licensed_states)
            out["agent_license_types"] = _parse_json_array(agent.license_types)
            out["agent_license_numbers"] = _parse_json_array(agent.license_numbers)
            out["agent_license_expiration_dates"] = _parse_json_array(
                agent.license_expiration_dates
            )
            out["agent_mls_affiliations"] = _parse_json_list_of_dicts(agent.mls_affiliations)
            out["agent_brokerage_name"] = agent.brokerage_name
            out["agent_brokerage_bic_name"] = agent.brokerage_bic_name
            out["agent_brokerage_address"] = agent.brokerage_address
            out["agent_brokerage_email"] = agent.brokerage_email
            out["agent_brokerage_phone"] = agent.brokerage_phone
            out["agent_bio"] = agent.agent_bio
            out["agent_primary_service_zips"] = _parse_json_array(agent.primary_service_zips)
            out["agent_specialties"] = _parse_json_array(agent.specialties)
            out["agent_social_links"] = _parse_json_object(agent.social_links)

    return out if out else None


def _parse_json_array(value: str | None) -> list:
    """Parse JSON array from text column; return empty list on failure."""
    if not value:
        return []
    try:
        parsed = json.loads(value)
        return list(parsed) if isinstance(parsed, list) else []
    except (json.JSONDecodeError, TypeError):
        return []


def _parse_json_list_of_dicts(value: str | None) -> list[dict[str, Any]]:
    """Parse JSON array of dicts from text column."""
    arr = _parse_json_array(value)
    return [x for x in arr if isinstance(x, dict)]


def _parse_json_object(value: str | None) -> dict[str, Any]:
    """Parse JSON object from text column; return empty dict on failure."""
    if not value:
        return {}
    try:
        parsed = json.loads(value)
        return dict(parsed) if isinstance(parsed, dict) else {}
    except (json.JSONDecodeError, TypeError):
        return {}


def get_preferences_dict_optional(user_id: str) -> dict[str, Any] | None:
    """Return aggregated preferences dict for the user, or None if user missing or no prefs."""
    if not user_id:
        return None
    user = get_model(User, user_id)
    if not user:
        return None
    return _build_preferences_dict(user_id)


def get_preferences_updated_at(user_id: str) -> datetime | None:
    """Return the most recent updated_at among user and preference-related records."""
    user = get_model(User, user_id)
    if not user:
        return None
    candidates: list[datetime] = []
    if getattr(user, "updated_at", None):
        candidates.append(user.updated_at)
    fin = db.session.scalar(select(UserFinancials).where(UserFinancials.user_id == user_id))
    if fin and getattr(fin, "updated_at", None):
        candidates.append(fin.updated_at)
    demo = db.session.scalar(select(UserDemographics).where(UserDemographics.user_id == user_id))
    if demo and getattr(demo, "updated_at", None):
        candidates.append(demo.updated_at)
    intent = db.session.scalar(select(UserSearchIntent).where(UserSearchIntent.user_id == user_id))
    if intent and getattr(intent, "updated_at", None):
        candidates.append(intent.updated_at)
    comm = db.session.scalar(
        select(UserCommunicationPrefs).where(UserCommunicationPrefs.user_id == user_id)
    )
    if comm and getattr(comm, "updated_at", None):
        candidates.append(comm.updated_at)
    # UserImportantLocation: max updated_at among all locations for this user
    loc_list = db.session.scalars(
        select(UserImportantLocation).where(UserImportantLocation.user_id == user_id)
    ).all()
    for loc in loc_list:
        if getattr(loc, "updated_at", None):
            candidates.append(loc.updated_at)
    agent_prof = db.session.scalar(
        select(UserAgentProfile).where(UserAgentProfile.user_id == user_id)
    )
    if agent_prof and getattr(agent_prof, "updated_at", None):
        candidates.append(agent_prof.updated_at)
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
    user = get_model(User, user_id)
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
    user = get_model(User, user_id)
    if not user:
        return False
    if getattr(user, "has_preferences", False):
        return True
    prefs = _build_preferences_dict(user_id)
    return bool(prefs)
