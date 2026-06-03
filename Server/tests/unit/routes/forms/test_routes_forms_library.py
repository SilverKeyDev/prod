"""Route tests for GET /api/v1/forms/library."""

from __future__ import annotations

import uuid
from unittest.mock import patch

import pytest
from flask import Flask

from app import db
from app.models import User


def _user(db_session, *, is_agent: bool) -> User:
    user = User(
        cognito_id=f"cognito-{uuid.uuid4().hex[:8]}",
        email=f"forms-{uuid.uuid4().hex[:8]}@example.com",
        name="Forms User",
        is_active=True,
        is_agent=is_agent,
    )
    db.session.add(user)
    db.session.commit()
    return user


@pytest.mark.api
def test_forms_library_requires_auth(client, app: Flask, db_session) -> None:
    resp = client.get("/api/v1/forms/library")
    assert resp.status_code == 401


@pytest.mark.api
def test_forms_library_forbidden_for_non_agent(client, app: Flask, db_session) -> None:
    with app.app_context():
        user = _user(db_session, is_agent=False)
        with patch("app.services.auth.get_current_user", return_value=user):
            resp = client.get(
                "/api/v1/forms/library",
                headers={"Authorization": "Bearer mock_token"},
            )
    assert resp.status_code == 403
    body = resp.get_json()
    assert body is not None
    assert body.get("success") is False


@pytest.mark.api
def test_forms_library_returns_empty_categories_for_agent(client, app: Flask, db_session) -> None:
    with app.app_context():
        user = _user(db_session, is_agent=True)
        with patch("app.services.auth.get_current_user", return_value=user):
            resp = client.get(
                "/api/v1/forms/library",
                headers={"Authorization": "Bearer mock_token"},
            )
    assert resp.status_code == 200
    body = resp.get_json()
    assert body is not None
    assert body.get("success") is True
    assert body.get("categories") == []
