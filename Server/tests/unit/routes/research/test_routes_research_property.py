"""Tests for property research API routes under app.routes.research."""

from unittest.mock import Mock, patch

from .research_route_test_constants import (
    MOCK_JWT_USER,
    mock_user,
)


class TestPropertyResearchRoutes:
    """Test property research endpoint"""

    def test_property_research_requires_auth(self, client):
        """Unauthenticated research requests receive 401."""
        response = client.post(
            "/api/v1/research/property",
            json={"address": "123 Main St"},
        )
        assert response.status_code == 401

    def test_property_research_with_address(self, client):
        """Test POST /api/v1/research/property with address"""
        request_data = {"address": "123 Main St, City, State"}

        with patch(MOCK_JWT_USER) as mock_user_fn:
            mock_user_fn.return_value = mock_user()
            with patch("app.routes.research.research.research_property_task") as mock_task:
                mock_celery_result = Mock()
                mock_celery_result.id = "task-abc-123"
                mock_task.delay.return_value = mock_celery_result

                response = client.post(
                    "/api/v1/research/property",
                    json=request_data,
                )

                assert response.status_code == 202
                data = response.get_json()
                assert data["success"] is True
                assert data["status"] == "PENDING"
                assert data["task_id"] == "task-abc-123"
                assert "queued" in data["message"]

    def test_property_research_with_zpid(self, client):
        """Test POST /api/v1/research/property with zpid"""
        request_data = {"zpid": "12345", "address": ""}

        with patch(MOCK_JWT_USER) as mock_user_fn:
            mock_user_fn.return_value = mock_user()
            with patch("app.routes.research.research.research_property_task") as mock_task:
                mock_celery_result = Mock()
                mock_celery_result.id = "task-xyz-456"
                mock_task.delay.return_value = mock_celery_result

                response = client.post(
                    "/api/v1/research/property",
                    json=request_data,
                )

                assert response.status_code == 202
                data = response.get_json()
                assert data["success"] is True
                assert data["task_id"] == "task-xyz-456"

    def test_property_research_with_property_url(self, client):
        """Test POST /api/v1/research/property with property_url"""
        request_data = {
            "property_url": "https://www.zillow.com/homedetails/123",
            "address": "",
        }

        with patch(MOCK_JWT_USER) as mock_user_fn:
            mock_user_fn.return_value = mock_user()
            with patch("app.routes.research.research.research_property_task") as mock_task:
                mock_celery_result = Mock()
                mock_celery_result.id = "task-def-789"
                mock_task.delay.return_value = mock_celery_result

                response = client.post(
                    "/api/v1/research/property",
                    json=request_data,
                )

                assert response.status_code == 202
                data = response.get_json()
                assert data["success"] is True

    def test_property_research_missing_params(self, client):
        """Test POST /api/v1/research/property with no valid parameters"""
        request_data = {}

        with patch(MOCK_JWT_USER) as mock_user_fn:
            mock_user_fn.return_value = mock_user()
            response = client.post(
                "/api/v1/research/property",
                json=request_data,
            )

        assert response.status_code == 400
        data = response.get_json()
        assert data["success"] is False

    def test_property_research_streaming_mode(self, client):
        """Test POST /api/v1/research/property with streaming enabled"""
        request_data = {"address": "123 Main St, City, State"}

        with patch(MOCK_JWT_USER) as mock_user_fn:
            mock_user_fn.return_value = mock_user()
            with patch(
                "app.services.search.property.property_stream.generate_property_stream"
            ) as mock_stream:

                def mock_generator():
                    yield 'data: {"type": "basic", "data": {"success": true}}\n\n'
                    yield 'data: {"type": "complete", "data": null}\n\n'

                mock_stream.return_value = mock_generator()

                response = client.post(
                    "/api/v1/research/property?stream=true",
                    json=request_data,
                )

                assert response.status_code == 200
                assert response.content_type == "text/event-stream; charset=utf-8"
                body = response.get_data(as_text=True)
                assert '"type": "basic"' in body
                assert '"type": "complete"' in body

    def test_property_research_passes_preferences_user_id_in_stream_body(self, client):
        """Stream mode forwards request body (including preferences_user_id) to the generator."""
        request_data = {
            "address": "123 Main St",
            "preferences_user_id": "client-abc",
        }

        with patch(MOCK_JWT_USER) as mock_user_fn:
            mock_user_fn.return_value = mock_user()
            with patch(
                "app.services.search.property.property_stream.generate_property_stream"
            ) as mock_stream:
                mock_stream.return_value = iter([])

                response = client.post(
                    "/api/v1/research/property?stream=true",
                    json=request_data,
                )

                assert response.status_code == 200
                mock_stream.assert_called_once()
                research_body = mock_stream.call_args.kwargs.get("research_body") or {}
                assert research_body.get("preferences_user_id") == "client-abc"

    def test_property_compare_endpoint(self, client):
        """Test POST /api/v1/research/compare (no pros/cons)"""
        request_data = {"address": "123 Main St, City, State"}

        with patch(MOCK_JWT_USER) as mock_user_fn:
            mock_user_fn.return_value = mock_user()
            with patch("app.routes.research.research.compare_property_task") as mock_task:
                mock_celery_result = Mock()
                mock_celery_result.id = "task-compare-123"
                mock_task.delay.return_value = mock_celery_result

                response = client.post(
                    "/api/v1/research/compare",
                    json=request_data,
                )

                assert response.status_code == 202
                data = response.get_json()
                assert data["success"] is True
                assert data["task_id"] == "task-compare-123"
                assert "comparison" in data["message"]

    def test_research_task_status_requires_auth(self, client):
        response = client.get("/api/v1/research/task-status/task-123")
        assert response.status_code == 401

    def test_research_task_status_pending(self, client):
        """Test GET /api/v1/research/task-status/<id> with pending task"""
        from app.utils.security.celery_task_ownership import register_task_owner

        register_task_owner("task-123", "user-research-1")
        with patch(MOCK_JWT_USER) as mock_user_fn:
            mock_user_fn.return_value = mock_user("user-research-1")
            with patch("app.routes.research.research.celery.AsyncResult") as mock_result:
                mock_task = Mock()
                mock_task.status = "PENDING"
                mock_result.return_value = mock_task

                response = client.get("/api/v1/research/task-status/task-123")

            assert response.status_code == 200
            data = response.get_json()
            assert data["success"] is True
            assert data["status"] == "PENDING"
            assert "waiting" in data["message"]

    def test_research_task_status_success(self, client):
        """Test GET /api/v1/research/task-status/<id> with completed task"""
        from app.utils.security.celery_task_ownership import register_task_owner

        register_task_owner("task-123", "user-research-1")
        with patch(MOCK_JWT_USER) as mock_user_fn:
            mock_user_fn.return_value = mock_user("user-research-1")
            with patch("app.routes.research.research.celery.AsyncResult") as mock_result:
                mock_task = Mock()
                mock_task.status = "SUCCESS"
                mock_task.result = {
                    "success": True,
                    "response_data": {
                        "property": {
                            "address": "123 Main St",
                            "price": 400000,
                        }
                    },
                    "status_code": 200,
                }
                mock_result.return_value = mock_task

                response = client.get("/api/v1/research/task-status/task-123")

            assert response.status_code == 200
            data = response.get_json()
            assert data["success"] is True
            assert data["status"] == "SUCCESS"
            assert "result" in data
            assert data["status_code"] == 200

    def test_research_task_status_failure(self, client):
        """Test GET /api/v1/research/task-status/<id> with failed task"""
        from app.utils.security.celery_task_ownership import register_task_owner

        register_task_owner("task-123", "user-research-1")
        with patch(MOCK_JWT_USER) as mock_user_fn:
            mock_user_fn.return_value = mock_user("user-research-1")
            with patch("app.routes.research.research.celery.AsyncResult") as mock_result:
                mock_task = Mock()
                mock_task.status = "FAILURE"
                mock_result.return_value = mock_task

                response = client.get("/api/v1/research/task-status/task-123")

            assert response.status_code == 200
            data = response.get_json()
            assert data["success"] is False
            assert data["status"] == "FAILURE"
            assert "failed" in data["message"].lower()
