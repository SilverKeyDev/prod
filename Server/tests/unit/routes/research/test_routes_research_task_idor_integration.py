"""Integration-style IDOR checks for research Celery task-status."""

from unittest.mock import Mock, patch

import jwt as pyjwt

from app.utils.security.celery_task_ownership import (
    clear_task_owners_for_testing,
    register_task_owner,
)
from tests.jwt_test_secret import TEST_JWT_HMAC_SECRET

MOCK_JWT_USER = "app.services.auth.get_current_user"
MOCK_JWT_TOKEN = pyjwt.encode(
    {"sub": "test-user", "email": "test@example.com"}, TEST_JWT_HMAC_SECRET, algorithm="HS256"
)


def _user(user_id: str):
    u = Mock()
    u.id = user_id
    return u


class TestResearchTaskIdorIntegration:
    def setup_method(self):
        clear_task_owners_for_testing()

    def teardown_method(self):
        clear_task_owners_for_testing()

    def test_task_status_denied_for_non_owner(self, client):
        register_task_owner("task-idor-research", "user-owner-a")

        with patch(MOCK_JWT_USER) as mock_user_fn:
            mock_user_fn.return_value = _user("user-intruder-b")
            response = client.get(
                "/api/v1/research/task-status/task-idor-research",
                headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
            )

        assert response.status_code == 403
        assert response.get_json()["success"] is False

    def test_task_status_allowed_for_owner(self, client):
        register_task_owner("task-idor-research-ok", "user-owner-a")

        with patch(MOCK_JWT_USER) as mock_user_fn:
            mock_user_fn.return_value = _user("user-owner-a")
            with patch("app.routes.research.research.celery.AsyncResult") as mock_result:
                mock_task = Mock()
                mock_task.status = "PENDING"
                mock_result.return_value = mock_task
                response = client.get(
                    "/api/v1/research/task-status/task-idor-research-ok",
                    headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
                )

        assert response.status_code == 200
        assert response.get_json()["success"] is True
