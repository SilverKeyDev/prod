"""Tests for home matching search routes."""

from unittest.mock import Mock, patch

from app.models import User
from app.utils.security.celery_task_ownership import register_task_owner

from .search_route_test_constants import MOCK_JWT_USER


class TestHomeMatchingRoutes:
    """Test home matching score endpoint"""

    def test_find_matches_valid_request(self, client, db_session):
        """Test POST /api/home-matching/find-matches with valid data"""
        user = User(
            id="user-123",
            cognito_id="cognito-user-1",
            email="user@example.com",
            name="Test User",
            is_agent=False,
        )
        db_session.session.add(user)
        db_session.session.commit()

        request_data = {
            "user_data": {
                "user_id": "user-123",
                "preferences": {
                    "max_price": 500000,
                    "bedrooms": 3,
                },
            },
            "homes_data": [
                {
                    "id": "home-1",
                    "price": 400000,
                    "bedrooms": 3,
                },
                {
                    "id": "home-2",
                    "price": 450000,
                    "bedrooms": 4,
                },
            ],
            "top_k": 5,
        }

        with patch(MOCK_JWT_USER) as mock_current_user:
            mock_current_user.return_value = user

            with patch("app.routes.search.home_matching.find_best_matches_task") as mock_task:
                mock_celery_result = Mock()
                mock_celery_result.id = "task-match-123"
                mock_task.delay.return_value = mock_celery_result

                response = client.post(
                    "/api/home-matching/find-matches",
                    json=request_data,
                    headers={"Authorization": "Bearer mock_token"},
                )

                assert response.status_code == 202
                data = response.get_json()
                assert data["success"] is True
                assert data["task_id"] == "task-match-123"
                assert data["status"] == "PENDING"
                assert data["homes_count"] == 2
                assert data["top_k"] == 5

    def test_find_matches_missing_user_data(self, client, db_session):
        """Test POST /api/home-matching/find-matches without user_data"""
        user = User(
            id="user-123",
            cognito_id="cognito-user-1",
            email="user@example.com",
            name="Test User",
            is_agent=False,
        )
        db_session.session.add(user)
        db_session.session.commit()

        request_data = {
            "homes_data": [
                {"id": "home-1", "price": 400000},
            ]
        }

        with patch(MOCK_JWT_USER) as mock_current_user:
            mock_current_user.return_value = user

            response = client.post(
                "/api/home-matching/find-matches",
                json=request_data,
                headers={"Authorization": "Bearer mock_token"},
            )

            assert response.status_code == 400
            data = response.get_json()
            assert data["success"] is False
            assert "user_data" in data["error"]

    def test_find_matches_empty_homes_data(self, client, db_session):
        """Test POST /api/home-matching/find-matches with empty homes_data"""
        user = User(
            id="user-123",
            cognito_id="cognito-user-1",
            email="user@example.com",
            name="Test User",
            is_agent=False,
        )
        db_session.session.add(user)
        db_session.session.commit()

        request_data = {
            "user_data": {"user_id": "user-123"},
            "homes_data": [],
        }

        with patch(MOCK_JWT_USER) as mock_current_user:
            mock_current_user.return_value = user

            response = client.post(
                "/api/home-matching/find-matches",
                json=request_data,
                headers={"Authorization": "Bearer mock_token"},
            )

            assert response.status_code == 400
            data = response.get_json()
            assert data["success"] is False
            assert "cannot be empty" in data["error"]

    def test_find_matches_requires_auth(self, client):
        """Test POST /api/home-matching/find-matches requires authentication"""
        request_data = {
            "user_data": {"user_id": "user-123"},
            "homes_data": [{"id": "home-1"}],
        }

        response = client.post(
            "/api/home-matching/find-matches",
            json=request_data,
        )

        assert response.status_code == 401

    def test_home_matching_task_status(self, client, db_session):
        """Test GET /api/home-matching/task-status/<id>"""
        user = User(
            id="user-123",
            cognito_id="cognito-user-1",
            email="user@example.com",
            name="Test User",
            is_agent=False,
        )
        db_session.session.add(user)
        db_session.session.commit()

        register_task_owner("task-123", "user-123")
        with patch(MOCK_JWT_USER) as mock_current_user:
            mock_current_user.return_value = user

            with patch("app.routes.search.home_matching.celery.AsyncResult") as mock_result:
                mock_task = Mock()
                mock_task.status = "SUCCESS"
                mock_task.result = {
                    "matches": [
                        {"home_id": "home-1", "score": 0.95},
                        {"home_id": "home-2", "score": 0.87},
                    ]
                }
                mock_result.return_value = mock_task

                response = client.get(
                    "/api/home-matching/task-status/task-123",
                    headers={"Authorization": "Bearer mock_token"},
                )

                assert response.status_code == 200
                data = response.get_json()
                assert data["success"] is True
                assert data["status"] == "SUCCESS"
                assert "result" in data
                assert "matches" in data["result"]
