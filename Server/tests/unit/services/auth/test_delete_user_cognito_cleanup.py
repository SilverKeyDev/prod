"""Tests for Cognito cleanup during user deletion."""

from unittest.mock import MagicMock, patch

from app.services.auth.user.delete_user_external_cleanup import _delete_cognito_user


def test_delete_cognito_user_skips_without_identity() -> None:
    assert _delete_cognito_user(email=None, cognito_id=None) == {
        "skipped": True,
        "reason": "no_cognito_identity",
    }


def test_delete_cognito_user_calls_admin_delete_with_email() -> None:
    mock_service = MagicMock()
    mock_service.user_pool_id = "us-east-2_example"
    mock_service.admin_delete_user.return_value = {"success": True}

    with patch(
        "app.services.auth.core.cognito_service.AWS_COGNITO_service",
        mock_service,
    ):
        result = _delete_cognito_user(
            email="user@example.com",
            cognito_id="sub-123",
        )

    mock_service.admin_delete_user.assert_called_once_with("user@example.com")
    assert result == {"deleted": True, "already_absent": False, "error": None}


def test_delete_cognito_user_skips_when_pool_not_configured() -> None:
    mock_service = MagicMock()
    mock_service.user_pool_id = ""

    with patch(
        "app.services.auth.core.cognito_service.AWS_COGNITO_service",
        mock_service,
    ):
        result = _delete_cognito_user(
            email="user@example.com",
            cognito_id="sub-123",
        )

    mock_service.admin_delete_user.assert_not_called()
    assert result == {"skipped": True, "reason": "cognito_not_configured"}
