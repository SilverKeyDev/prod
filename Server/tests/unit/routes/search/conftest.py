"""Shared fixtures for search route unit tests."""

from unittest.mock import Mock

import pytest

from app.utils.security.celery_task_ownership import clear_task_owners_for_testing


@pytest.fixture(autouse=True)
def _clear_celery_task_owners():
    clear_task_owners_for_testing()
    yield
    clear_task_owners_for_testing()


def mock_user(user_id: str = "user-research-1") -> Mock:
    user = Mock()
    user.id = user_id
    return user
