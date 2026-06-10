"""Shared pytest fixtures for calendar unit tests."""

from unittest.mock import Mock

import pytest


@pytest.fixture
def mock_client_user_single_agent():
    """Create a mock client user with a single agent"""
    user = Mock()
    user.id = "client-456"
    return user


@pytest.fixture
def mock_client_user_multiple_agents():
    """Create a mock client user with multiple agents"""
    user = Mock()
    user.id = "client-789"
    return user


@pytest.fixture
def mock_client_user_no_agent():
    """Create a mock client user without an agent"""
    user = Mock()
    user.id = "client-999"
    return user


@pytest.fixture
def mock_calendar_event():
    """Create a mock calendar event"""
    event = Mock()
    event.id = "event-123"
    event.shared_with_user_ids = []
    event.calculate_duration = Mock()
    return event


@pytest.fixture
def mock_event_data():
    """Create mock event data"""
    return {
        "summary": "Test Event",
        "description": "Test Description",
        "location": "Test Location",
        "start": {"dateTime": "2026-04-15T10:00:00Z"},
        "end": {"dateTime": "2026-04-15T11:00:00Z"},
    }
