"""Build public (unauthenticated) agent profile payloads for shareable URLs."""

from __future__ import annotations

import json
from typing import Any

from pydantic import EmailStr, TypeAdapter

from app.dtos.user import _profile_picture_content_type, _try_presigned_profile_picture_url
from app.models import User, UserAgentProfile
from app.schemas.generated import PublicAgentProfile
from app.utils.db.orm_lookup import get_model
from logger import LOG_CATEGORIES, log


def _parse_json_array(value: str | None) -> list[str]:
    if not value:
        return []
    try:
        parsed = json.loads(value)
        if not isinstance(parsed, list):
            return []
        out: list[str] = []
        for x in parsed:
            if isinstance(x, str):
                out.append(x)
            elif x is not None:
                out.append(str(x))
        return out
    except (json.JSONDecodeError, TypeError):
        return []


def _parse_json_list_of_dicts(value: str | None) -> list[dict[str, Any]]:
    if not value:
        return []
    try:
        parsed = json.loads(value)
        if not isinstance(parsed, list):
            return []
        return [x for x in parsed if isinstance(x, dict)]
    except (json.JSONDecodeError, TypeError):
        return []


def _parse_social_links_str_map(value: str | None) -> dict[str, str] | None:
    if not value:
        return None
    try:
        parsed = json.loads(value)
        if not isinstance(parsed, dict):
            return None
        out = {str(k): str(v) for k, v in parsed.items() if v is not None}
        return out or None
    except (json.JSONDecodeError, TypeError):
        return None


def _try_presigned_headshot_url(raw: str | None) -> str | None:
    if not raw or not str(raw).strip():
        return None
    s = str(raw).strip()
    lower = s.lower()
    if lower.startswith("http://") or lower.startswith("https://"):
        return s
    from app.services.documents import s3_service

    if not s3_service or not s3_service.s3_client:
        return None
    try:
        content_type = _profile_picture_content_type(s)
        return s3_service.generate_view_url(s, content_type=content_type)
    except Exception as e:
        log.warn(
            LOG_CATEGORIES["HTTP"],
            "Professional headshot URL generation failed",
            {"error": str(e)},
        )
        return None


def _nullable_str_list(items: list[str]) -> list[str] | None:
    return items if items else None


def _nullable_dict_list(items: list[dict[str, Any]]) -> list[dict[str, Any]] | None:
    return items if items else None


def _optional_brokerage_email(raw: str | None) -> str | None:
    if not raw or not str(raw).strip():
        return None
    candidate = str(raw).strip()
    try:
        TypeAdapter(EmailStr).validate_python(candidate)
    except Exception:
        return None
    return candidate


def build_public_agent_profile(user_id: str) -> PublicAgentProfile | None:
    """Return validated public profile or None if user is missing, not an agent, or inactive."""
    if not user_id or not str(user_id).strip():
        return None
    user = get_model(User, str(user_id).strip())
    if user is None:
        return None
    is_active = user.is_active if user.is_active is not None else True
    if not is_active or not bool(getattr(user, "is_agent", False)):
        return None

    agent_row = UserAgentProfile.query.filter_by(user_id=user.id).first()

    profile_url = _try_presigned_profile_picture_url(user)

    mls_affiliations: list[dict[str, Any]] | None = None
    social_links: dict[str, str] | None = None
    agent_bio = None
    brokerage_name = None
    brokerage_bic_name = None
    brokerage_address = None
    brokerage_email = None
    brokerage_phone = None
    professional_headshot_url = None
    primary_service_zips = None
    specialties = None
    licensed_states = None
    license_types = None
    license_numbers = None
    license_expiration_dates = None

    public_profile_slug = getattr(user, "public_profile_slug", None) or None

    if agent_row is not None:
        agent_bio = agent_row.agent_bio
        brokerage_name = agent_row.brokerage_name
        brokerage_bic_name = agent_row.brokerage_bic_name
        brokerage_address = agent_row.brokerage_address
        brokerage_email = _optional_brokerage_email(agent_row.brokerage_email)
        brokerage_phone = agent_row.brokerage_phone
        professional_headshot_url = _try_presigned_headshot_url(agent_row.professional_headshot_url)
        primary_service_zips = _nullable_str_list(_parse_json_array(agent_row.primary_service_zips))
        specialties = _nullable_str_list(_parse_json_array(agent_row.specialties))
        licensed_states = _nullable_str_list(_parse_json_array(agent_row.licensed_states))
        license_types = _nullable_str_list(_parse_json_array(agent_row.license_types))
        license_numbers = _nullable_str_list(_parse_json_array(agent_row.license_numbers))
        license_expiration_dates = _nullable_str_list(
            _parse_json_array(agent_row.license_expiration_dates)
        )
        mls_affiliations = _nullable_dict_list(
            _parse_json_list_of_dicts(agent_row.mls_affiliations)
        )
        social_links = _parse_social_links_str_map(agent_row.social_links)

    return PublicAgentProfile(
        id=user.id,
        name=user.name or "",
        email=user.email,
        phone=user.phone,
        mls_id=user.mls_id,
        brokerage=user.brokerage,
        public_profile_slug=public_profile_slug,
        profile_picture_url=profile_url,
        agent_bio=agent_bio,
        brokerage_name=brokerage_name,
        brokerage_bic_name=brokerage_bic_name,
        brokerage_address=brokerage_address,
        brokerage_email=brokerage_email,
        brokerage_phone=brokerage_phone,
        professional_headshot_url=professional_headshot_url,
        primary_service_zips=primary_service_zips,
        specialties=specialties,
        licensed_states=licensed_states,
        license_types=license_types,
        license_numbers=license_numbers,
        license_expiration_dates=license_expiration_dates,
        mls_affiliations=mls_affiliations,
        social_links=social_links,
    )
