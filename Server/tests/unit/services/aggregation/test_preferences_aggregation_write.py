"""Unit tests for preferences aggregation write pipeline."""

from __future__ import annotations

import json
import uuid

import pytest
from flask import Flask
from sqlalchemy import select

from app import db
from app.models import User, UserAgentProfile, UserFinancials, UserSearchIntent
from app.services.aggregation.preferences_aggregation_write import write_preferences_from_payload
from app.services.auth.user_role_helpers import remove_user_role
from tests.support.user_roles import seed_user_roles


def _create_user(*, roles: tuple[str, ...] = ()) -> User:
    user = User(
        cognito_id=f"cognito-{uuid.uuid4().hex[:8]}",
        email=f"prefs-{uuid.uuid4().hex[:8]}@example.com",
        name="Prefs User",
        is_active=True,
    )
    db.session.add(user)
    db.session.flush()
    seed_user_roles(str(user.id), *roles)
    return user


def test_write_preferences_sets_has_preferences_and_financials(app: Flask, db_session) -> None:
    with app.app_context():
        user = _create_user()
        user_id = str(user.id)
        db.session.commit()

        result = write_preferences_from_payload(
            user_id,
            {
                "home_budget_min": 300000,
                "home_budget_max": 500000,
                "preferred_bedrooms_min": 3,
                "preferred_bedrooms_max": 4,
            },
            user=user,
        )

        refreshed = db.session.scalar(select(User).where(User.id == user_id))
        fin = db.session.scalar(select(UserFinancials).where(UserFinancials.user_id == user_id))
        intent = db.session.scalar(
            select(UserSearchIntent).where(UserSearchIntent.user_id == user_id)
        )

        assert refreshed.has_preferences is True
        assert fin is not None
        assert fin.home_budget_min == 300000
        assert fin.home_budget_max == 500000
        assert intent is not None
        assert intent.preferred_bedrooms_min == 3
        assert intent.preferred_bedrooms_max == 4
        assert isinstance(result, dict)


def test_write_preferences_rejects_oversized_payload(app: Flask, db_session) -> None:
    with app.app_context():
        user = _create_user()
        user_id = str(user.id)
        db.session.commit()

        with pytest.raises(ValueError, match="too many keys"):
            write_preferences_from_payload(user_id, {f"key_{i}": i for i in range(201)}, user=user)


def test_write_preferences_creates_agent_profile_when_agent(app: Flask, db_session) -> None:
    with app.app_context():
        user = _create_user(roles=("agent",))
        user_id = str(user.id)
        db.session.commit()

        write_preferences_from_payload(
            user_id,
            {
                "primary_onboarding_role": "agent",
                "agent_bio": "Experienced buyer agent",
                "home_budget_max": 600000,
            },
            user=user,
        )

        profile = db.session.scalar(
            select(UserAgentProfile).where(UserAgentProfile.user_id == user_id)
        )
        assert profile is not None
        assert profile.agent_bio == "Experienced buyer agent"


def test_write_preferences_normalizes_agent_testimonials(app: Flask, db_session) -> None:
    with app.app_context():
        user = _create_user(roles=("agent",))
        user_id = str(user.id)
        db.session.commit()

        write_preferences_from_payload(
            user_id,
            {
                "primary_onboarding_role": "agent",
                "agent_testimonials": [
                    {
                        "author_name": "Jane B.",
                        "quote": "Great agent!",
                        "date": "2026-01-15",
                        "rating": 5,
                    },
                    {"author_name": "  ", "quote": "missing author"},
                    {"author_name": "Sam", "quote": "Solid.", "rating": 9},
                    "not-a-dict",
                ],
            },
            user=user,
        )

        profile = db.session.scalar(
            select(UserAgentProfile).where(UserAgentProfile.user_id == user_id)
        )
        assert profile is not None
        items = json.loads(profile.testimonials)
        assert items == [
            {
                "author_name": "Jane B.",
                "quote": "Great agent!",
                "date": "2026-01-15",
                "rating": 5,
                "source": "custom",
            },
            # Out-of-range rating dropped; source defaults to custom.
            {"author_name": "Sam", "quote": "Solid.", "source": "custom"},
        ]


def test_write_preferences_clears_agent_testimonials_when_no_valid_items(
    app: Flask, db_session
) -> None:
    with app.app_context():
        user = _create_user(roles=("agent",))
        user_id = str(user.id)
        db.session.commit()

        write_preferences_from_payload(
            user_id,
            {
                "primary_onboarding_role": "agent",
                "agent_testimonials": [{"author_name": "", "quote": ""}],
            },
            user=user,
        )

        profile = db.session.scalar(
            select(UserAgentProfile).where(UserAgentProfile.user_id == user_id)
        )
        assert profile is not None
        assert profile.testimonials is None


def test_write_preferences_removes_agent_profile_when_no_longer_agent(
    app: Flask, db_session
) -> None:
    with app.app_context():
        user = _create_user(roles=("agent",))
        user_id = str(user.id)
        db.session.add(UserAgentProfile(user_id=user_id, agent_bio="Old bio"))
        db.session.commit()

        remove_user_role(user_id, "agent")
        db.session.commit()

        write_preferences_from_payload(
            user_id,
            {"home_budget_max": 400000},
            user=user,
        )

        profile = db.session.scalar(
            select(UserAgentProfile).where(UserAgentProfile.user_id == user_id)
        )
        assert profile is None


def test_write_preferences_grants_brokerage_admin_from_primary_role(app: Flask, db_session) -> None:
    with app.app_context():
        user = _create_user()
        user_id = str(user.id)
        db.session.commit()

        write_preferences_from_payload(
            user_id,
            {"primary_onboarding_role": "brokerage", "name": "Broker Lead"},
            user=user,
        )

        refreshed = db.session.scalar(select(User).where(User.id == user_id))
        role_names = {row.role for row in refreshed.user_roles.all()}
        assert "brokerage_admin" in role_names


def test_write_preferences_grants_integration_partner_from_primary_role(
    app: Flask, db_session
) -> None:
    with app.app_context():
        user = _create_user()
        user_id = str(user.id)
        db.session.commit()

        write_preferences_from_payload(
            user_id,
            {"primary_onboarding_role": "integration_partner", "name": "Partner Lead"},
            user=user,
        )

        refreshed = db.session.scalar(select(User).where(User.id == user_id))
        role_names = {row.role for row in refreshed.user_roles.all()}
        assert "integration_partner" in role_names


def test_write_preferences_persists_buyer_sil182_fields(app: Flask, db_session) -> None:
    from app.models import UserCommunicationPrefs, UserDemographics
    from app.services.aggregation.read.preferences_aggregation import get_preferences_dict_optional

    with app.app_context():
        user = _create_user()
        user_id = str(user.id)
        db.session.commit()

        write_preferences_from_payload(
            user_id,
            {
                "primary_onboarding_role": "buyer",
                "pets": "yes",
                "preferred_contact_method": "text",
                "communication_frequency": "weekly",
                "extended_buyer_preferences": {
                    "v": 1,
                    "buyer_about_me": {
                        "moving_with": ["partner"],
                        "pet_types": ["dog"],
                    },
                    "price_financing": {
                        "lender_status": "pre_approved",
                        "lender_name": "Acme Lending",
                        "move_timeline": "asap",
                    },
                },
            },
            user=user,
        )
        db.session.commit()

        comm = db.session.scalar(
            select(UserCommunicationPrefs).where(UserCommunicationPrefs.user_id == user_id)
        )
        demo = db.session.scalar(
            select(UserDemographics).where(UserDemographics.user_id == user_id)
        )
        assert comm is not None
        assert comm.preferred_contact_method == "text"
        assert comm.communication_frequency == "weekly"
        assert demo is not None
        assert demo.pets == "yes"

        prefs = get_preferences_dict_optional(user_id)
        assert prefs is not None
        ext = prefs.get("extended_buyer_preferences") or {}
        assert ext["buyer_about_me"]["moving_with"] == ["partner"]
        assert ext["price_financing"]["lender_name"] == "Acme Lending"


def test_write_preferences_rejects_invalid_preferred_contact_method(app: Flask, db_session) -> None:
    from app.models import UserCommunicationPrefs

    with app.app_context():
        user = _create_user()
        user_id = str(user.id)
        db.session.commit()

        write_preferences_from_payload(
            user_id,
            {"preferred_contact_method": "carrier_pigeon"},
            user=user,
        )
        db.session.commit()

        comm = db.session.scalar(
            select(UserCommunicationPrefs).where(UserCommunicationPrefs.user_id == user_id)
        )
        assert comm is not None
        assert comm.preferred_contact_method is None
