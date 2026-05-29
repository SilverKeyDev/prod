"""
Pytest configuration and shared fixtures for Server tests.

No production .env or secrets from .env.example are required. tests/conftest.py sets
minimal stubs; external APIs are mocked via fixtures below. validate_and_raise() is
skipped when TESTING=true (see app/utils/testing_mode.py).
"""

import os
from collections.abc import Generator
from contextlib import ExitStack
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import MagicMock, Mock, patch

import pytest
from flask import Flask
from flask_sqlalchemy import SQLAlchemy


def _ensure_coverage_data_dir() -> None:
    """Write coverage SQLite under Server/coverage/ (see pyproject [tool.coverage.run])."""
    cov_dir = Path(__file__).resolve().parent.parent / "coverage"
    cov_dir.mkdir(parents=True, exist_ok=True)
    os.environ.setdefault("COVERAGE_FILE", str(cov_dir / ".coverage"))


def _apply_minimal_test_env() -> None:
    """Stub env for pytest/CI only — not real credentials."""
    os.environ["TESTING"] = "true"
    os.environ.setdefault("APP_LOG_LEVEL", "ERROR")
    os.environ["DATABASE_URL"] = "sqlite:///:memory:"
    os.environ.setdefault("JWT_SIGNING_SECRET", "test-jwt-signing-secret-not-for-production")
    # Auth modules read Cognito ids at import time; values are never sent to AWS in unit tests.
    os.environ.setdefault("AWS_COGNITO_USER_POOL_ID", "us-east-2_pytestStubPoolId")
    os.environ.setdefault("AWS_COGNITO_CLIENT_ID", "pytest-stub-cognito-client-id")


_ensure_coverage_data_dir()
_apply_minimal_test_env()

pytest_plugins = ["tests.fixtures.google_calendar"]


@pytest.fixture
def app() -> Generator[Flask, None, None]:
    """Create test Flask app"""
    from app import create_app

    test_app = create_app()
    test_app.config.update(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
            "WTF_CSRF_ENABLED": False,
            "SQLALCHEMY_ENGINE_OPTIONS": {
                "pool_pre_ping": True,
                "pool_recycle": 300,
            },
        }
    )

    with test_app.app_context():
        from app import db

        db.create_all()
        yield test_app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app: Flask):
    """Create test client"""
    return app.test_client()


@pytest.fixture
def db_session(app: Flask) -> Generator[SQLAlchemy, None, None]:
    """Create database session"""
    from app import db

    with app.app_context():
        yield db
        db.session.rollback()


_COGNITO_IMPORT_PATHS = (
    # Flows bind `AWS_COGNITO_service` at import time; patch each alias to the same mock.
    "app.services.auth.core.cognito_service.AWS_COGNITO_service",
    "app.services.auth.core.AWS_COGNITO_service",
    "app.services.auth.flows.login.AWS_COGNITO_service",
    "app.services.auth.flows.signup.AWS_COGNITO_service",
    "app.services.auth.flows.verification.AWS_COGNITO_service",
    "app.services.auth.flows.refresh_handlers.AWS_COGNITO_service",
    "app.services.auth.flows.password_reset.AWS_COGNITO_service",
    "app.routes.auth.handlers.password.forgot.AWS_COGNITO_service",
    "app.routes.auth.handlers.password.reset.AWS_COGNITO_service",
)


@pytest.fixture
def mock_cognito_service():
    """Mock AWS Cognito service (all import sites that bind the singleton)."""
    mock = MagicMock()
    mock.client.exceptions.UserNotFoundException = type("UserNotFoundException", (Exception,), {})
    mock.client.exceptions.NotAuthorizedException = type("NotAuthorizedException", (Exception,), {})
    mock.sign_in = Mock(
        return_value={
            "success": True,
            "tokens": {
                "IdToken": "mock_id_token",
                "AccessToken": "mock_access_token",
                "RefreshToken": "mock_refresh_token",
            },
        }
    )
    mock.sign_up = Mock(return_value={"success": True, "user_sub": "mock-user-sub-123"})
    mock.refresh_tokens = Mock(
        return_value={
            "success": True,
            "tokens": {
                "IdToken": "new_id_token",
                "AccessToken": "new_access_token",
            },
        }
    )
    mock.refresh_access_token = Mock(
        return_value={
            "success": True,
            "tokens": {
                "IdToken": "new_id_token",
                "AccessToken": "new_access_token",
            },
        }
    )
    mock.initiate_auth = Mock(return_value={"success": True, "session": "mock-session"})
    mock.forgot_password = Mock(return_value={"success": True})
    mock.confirm_forgot_password = Mock(return_value={"success": True})
    with ExitStack() as stack:
        for path in _COGNITO_IMPORT_PATHS:
            stack.enter_context(patch(path, mock))
        yield mock


_DOCUSIGN_CLIENT_IMPORT_PATHS = (
    "app.services.docusign.core.client.DocusignClient",
    "app.services.docusign.agreements.signature_flow.DocusignClient",
    "app.services.docusign.envelopes.signing.DocusignClient",
    "app.services.docusign.templates.sync.DocusignClient",
    "app.services.docusign.envelopes.recipient_delivery.DocusignClient",
)


@pytest.fixture
def mock_docusign_client():
    """Mock DocuSign client at every module that binds ``DocusignClient`` at import time."""
    client_instance = Mock()
    client_instance.create_envelope = Mock(
        return_value={"envelope_id": "mock-envelope-123", "status": "created"}
    )
    client_instance.get_envelope = Mock(
        return_value={"status": "sent", "envelopeId": "mock-envelope-123"}
    )
    client_instance.get_envelope_status = Mock(
        return_value={"status": "sent", "envelope_id": "mock-envelope-123"}
    )
    client_instance.void_envelope = Mock(return_value={"status": "voided"})
    client_instance.get_signing_url = Mock(
        return_value="https://demo.docusign.net/Signing/StartInSession.aspx?..."
    )
    client_instance.create_recipient_view = Mock(
        return_value="https://demo.docusign.net/Signing/StartInSession.aspx?..."
    )
    client_instance.get_sender_view = Mock(
        return_value="https://demo.docusign.net/Sender/StartInSession.aspx?..."
    )
    client_instance.list_templates = Mock(
        return_value=[
            {
                "templateId": "template-123",
                "name": "Purchase Agreement",
                "description": "Standard purchase agreement",
            }
        ]
    )
    with ExitStack() as stack:
        first_patch = None
        for path in _DOCUSIGN_CLIENT_IMPORT_PATHS:
            p = stack.enter_context(patch(path))
            p.return_value = client_instance
            if first_patch is None:
                first_patch = p
        yield first_patch


@pytest.fixture
def mock_celery_task():
    """Mock Celery task"""
    with patch("celery.Task.apply_async") as mock_task:
        mock_task.return_value = Mock(id="task-123")
        yield mock_task


@pytest.fixture
def sample_user():
    """Create sample user data"""
    return {
        "id": "user-123",
        "cognito_id": "cognito-sub-123",
        "email": "test@example.com",
        "name": "Test User",
        "phone": "+1234567890",
        "is_active": True,
    }


@pytest.fixture
def sample_agreement():
    """Create sample agreement data"""
    return {
        "id": "agreement-123",
        "agent_id": "agent-456",
        "buyer_id": "buyer-789",
        "title": "Purchase Agreement",
        "agreement_type": "offer",
        "status": "draft",
        "property_address": "123 Main St, City, State 12345",
        "description": "Standard purchase agreement",
    }


@pytest.fixture
def sample_preferences():
    """Create sample user preferences"""
    return {
        "price_min": 200000,
        "price_max": 400000,
        "preferred_bedrooms": 3,
        "preferred_bedrooms_min": 2,
        "preferred_bathrooms": 2,
        "preferred_bathrooms_min": 1.5,
        "preferred_sqft_min": 1500,
        "preferred_sqft_max": 3000,
        "preferred_housing_type": "house,townhome",
        "preferred_neighborhoods": ["Downtown", "Suburbs"],
        "max_commute_time": 30,
    }


@pytest.fixture
def sample_property():
    """Create sample property data"""
    return {
        "ListingId": "prop-123",
        "ListPrice": 350000,
        "BedroomsTotal": 3,
        "BathroomsTotalInteger": 2,
        "LivingArea": 2000,
        "PropertyType": "Residential",
        "PropertySubType": "Single Family Residence",
        "UnparsedAddress": "456 Oak Ave, City, State 12345",
        "City": "City",
        "StateOrProvince": "State",
        "PostalCode": "12345",
        "Latitude": 40.7128,
        "Longitude": -74.006,
        "DaysOnMarket": 15,
        "YearBuilt": 2010,
    }


@pytest.fixture
def mock_jwt_decode():
    """Mock JWT token decoding (patch every module that binds decode_cognito_token)."""
    mock = MagicMock(
        return_value={
            "sub": "cognito-sub-123",
            "email": "test@example.com",
            "name": "Test User",
            "exp": (datetime.now(timezone.utc) + timedelta(hours=8)).timestamp(),
        }
    )
    _DECODE_PATHS = (
        "app.services.auth.utils.token_creation.decode_cognito_token",
        "app.services.auth.flows.login.decode_cognito_token",
        "app.services.auth.flows.verification.decode_cognito_token",
        "app.services.auth.flows.refresh_handlers.decode_cognito_token",
    )
    with ExitStack() as stack:
        for path in _DECODE_PATHS:
            stack.enter_context(patch(path, mock))
        yield mock
