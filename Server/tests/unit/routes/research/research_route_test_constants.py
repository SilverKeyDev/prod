"""Shared mock paths for research route unit tests."""

from unittest.mock import Mock

MOCK_JWT_USER = "app.services.auth.get_current_user"


def mock_user(user_id: str = "user-research-1"):
    user = Mock()
    user.id = user_id
    return user
