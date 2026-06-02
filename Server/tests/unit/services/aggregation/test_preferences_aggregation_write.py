"""Unit tests for preferences aggregation write pipeline."""

from __future__ import annotations

import uuid

import pytest
from flask import Flask

from app import db
from app.models import User, UserAgentProfile, UserFinancials, UserSearchIntent
from app.services.aggregation.preferences_aggregation_write import write_preferences_from_payload


def _create_user(*, is_agent: bool = False) -> User:
    user = User(
        cognito_id=f"cognito-{uuid.uuid4().hex[:8]}",
        email=f"prefs-{uuid.uuid4().hex[:8]}@example.com",
        name="Prefs User",
        is_active=True,
        is_agent=is_agent,
    )
    db.session.add(user)
    db.session.flush()
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

        refreshed = User.query.filter_by(id=user_id).first()
        fin = UserFinancials.query.filter_by(user_id=user_id).first()
        intent = UserSearchIntent.query.filter_by(user_id=user_id).first()

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
        user = _create_user(is_agent=True)
        user_id = str(user.id)
        db.session.commit()

        write_preferences_from_payload(
            user_id,
            {
                "is_agent": True,
                "agent_bio": "Experienced buyer agent",
                "home_budget_max": 600000,
            },
            user=user,
        )

        profile = UserAgentProfile.query.filter_by(user_id=user_id).first()
        assert profile is not None
        assert profile.agent_bio == "Experienced buyer agent"


def test_write_preferences_removes_agent_profile_when_no_longer_agent(
    app: Flask, db_session
) -> None:
    with app.app_context():
        user = _create_user(is_agent=True)
        user_id = str(user.id)
        db.session.add(UserAgentProfile(user_id=user_id, agent_bio="Old bio"))
        db.session.commit()

        user.is_agent = False
        write_preferences_from_payload(
            user_id,
            {"home_budget_max": 400000},
            user=user,
        )

        profile = UserAgentProfile.query.filter_by(user_id=user_id).first()
        assert profile is None
