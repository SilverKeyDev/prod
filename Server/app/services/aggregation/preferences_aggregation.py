"""
Aggregate user preferences from User + UserFinancials, UserDemographics, UserSearchIntent,
UserImportantLocation, UserIntentAttribute, UserAgentProfile into a single dict for consumers.
"""

from __future__ import annotations

import json
from datetime import datetime
from typing import Any

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


def _build_preferences_dict(user_id: str) -> dict[str, Any] | None:
    """Build a flat preferences dict from related models for the given user_id."""
    user = User.query.get(user_id)
    if not user:
        return None

    out: dict[str, Any] = {}

    # User-level: is_agent, name (name stored on User; exposed here so profile "About you" gets it)
    out["is_agent"] = "yes" if getattr(user, "is_agent", False) else "no"
    out["name"] = getattr(user, "name", None) or ""

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
        out["why_joining_silverkey"] = _parse_json_array(
            getattr(demo, "why_joining_silverkey", None)
        )

    # Communication prefs (has_buyers_agent, looking_for_buyers_agent, etc.)
    comm = (
        getattr(user, "user_communication_prefs", None)
        or UserCommunicationPrefs.query.filter_by(user_id=user_id).first()
    )
    if comm:
        out["communication_frequency"] = comm.communication_frequency
        out["information_detail_level"] = comm.information_detail_level
        out["has_buyers_agent"] = comm.has_buyers_agent
        out["looking_for_buyers_agent"] = comm.looking_for_buyers_agent

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
        out["preferred_lot_size_min"] = intent.preferred_lot_size_min
        out["preferred_lot_size_max"] = intent.preferred_lot_size_max
        out["preferred_home_age_min"] = None  # column not in DB; kept for API compatibility
        out["preferred_home_age_max"] = intent.preferred_home_age_max
        out["days_on_market_min"] = intent.days_on_market_min
        out["days_on_market_max"] = intent.days_on_market_max
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

    # Agent profile (only when user.is_agent is True)
    if getattr(user, "is_agent", False):
        agent = (
            getattr(user, "user_agent_profile", None)
            or UserAgentProfile.query.filter_by(user_id=user_id).first()
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
    comm = UserCommunicationPrefs.query.filter_by(user_id=user_id).first()
    if comm and getattr(comm, "updated_at", None):
        candidates.append(comm.updated_at)
    # UserImportantLocation: max updated_at among all locations for this user
    loc_list = UserImportantLocation.query.filter_by(user_id=user_id).all()
    for loc in loc_list:
        if getattr(loc, "updated_at", None):
            candidates.append(loc.updated_at)
    agent_prof = UserAgentProfile.query.filter_by(user_id=user_id).first()
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
    user = User.query.get(user_id)
    if not user:
        return None, (
            jsonify({"success": False, "error": "USER_NOT_FOUND", "message": "User not found"}),
            404,
        )
    prefs = _build_preferences_dict(user_id)
    return prefs, None


def _write_agent_profile_from_payload(agent: UserAgentProfile, data: dict[str, Any]) -> None:
    """Update UserAgentProfile from preferences payload."""
    if "agent_physical_mailing_address" in data:
        agent.physical_mailing_address = (
            str(data["agent_physical_mailing_address"]).strip()
            if data["agent_physical_mailing_address"] is not None
            else None
        )
    if "agent_licensed_states" in data:
        agent.licensed_states = (
            json.dumps(list(data["agent_licensed_states"]))
            if isinstance(data["agent_licensed_states"], list)
            else None
        )
    if "agent_license_types" in data:
        agent.license_types = (
            json.dumps(list(data["agent_license_types"]))
            if isinstance(data["agent_license_types"], list)
            else None
        )
    if "agent_license_numbers" in data:
        agent.license_numbers = (
            json.dumps(list(data["agent_license_numbers"]))
            if isinstance(data["agent_license_numbers"], list)
            else None
        )
    if "agent_license_expiration_dates" in data:
        agent.license_expiration_dates = (
            json.dumps(list(data["agent_license_expiration_dates"]))
            if isinstance(data["agent_license_expiration_dates"], list)
            else None
        )
    if "agent_mls_affiliations" in data:
        val = data["agent_mls_affiliations"]
        agent.mls_affiliations = json.dumps(list(val)) if isinstance(val, list) else None
    if "agent_brokerage_name" in data:
        agent.brokerage_name = (
            str(data["agent_brokerage_name"]).strip()
            if data["agent_brokerage_name"] is not None
            else None
        )
    if "agent_brokerage_bic_name" in data:
        agent.brokerage_bic_name = (
            str(data["agent_brokerage_bic_name"]).strip()
            if data["agent_brokerage_bic_name"] is not None
            else None
        )
    if "agent_brokerage_address" in data:
        agent.brokerage_address = (
            str(data["agent_brokerage_address"]).strip()
            if data["agent_brokerage_address"] is not None
            else None
        )
    if "agent_brokerage_email" in data:
        agent.brokerage_email = (
            str(data["agent_brokerage_email"]).strip()
            if data["agent_brokerage_email"] is not None
            else None
        )
    if "agent_brokerage_phone" in data:
        agent.brokerage_phone = (
            str(data["agent_brokerage_phone"]).strip()
            if data["agent_brokerage_phone"] is not None
            else None
        )
    if "agent_bio" in data:
        agent.agent_bio = str(data["agent_bio"]).strip() if data["agent_bio"] is not None else None
    if "agent_primary_service_zips" in data:
        val = data["agent_primary_service_zips"]
        agent.primary_service_zips = json.dumps(list(val)) if isinstance(val, list) else None
    if "agent_specialties" in data:
        val = data["agent_specialties"]
        agent.specialties = json.dumps(list(val)) if isinstance(val, list) else None
    if "agent_social_links" in data:
        val = data["agent_social_links"]
        agent.social_links = json.dumps(dict(val)) if isinstance(val, dict) else None


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

    # User.is_agent: immutable once set. Users choose agent vs buyer only during onboarding;
    # after that, the choice cannot be changed (prevents agents from switching to buyer or vice versa).
    if "is_agent" in data:
        if not getattr(u, "is_agent", False):
            val = data["is_agent"]
            u.is_agent = bool(val and str(val).lower() in ("yes", "true", "1", "am_agent"))

    # User.name: when profile "About you" sends name, persist to User (single source of truth)
    if "name" in data and data["name"] is not None:
        new_name = str(data["name"]).strip()
        if new_name:
            u.name = new_name

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
    if "why_joining_silverkey" in data:
        val = data["why_joining_silverkey"]
        demo.why_joining_silverkey = (
            json.dumps(list(val)) if isinstance(val, list) else (str(val) if val is not None else None)
        )

    # Communication prefs
    comm = UserCommunicationPrefs.query.filter_by(user_id=user_id).first()
    if comm is None:
        comm = UserCommunicationPrefs(user_id=user_id)
        db.session.add(comm)
    if "communication_frequency" in data:
        comm.communication_frequency = (
            str(data["communication_frequency"]).strip()
            if data["communication_frequency"] is not None
            else None
        )
    if "information_detail_level" in data:
        comm.information_detail_level = (
            str(data["information_detail_level"]).strip()
            if data["information_detail_level"] is not None
            else None
        )
    if "has_buyers_agent" in data:
        comm.has_buyers_agent = (
            str(data["has_buyers_agent"]).strip()
            if data["has_buyers_agent"] is not None
            else None
        )
    if "looking_for_buyers_agent" in data:
        val = data["looking_for_buyers_agent"]
        comm.looking_for_buyers_agent = (
            bool(val) if isinstance(val, bool) else str(val).lower() in ("true", "1", "yes")
            if val is not None
            else None
        )

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
    # preferred_home_age_min column not in DB; payload key ignored for now
    if "preferred_home_age_max" in data and data["preferred_home_age_max"] is not None:
        intent.preferred_home_age_max = int(data["preferred_home_age_max"])
    if "days_on_market_min" in data and data["days_on_market_min"] is not None:
        intent.days_on_market_min = int(data["days_on_market_min"])
    if "days_on_market_max" in data and data["days_on_market_max"] is not None:
        intent.days_on_market_max = int(data["days_on_market_max"])

    # Important locations: replace with payload list if present; prepend ideal_zip_code so it loads back
    locs = data.get("important_locations")
    if not isinstance(locs, list):
        locs = []
    ideal_zip = data.get("ideal_zip_code")
    if ideal_zip and isinstance(ideal_zip, str) and ideal_zip.strip():
        ideal_zip = ideal_zip.strip()
        # Prepend so _build_preferences_dict derives ideal_zip_code from first location
        locs = [{"address": ideal_zip}] + [
            loc for loc in locs
            if isinstance(loc, dict) and (loc.get("address") or "").strip() != ideal_zip
        ]
    if isinstance(locs, list) and len(locs) > 0:
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

    # Intent attributes: other_requirements (unified) or preferred_home_features + deal_breakers
    # When other_requirements is sent, split: "no X" -> deal_breaker, else -> feature
    other_req = data.get("other_requirements")
    if isinstance(other_req, list):
        features = []
        breakers = []
        for item in other_req:
            key = item if isinstance(item, str) else str(item)
            key_stripped = key.strip()
            if not key_stripped:
                continue
            if key_stripped.lower().startswith("no "):
                breakers.append(key_stripped)
            else:
                features.append(key_stripped)
        UserIntentAttribute.query.filter(
            UserIntentAttribute.user_id == user_id,
            UserIntentAttribute.attribute_type.in_(["feature", "nice_to_have"]),
        ).delete(synchronize_session=False)
        UserIntentAttribute.query.filter(
            UserIntentAttribute.user_id == user_id,
            UserIntentAttribute.attribute_type == "deal_breaker",
        ).delete(synchronize_session=False)
        for f in features:
            db.session.add(
                UserIntentAttribute(
                    user_id=user_id, attribute_type="feature", attribute_key=f
                )
            )
        for b in breakers:
            db.session.add(
                UserIntentAttribute(
                    user_id=user_id, attribute_type="deal_breaker", attribute_key=b
                )
            )
    else:
        features = data.get("preferred_home_features")
        if isinstance(features, list):
            UserIntentAttribute.query.filter(
                UserIntentAttribute.user_id == user_id,
                UserIntentAttribute.attribute_type.in_(["feature", "nice_to_have"]),
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

    # Intent attributes: must_have and listing_type (always from payload when present)
    must_have = data.get("must_have")
    if isinstance(must_have, list):
        UserIntentAttribute.query.filter(
            UserIntentAttribute.user_id == user_id,
            UserIntentAttribute.attribute_type == "must_have",
        ).delete(synchronize_session=False)
        for m in must_have:
            key = m if isinstance(m, str) else str(m)
            if key:
                db.session.add(
                    UserIntentAttribute(
                        user_id=user_id, attribute_type="must_have", attribute_key=key
                    )
                )
    listing_type = data.get("listing_type")
    if isinstance(listing_type, list):
        UserIntentAttribute.query.filter(
            UserIntentAttribute.user_id == user_id,
            UserIntentAttribute.attribute_type == "listing_type",
        ).delete(synchronize_session=False)
        for lt in listing_type:
            key = lt if isinstance(lt, str) else str(lt)
            if key:
                db.session.add(
                    UserIntentAttribute(
                        user_id=user_id, attribute_type="listing_type", attribute_key=key
                    )
                )

    # Single-value housing prefs stored in UserIntentAttribute (no schema change)
    for attr_type, payload_key in [
        ("preferred_architectural_style", "preferred_architectural_style"),
        ("renovation_preference", "renovation_preference"),
        ("intended_property_use", "intended_property_use"),
    ]:
        UserIntentAttribute.query.filter(
            UserIntentAttribute.user_id == user_id,
            UserIntentAttribute.attribute_type == attr_type,
        ).delete(synchronize_session=False)
        val = data.get(payload_key)
        if val is not None and str(val).strip():
            db.session.add(
                UserIntentAttribute(
                    user_id=user_id,
                    attribute_type=attr_type,
                    attribute_key=str(val).strip(),
                )
            )

    # Agent profile (when user.is_agent is True and agent fields present)
    if getattr(u, "is_agent", False):
        agent = UserAgentProfile.query.filter_by(user_id=user_id).first()
        if agent is None:
            agent = UserAgentProfile(user_id=user_id)
            db.session.add(agent)
        _write_agent_profile_from_payload(agent, data)
    else:
        # Remove agent profile when user is no longer an agent
        UserAgentProfile.query.filter_by(user_id=user_id).delete()

    u.has_preferences = True
    db.session.commit()
    return get_preferences_dict_optional(user_id) or {}
