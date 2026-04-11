"""Agent profile preference writes."""

import json
from typing import Any

from app.models import UserAgentProfile


def write_agent_profile_from_payload(agent: UserAgentProfile, data: dict[str, Any]) -> None:
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
