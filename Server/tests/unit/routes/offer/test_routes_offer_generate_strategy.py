"""Route tests for POST /api/v1/offer/generate-strategy."""

from __future__ import annotations

import uuid
from unittest.mock import patch

import pytest
from flask import Flask

from app import db
from app.models import User


def _user(db_session) -> User:
    user = User(
        cognito_id=f"cognito-{uuid.uuid4().hex[:8]}",
        email=f"offer-{uuid.uuid4().hex[:8]}@example.com",
        name="Offer User",
        is_active=True,
    )
    db.session.add(user)
    db.session.commit()
    return user


@pytest.mark.api
def test_generate_strategy_requires_auth(client, app: Flask, db_session) -> None:
    resp = client.post(
        "/api/v1/offer/generate-strategy",
        json={"address": "123 Main St"},
    )
    assert resp.status_code == 401


@pytest.mark.api
def test_generate_strategy_missing_address_returns_400(client, app: Flask, db_session) -> None:
    with app.app_context():
        user = _user(db_session)
        with patch("app.services.auth.get_current_user", return_value=user):
            resp = client.post(
                "/api/v1/offer/generate-strategy",
                headers={"Authorization": "Bearer mock_token"},
                json={"address": ""},
            )
    assert resp.status_code == 400
    body = resp.get_json()
    assert body is not None
    assert body.get("success") is False
    assert body.get("error") == "INVALID_REQUEST"
    assert body.get("message") == "Address is required"


@pytest.mark.api
def test_generate_strategy_delegates_to_service(client, app: Flask, db_session) -> None:
    with app.app_context():
        user = _user(db_session)
        service_body = {
            "success": True,
            "strategy": {"opening_offer_rationale": "test"},
            "property_address": "123 Main St",
        }
        with patch("app.services.auth.get_current_user", return_value=user):
            with patch(
                "app.routes.offer.build_negotiation_strategy_payload",
                return_value=(service_body, 200),
            ) as mock_build:
                resp = client.post(
                    "/api/v1/offer/generate-strategy",
                    headers={"Authorization": "Bearer mock_token"},
                    json={"address": "123 Main St"},
                )
        mock_build.assert_called_once()
        call_kwargs = mock_build.call_args.kwargs
        assert call_kwargs["address"] == "123 Main St"

    assert resp.status_code == 200
    body = resp.get_json()
    assert body is not None
    assert body.get("success") is True
