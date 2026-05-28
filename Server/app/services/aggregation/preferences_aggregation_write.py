"""
Write user preferences from API payload to User and related models (façade).
"""

import json
from typing import Any

from app import db
from app.models import User, UserAgentProfile
from app.services.auth.user_roles_sync import sync_client_roles_from_preferences
from app.services.public_profile_slug import ensure_public_profile_slug
from app.utils.db.orm_lookup import get_model
from app.utils.validation.service_boundary import assert_preferences_payload_bounds

from .preferences_write.agent_profile import write_agent_profile_from_payload
from .preferences_write.demographics import (
    write_communication_prefs_from_payload,
    write_demographics_from_payload,
)
from .preferences_write.financials import write_financials_from_payload
from .preferences_write.intent_attributes import write_intent_attributes_from_payload
from .preferences_write.locations import write_important_locations_from_payload
from .preferences_write.search_intent import write_search_intent_from_payload


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
    assert_preferences_payload_bounds(data)

    u = user or get_model(User, user_id)
    if not u:
        raise ValueError(f"User not found: {user_id}")

    # User.is_agent: immutable once set
    if "is_agent" in data:
        if not getattr(u, "is_agent", False):
            val = data["is_agent"]
            u.is_agent = bool(val and str(val).lower() in ("yes", "true", "1", "am_agent"))

    # User.name: when profile "About you" sends name, persist to User
    if "name" in data and data["name"] is not None:
        new_name = str(data["name"]).strip()
        if new_name:
            u.name = new_name

    # Write to related tables
    write_financials_from_payload(user_id, data)
    demo = write_demographics_from_payload(user_id, data)
    write_communication_prefs_from_payload(user_id, data)
    write_search_intent_from_payload(user_id, data)
    write_important_locations_from_payload(user_id, data)
    write_intent_attributes_from_payload(user_id, data)

    # Agent profile (when user.is_agent is True and agent fields present)
    if getattr(u, "is_agent", False):
        agent = UserAgentProfile.query.filter_by(user_id=user_id).first()
        if agent is None:
            agent = UserAgentProfile(user_id=user_id)
            db.session.add(agent)
        write_agent_profile_from_payload(agent, data)
    else:
        # Remove agent profile when user is no longer an agent
        UserAgentProfile.query.filter_by(user_id=user_id).delete()

    why_join_raw = data.get("why_joining_silverkey")
    if why_join_raw is None and demo is not None:
        stored = getattr(demo, "why_joining_silverkey", None)
        if stored:
            try:
                why_join_raw = json.loads(stored)
            except json.JSONDecodeError:
                why_join_raw = stored

    sync_client_roles_from_preferences(
        user_id,
        why_join_raw if isinstance(why_join_raw, list) else None,
        is_agent=bool(getattr(u, "is_agent", False)),
    )

    ensure_public_profile_slug(u)
    u.has_preferences = True
    db.session.commit()
    from app.services.aggregation.preferences_aggregation import get_preferences_dict_optional

    return get_preferences_dict_optional(user_id) or {}
