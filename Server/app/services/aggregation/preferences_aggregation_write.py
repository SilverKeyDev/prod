"""
Write user preferences from API payload to User and related models (façade).
"""

import json
from typing import Any

from sqlalchemy import delete, select

from app import db
from app.models import User, UserAgentProfile
from app.services.auth.user_role_helpers import ensure_user_role, user_is_agent
from app.services.auth.user_roles_sync import (
    primary_onboarding_role_is_agent,
    sync_client_roles_from_preferences,
)
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

    # Agent role: grant from primary_onboarding_role once (immutable after first grant)
    if primary_onboarding_role_is_agent(data) and not user_is_agent(u):
        ensure_user_role(str(u.id), "agent")

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

    # Agent profile (when user has agent role and agent fields present)
    if user_is_agent(u):
        agent = db.session.scalar(
            select(UserAgentProfile).where(UserAgentProfile.user_id == user_id)
        )
        if agent is None:
            agent = UserAgentProfile(user_id=user_id)
            db.session.add(agent)
        write_agent_profile_from_payload(agent, data)
    else:
        # Remove agent profile when user is no longer an agent
        db.session.execute(delete(UserAgentProfile).where(UserAgentProfile.user_id == user_id))

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
        grant_agent_role=user_is_agent(u),
    )

    ensure_public_profile_slug(u)
    u.has_preferences = True
    raw_version = data.get("preferences_version")
    if raw_version is not None and str(raw_version).strip():
        u.preferences_version = str(raw_version).strip()[:10]
    elif not u.preferences_version:
        u.preferences_version = "1.0"
    db.session.commit()
    from app.services.aggregation.preferences_aggregation import get_preferences_dict_optional

    return get_preferences_dict_optional(user_id) or {}
