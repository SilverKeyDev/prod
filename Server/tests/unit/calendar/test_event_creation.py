"""
Unit tests for calendar event creation logic and target resolution.
Tests the resolve_create_event_target function and related validation.
"""

from unittest.mock import Mock, patch

import pytest

from app.services.calendar.events.creation import resolve_create_event_target


@pytest.fixture
def mock_agent_user():
    """Create a mock agent user"""
    user = Mock()
    user.id = "agent-123"
    user.is_agent = True
    user.agent_id = None
    return user


@pytest.fixture
def mock_client_user():
    """Create a mock client user with an agent"""
    user = Mock()
    user.id = "client-456"
    user.is_agent = False
    user.agent_id = "agent-123"
    return user


@pytest.fixture
def mock_client_user_no_agent():
    """Create a mock client user without an agent"""
    user = Mock()
    user.id = "client-789"
    user.is_agent = False
    user.agent_id = None
    return user


@pytest.mark.unit
class TestResolveCreateEventTarget:
    """Test event creation target resolution and validation"""

    def test_agent_creates_for_self(self, mock_agent_user):
        """Agent with no target_user_id should create for themselves"""
        user_id = "agent-123"
        event_data = {}

        result = resolve_create_event_target(user_id, event_data, mock_agent_user)

        assert result == (user_id, False)

    @patch("app.services.calendar.events.creation.validate_agent_client_relationship")
    def test_agent_creates_for_client_valid(self, mock_validate, mock_agent_user):
        """Agent with valid target_user_id should create in client's calendar"""
        user_id = "agent-123"
        target_user_id = "client-456"
        event_data = {"target_user_id": target_user_id}

        mock_validate.return_value = True

        result = resolve_create_event_target(user_id, event_data, mock_agent_user)

        assert result == (target_user_id, False)
        mock_validate.assert_called_once_with(user_id, target_user_id)

    @patch("app.services.calendar.events.creation.validate_agent_client_relationship")
    def test_agent_creates_for_invalid_client(self, mock_validate, mock_agent_user):
        """Agent requesting client they don't manage should get 403"""
        user_id = "agent-123"
        target_user_id = "client-999"
        event_data = {"target_user_id": target_user_id}

        mock_validate.return_value = False

        result = resolve_create_event_target(user_id, event_data, mock_agent_user)

        assert result[1] == 403
        assert "Client is not assigned to this agent" in result[0]

    @patch("app.services.calendar.events.creation.get_user_agent_id")
    def test_client_creates_for_self_with_agent(self, mock_get_agent_id, mock_client_user):
        """Client with no target_user_id should create for themselves with agent duplication"""
        user_id = "client-456"
        event_data = {}

        mock_get_agent_id.return_value = "agent-123"

        result = resolve_create_event_target(user_id, event_data, mock_client_user)

        assert result == (user_id, True)

    @patch("app.services.calendar.events.creation.get_user_agent_id")
    def test_client_creates_for_self_no_agent(self, mock_get_agent_id, mock_client_user_no_agent):
        """Client without agent should create for themselves without duplication"""
        user_id = "client-789"
        event_data = {}

        mock_get_agent_id.return_value = None

        result = resolve_create_event_target(user_id, event_data, mock_client_user_no_agent)

        assert result == (user_id, False)

    @patch("app.services.calendar.events.creation.get_user_agent_id")
    def test_client_creates_with_create_in_agent_calendar_false(
        self, mock_get_agent_id, mock_client_user
    ):
        """Client with create_in_agent_calendar=False should not duplicate"""
        user_id = "client-456"
        event_data = {"create_in_agent_calendar": False}

        mock_get_agent_id.return_value = "agent-123"

        result = resolve_create_event_target(user_id, event_data, mock_client_user)

        # Should not duplicate when explicitly set to False
        assert result == (user_id, False)

    @patch("app.services.calendar.events.creation.get_user_agent_id")
    def test_client_creates_for_agent(self, mock_get_agent_id, mock_client_user):
        """Client with target_user_id=agent should create in agent's calendar"""
        user_id = "client-456"
        target_user_id = "agent-123"
        event_data = {"target_user_id": target_user_id}

        mock_get_agent_id.return_value = "agent-123"

        result = resolve_create_event_target(user_id, event_data, mock_client_user)

        assert result == (target_user_id, False)

    @patch("app.services.calendar.events.creation.get_user_agent_id")
    def test_client_creates_for_invalid_agent(self, mock_get_agent_id, mock_client_user):
        """Client with target_user_id not their agent should get 403"""
        user_id = "client-456"
        target_user_id = "agent-999"
        event_data = {"target_user_id": target_user_id}

        mock_get_agent_id.return_value = "agent-123"

        result = resolve_create_event_target(user_id, event_data, mock_client_user)

        assert result[1] == 403
        assert "Target user is not your agent" in result[0]

    def test_user_not_found(self):
        """Should return 404 when user not found"""
        user_id = "user-not-found"
        event_data = {}

        result = resolve_create_event_target(user_id, event_data, None)

        assert result[1] == 404
        assert "User not found" in result[0]

    @patch("app.services.calendar.events.creation.validate_agent_client_relationship")
    def test_agent_creates_for_client_with_agent_calendar_flag(
        self, mock_validate, mock_agent_user
    ):
        """Agent creating for client should ignore create_in_agent_calendar flag"""
        user_id = "agent-123"
        target_user_id = "client-456"
        event_data = {"target_user_id": target_user_id, "create_in_agent_calendar": True}

        mock_validate.return_value = True

        result = resolve_create_event_target(user_id, event_data, mock_agent_user)

        # Agent creating for client should never trigger agent calendar duplication
        assert result == (target_user_id, False)

    @patch("app.services.calendar.events.creation.get_user_agent_id")
    def test_client_without_target_defaults_to_self_with_duplication(
        self, mock_get_agent_id, mock_client_user
    ):
        """Client creating without target defaults to self with agent duplication"""
        user_id = "client-456"
        event_data = {"create_in_agent_calendar": True}

        mock_get_agent_id.return_value = "agent-123"

        result = resolve_create_event_target(user_id, event_data, mock_client_user)

        assert result == (user_id, True)
