"""
Unit tests for calendar event permission checks.
Tests permission validation for event creation and listing.
"""

from unittest.mock import patch

import pytest

from app.services.calendar.events.creation import get_client_events_permission_error


@pytest.mark.unit
class TestEventPermissions:
    """Test permission checks for calendar event operations"""

    @patch("app.services.calendar.permissions.check_permission")
    def test_client_has_permission(self, mock_check_permission):
        """Should return None when client has calendar_app_created permission"""
        client_id = "client-123"

        # Mock client has permission
        mock_check_permission.return_value = True

        result = get_client_events_permission_error(client_id)

        assert result is None
        mock_check_permission.assert_called_once_with(client_id, "calendar_app_created")

    @patch("app.services.calendar.permissions.check_permission")
    @patch("app.services.auth.tokens.tokens_get")
    @patch("app.services.calendar.permissions.constants.permissions")
    def test_client_missing_permission_with_connection(
        self, mock_permissions, mock_tokens_get, mock_check_permission
    ):
        """Should return detailed error when client is connected but missing permission"""
        client_id = "client-456"

        # Mock client doesn't have permission but has connection
        mock_check_permission.return_value = False
        mock_tokens_get.return_value = {"access_token": "mock_token"}
        mock_permissions.get.return_value = {
            "description": "Access calendar events",
        }

        result = get_client_events_permission_error(client_id)

        assert result is not None
        assert result["success"] is False
        assert result["error"] == "client_permission_required"
        assert "hasn't granted" in result["message"]
        assert "reconnect their Google Calendar account" in result["message"]
        assert result["required_permission"] == "calendar_app_created"
        assert result["client_id"] == client_id
        assert result["client_has_connection"] is True

    @patch("app.services.calendar.permissions.check_permission")
    @patch("app.services.auth.tokens.tokens_get")
    @patch("app.services.calendar.permissions.constants.permissions")
    def test_client_no_connection(self, mock_permissions, mock_tokens_get, mock_check_permission):
        """Should return 'hasn't connected' error when client has no calendar connection"""
        client_id = "client-789"

        # Mock client doesn't have permission and no connection
        mock_check_permission.return_value = False
        mock_tokens_get.return_value = None
        mock_permissions.get.return_value = {
            "description": "Access calendar events",
        }

        result = get_client_events_permission_error(client_id)

        assert result is not None
        assert result["success"] is False
        assert result["error"] == "client_permission_required"
        assert "hasn't connected their Google Calendar account yet" in result["message"]
        assert "connect their Google Calendar" in result["message"]
        assert result["required_permission"] == "calendar_app_created"
        assert result["client_id"] == client_id
        assert result["client_has_connection"] is False

    @patch("app.services.calendar.permissions.check_permission")
    @patch("app.services.auth.tokens.tokens_get")
    @patch("app.services.calendar.permissions.constants.permissions")
    def test_permission_description_in_error_message(
        self, mock_permissions, mock_tokens_get, mock_check_permission
    ):
        """Error message should include the permission description"""
        client_id = "client-123"
        permission_description = "Create and manage calendar events"

        mock_check_permission.return_value = False
        mock_tokens_get.return_value = {"access_token": "mock_token"}
        mock_permissions.get.return_value = {
            "description": permission_description,
        }

        result = get_client_events_permission_error(client_id)

        assert result is not None
        assert permission_description in result["message"]

    @patch("app.services.calendar.permissions.check_permission")
    @patch("app.services.auth.tokens.tokens_get")
    @patch("app.services.calendar.permissions.constants.permissions")
    def test_default_permission_description(
        self, mock_permissions, mock_tokens_get, mock_check_permission
    ):
        """Should use default description if permission data doesn't have one"""
        client_id = "client-123"

        mock_check_permission.return_value = False
        mock_tokens_get.return_value = None
        mock_permissions.get.return_value = {}  # No description

        result = get_client_events_permission_error(client_id)

        assert result is not None
        assert "Access calendar events" in result["message"]  # Default description

    @patch("app.services.calendar.permissions.check_permission")
    @patch("app.services.auth.tokens.tokens_get")
    @patch("app.services.calendar.permissions.constants.permissions")
    def test_error_structure_complete(
        self, mock_permissions, mock_tokens_get, mock_check_permission
    ):
        """Error response should have all required fields"""
        client_id = "client-123"

        mock_check_permission.return_value = False
        mock_tokens_get.return_value = None
        mock_permissions.get.return_value = {"description": "Test permission"}

        result = get_client_events_permission_error(client_id)

        assert result is not None
        # Verify all required fields are present
        assert "success" in result
        assert "error" in result
        assert "message" in result
        assert "required_permission" in result
        assert "client_id" in result
        assert "client_has_connection" in result

        # Verify field values
        assert result["success"] is False
        assert result["error"] == "client_permission_required"
        assert isinstance(result["message"], str)
        assert result["required_permission"] == "calendar_app_created"
        assert result["client_id"] == client_id
        assert isinstance(result["client_has_connection"], bool)

    @patch("app.services.calendar.permissions.check_permission")
    @patch("app.services.auth.tokens.tokens_get")
    @patch("app.services.calendar.permissions.constants.permissions")
    def test_message_actionable_with_connection(
        self, mock_permissions, mock_tokens_get, mock_check_permission
    ):
        """Error message should guide user to reconnect when they have a connection"""
        client_id = "client-123"

        mock_check_permission.return_value = False
        mock_tokens_get.return_value = {"access_token": "mock_token"}
        mock_permissions.get.return_value = {"description": "Access events"}

        result = get_client_events_permission_error(client_id)

        assert result is not None
        message = result["message"]
        # Should mention reconnecting
        assert "reconnect" in message.lower()
        # Should mention granting permissions
        assert "grant" in message.lower()

    @patch("app.services.calendar.permissions.check_permission")
    @patch("app.services.auth.tokens.tokens_get")
    @patch("app.services.calendar.permissions.constants.permissions")
    def test_message_actionable_without_connection(
        self, mock_permissions, mock_tokens_get, mock_check_permission
    ):
        """Error message should guide user to connect when they have no connection"""
        client_id = "client-123"

        mock_check_permission.return_value = False
        mock_tokens_get.return_value = None
        mock_permissions.get.return_value = {"description": "Access events"}

        result = get_client_events_permission_error(client_id)

        assert result is not None
        message = result["message"]
        # Should mention connecting
        assert "connect" in message.lower()
        # Should mention granting permissions
        assert "grant" in message.lower()

    @patch("app.services.calendar.permissions.check_permission")
    @patch("app.services.auth.tokens.tokens_get")
    @patch("app.services.calendar.permissions.constants.permissions")
    def test_multiple_clients_separate_errors(
        self, mock_permissions, mock_tokens_get, mock_check_permission
    ):
        """Each client should get their own error response"""
        client_id_1 = "client-123"
        client_id_2 = "client-456"

        mock_check_permission.return_value = False
        mock_permissions.get.return_value = {"description": "Access events"}

        # Client 1 has connection
        mock_tokens_get.return_value = {"access_token": "token"}
        result_1 = get_client_events_permission_error(client_id_1)

        # Client 2 doesn't have connection
        mock_tokens_get.return_value = None
        result_2 = get_client_events_permission_error(client_id_2)

        # Both should have errors but with different client_has_connection values
        assert result_1 is not None
        assert result_2 is not None
        assert result_1["client_id"] == client_id_1
        assert result_2["client_id"] == client_id_2
        assert result_1["client_has_connection"] is True
        assert result_2["client_has_connection"] is False

    @patch("app.services.calendar.permissions.check_permission")
    @patch("app.services.auth.tokens.tokens_get")
    @patch("app.services.calendar.permissions.constants.permissions")
    def test_permission_check_called_first(
        self, mock_permissions, mock_tokens_get, mock_check_permission
    ):
        """Should check permission before checking token status"""
        client_id = "client-123"

        mock_check_permission.return_value = True
        mock_tokens_get.return_value = None

        result = get_client_events_permission_error(client_id)

        # Should return None immediately after permission check
        assert result is None
        # Should not check tokens if permission exists
        mock_tokens_get.assert_not_called()

    @patch("app.services.calendar.permissions.check_permission")
    @patch("app.services.auth.tokens.tokens_get")
    @patch("app.services.calendar.permissions.constants.permissions")
    def test_tokens_get_called_when_permission_missing(
        self, mock_permissions, mock_tokens_get, mock_check_permission
    ):
        """Should check tokens when permission is missing"""
        client_id = "client-123"

        mock_check_permission.return_value = False
        mock_tokens_get.return_value = {"access_token": "token"}
        mock_permissions.get.return_value = {"description": "Access events"}

        result = get_client_events_permission_error(client_id)

        assert result is not None
        # Should have checked tokens
        mock_tokens_get.assert_called_once_with(client_id)
