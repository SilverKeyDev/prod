"""Shared fixtures for research route unit tests."""

import pytest

from app.utils.security.celery_task_ownership import clear_task_owners_for_testing


@pytest.fixture(autouse=True)
def _clear_celery_task_owners():
    clear_task_owners_for_testing()
    yield
    clear_task_owners_for_testing()
