"""Demographics and communication preference writes."""

import json
from typing import Any

from sqlalchemy import select

from app import db
from app.models import UserCommunicationPrefs, UserDemographics


def write_demographics_from_payload(user_id: str, data: dict[str, Any]) -> UserDemographics:
    """Write UserDemographics from preferences payload."""
    demo = db.session.scalar(select(UserDemographics).where(UserDemographics.user_id == user_id))
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
    return demo


PREFERRED_CONTACT_METHOD_VALUES = frozenset({"text", "call", "email"})


def _normalize_optional_slug(value: object | None, allowed: frozenset[str]) -> str | None:
    if value is None:
        return None
    slug = str(value).strip()
    if not slug:
        return None
    return slug if slug in allowed else None


def write_communication_prefs_from_payload(
    user_id: str, data: dict[str, Any]
) -> UserCommunicationPrefs:
    """Write UserCommunicationPrefs from preferences payload."""
    comm = db.session.scalar(
        select(UserCommunicationPrefs).where(UserCommunicationPrefs.user_id == user_id)
    )
    if comm is None:
        comm = UserCommunicationPrefs(user_id=user_id)
        db.session.add(comm)
    if "communication_frequency" in data:
        raw = data["communication_frequency"]
        comm.communication_frequency = str(raw).strip() or None if raw is not None else None
    if "preferred_contact_method" in data:
        comm.preferred_contact_method = _normalize_optional_slug(
            data["preferred_contact_method"], PREFERRED_CONTACT_METHOD_VALUES
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
    return comm
