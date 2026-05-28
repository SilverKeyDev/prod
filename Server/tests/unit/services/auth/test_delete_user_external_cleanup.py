"""Tests for external resource cleanup during user deletion."""

from unittest.mock import MagicMock, patch

from app.services.auth.user.delete_user_external_cleanup import (
    USER_S3_PREFIX_TEMPLATES,
    cleanup_external_resources_for_user,
)


def test_cleanup_calls_cognito_google_docusign_s3_and_plaid() -> None:
    user_id = "user-abc-123"
    with (
        patch(
            "app.services.auth.user.delete_user_external_cleanup._delete_cognito_user",
            return_value={"deleted": True},
        ) as mock_cognito,
        patch(
            "app.services.auth.user.delete_user_external_cleanup._revoke_google_calendar_oauth",
            return_value=True,
        ) as mock_google,
        patch(
            "app.services.auth.user.delete_user_external_cleanup._revoke_docusign_oauth",
            return_value=True,
        ) as mock_docusign,
        patch(
            "app.services.auth.user.delete_user_external_cleanup._disconnect_plaid",
            return_value={"items_removed": 1, "rows_deleted": 2},
        ) as mock_plaid,
        patch(
            "app.services.auth.user.delete_user_external_cleanup._delete_user_s3_objects",
            return_value={"prefix_deleted": 3, "keys_deleted": 1},
        ) as mock_s3,
    ):
        summary = cleanup_external_resources_for_user(
            user_id,
            extra_s3_keys=["documents/user-abc-123/file.pdf"],
            email="user@example.com",
            cognito_id="cognito-sub-123",
        )

    mock_cognito.assert_called_once_with(
        email="user@example.com",
        cognito_id="cognito-sub-123",
    )
    mock_google.assert_called_once_with(user_id)
    mock_docusign.assert_called_once_with(user_id)
    mock_plaid.assert_called_once_with(user_id)
    mock_s3.assert_called_once_with(
        user_id,
        ["documents/user-abc-123/file.pdf"],
    )
    assert summary["cognito"]["deleted"] is True
    assert summary["google_revoked"] is True
    assert summary["docusign_disconnected"] is True
    assert summary["plaid"]["items_removed"] == 1
    assert summary["s3"]["prefix_deleted"] == 3


def test_cleanup_skips_empty_user_id() -> None:
    assert cleanup_external_resources_for_user("") == {"skipped": True}
    assert cleanup_external_resources_for_user("   ") == {"skipped": True}


def test_user_s3_prefix_templates_cover_known_layouts() -> None:
    user_id = "uuid-1"
    prefixes = [t.format(user_id=user_id) for t in USER_S3_PREFIX_TEMPLATES]
    assert f"{user_id}/" in prefixes
    assert f"documents/{user_id}/" in prefixes
    assert f"images/{user_id}/" in prefixes
    assert f"profile_pictures/{user_id}/" in prefixes


def test_delete_user_s3_deduplicates_extra_keys() -> None:
    mock_s3 = MagicMock()
    mock_s3._ensure_s3_client.return_value = True
    mock_s3.delete_objects_under_prefix.return_value = 0
    mock_s3.delete_pdf.return_value = True

    with patch(
        "app.services.documents.s3_service.s3_service",
        mock_s3,
    ):
        from app.services.auth.user.delete_user_external_cleanup import (
            _delete_user_s3_objects,
        )

        stats = _delete_user_s3_objects(
            "uid-1",
            ["same/key.pdf", "same/key.pdf", "other/key.pdf"],
        )

    assert mock_s3.delete_pdf.call_count == 2
    assert stats["keys_deleted"] == 2
