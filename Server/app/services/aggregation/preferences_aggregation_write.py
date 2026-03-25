"""
Write user preferences from API payload to User and related models.
"""

from __future__ import annotations

import json
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
            json.dumps(list(val))
            if isinstance(val, list)
            else (str(val) if val is not None else None)
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
            str(data["has_buyers_agent"]).strip() if data["has_buyers_agent"] is not None else None
        )
    if "looking_for_buyers_agent" in data:
        val = data["looking_for_buyers_agent"]
        comm.looking_for_buyers_agent = (
            bool(val)
            if isinstance(val, bool)
            else str(val).lower() in ("true", "1", "yes")
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
    if "preferred_home_age_min" in data and data["preferred_home_age_min"] is not None:
        intent.preferred_home_age_min = int(data["preferred_home_age_min"])
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
            loc
            for loc in locs
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
                UserIntentAttribute(user_id=user_id, attribute_type="feature", attribute_key=f)
            )
        for b in breakers:
            db.session.add(
                UserIntentAttribute(user_id=user_id, attribute_type="deal_breaker", attribute_key=b)
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
    from app.services.aggregation.preferences_aggregation import get_preferences_dict_optional

    return get_preferences_dict_optional(user_id) or {}
