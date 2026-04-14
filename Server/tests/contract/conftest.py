"""
Fixtures for OpenAPI contract tests (response shapes vs generated Pydantic models).
"""

from __future__ import annotations

from collections.abc import Generator
from unittest.mock import patch

import pytest
from flask import Flask
from flask.testing import FlaskClient

from app import db
from app.models import User


@pytest.fixture
def contract_user(app: Flask) -> Generator[User, None, None]:
    """Persisted user used when routes call get_current_user() under patch."""
    with app.app_context():
        user = User(
            email="openapi-contract@example.com",
            name="OpenAPI Contract User",
            is_active=True,
            is_agent=False,
            cognito_id="contract-cognito-sub",
        )
        db.session.add(user)
        db.session.commit()
        uid = user.id
        yield user
        stale = db.session.get(User, uid)
        if stale is not None:
            db.session.delete(stale)
            db.session.commit()


@pytest.fixture
def authenticated_client(
    app: Flask, client: FlaskClient, contract_user: User
) -> Generator[FlaskClient, None, None]:
    """
    Test client with get_current_user patched to return contract_user.

    Patches both import sites used by user routes and agent search.
    """
    uid = contract_user.id

    def _current_user() -> User | None:
        return db.session.get(User, uid)

    with (
        patch(
            "app.utils.common_patterns.get_current_user",
            side_effect=_current_user,
        ),
        patch(
            "app.routes.agent.handlers.search.get_current_user",
            side_effect=_current_user,
        ),
    ):
        yield client
