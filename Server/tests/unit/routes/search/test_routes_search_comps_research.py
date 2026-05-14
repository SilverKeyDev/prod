"""Tests for property comps, research, and related search API routes."""

from unittest.mock import Mock, patch

# Patch path for get_authenticated_user where it's used in the route
MOCK_GET_CURRENT_USER = "app.routes.search.search.get_authenticated_user"

# Patch paths for service functions where they're imported in handlers
MOCK_RUN_POLYGON_SEARCH = "app.routes.search.search.run_polygon_search"
MOCK_GET_USER_PREFS = "app.services.search.helpers.preferences_helpers.get_user_preferences_parsed"
MOCK_PARSE_IMPORTANT_LOCATIONS = (
    "app.services.search.helpers.preferences_helpers.parse_important_locations"
)
MOCK_ISOCHRONE_UNION = "app.routes.search.search.isochrone_union_for_addresses"
MOCK_GEOCODE_ADDRESS = "app.routes.search.search.geocode_address_google"
MOCK_RESOLVE_PREFS_USER_ID = "app.routes.search.search.resolve_preferences_user_id_for_research"
MOCK_PARSE_RESEARCH_BODY = "app.routes.search.search.parse_research_request_body"


class TestPropertyCompsRoutes:
    """Test property comparables endpoint"""

    MOCK_AUTH = "app.routes.search.search.get_authenticated_user"
    MOCK_COMPS = "app.routes.search.search.slipstream_get_comps"

    def test_property_comps_with_address(self, client):
        """Test GET /api/v1/search/propertyComps with address"""
        from unittest.mock import Mock

        mock_user = Mock()
        mock_user.id = "user-1"

        with patch(self.MOCK_AUTH) as mock_auth:
            mock_auth.return_value = (mock_user, None)
            with patch(self.MOCK_COMPS) as mock_comps:
                mock_comps.return_value = (
                    [
                        {
                            "zpid": "12345",
                            "address": "124 Main St",
                            "price": 395000,
                        }
                    ],
                    None,
                )

                response = client.get(
                    "/api/v1/search/propertyComps?address=123 Main St, City, State"
                )

                assert response.status_code == 200
                data = response.get_json()
                assert data["success"] is True
                assert "data" in data
                assert "query" in data
                assert data["query"]["address"] == "123 Main St, City, State"

    def test_property_comps_with_zpid(self, client):
        """Test GET /api/v1/search/propertyComps with zpid"""
        from unittest.mock import Mock

        mock_user = Mock()
        mock_user.id = "user-1"

        with patch(self.MOCK_AUTH) as mock_auth:
            mock_auth.return_value = (mock_user, None)
            with patch(self.MOCK_COMPS) as mock_comps:
                mock_comps.return_value = (
                    [
                        {
                            "zpid": "12346",
                            "address": "125 Main St",
                            "price": 405000,
                        }
                    ],
                    None,
                )

                response = client.get("/api/v1/search/propertyComps?zpid=12345")

                assert response.status_code == 200
                data = response.get_json()
                assert data["success"] is True
                assert data["query"]["zpid"] == "12345"

    def test_property_comps_with_property_url(self, client):
        """Route accepts address or zpid; long URLs are passed through as address when provided."""
        from unittest.mock import Mock

        mock_user = Mock()
        mock_user.id = "user-1"

        with patch(self.MOCK_AUTH) as mock_auth:
            mock_auth.return_value = (mock_user, None)
            with patch(self.MOCK_COMPS) as mock_comps:
                mock_comps.return_value = ([], None)

                response = client.get(
                    "/api/v1/search/propertyComps?address=https://www.zillow.com/homedetails/123"
                )

                assert response.status_code == 200
                data = response.get_json()
                assert data["success"] is True

    def test_property_comps_missing_params(self, client):
        """Test GET /api/v1/search/propertyComps with no parameters"""
        from unittest.mock import Mock

        mock_user = Mock()
        mock_user.id = "user-1"

        with patch(self.MOCK_AUTH) as mock_auth:
            mock_auth.return_value = (mock_user, None)
            response = client.get("/api/v1/search/propertyComps")

            assert response.status_code == 400
            data = response.get_json()
            assert data["success"] is False
            assert "Provide" in data["message"]

    def test_property_comps_requires_auth(self, client):
        """Unauthenticated requests receive 401."""
        from flask import jsonify

        with patch(self.MOCK_AUTH) as mock_auth:
            mock_auth.return_value = (
                None,
                (jsonify({"success": False, "error": "UNAUTHORIZED"}), 401),
            )
            response = client.get("/api/v1/search/propertyComps?zpid=12345")
            assert response.status_code == 401

    def test_property_comps_api_error(self, client):
        """Test GET /api/v1/search/propertyComps when external API fails"""
        from unittest.mock import Mock

        mock_user = Mock()
        mock_user.id = "user-1"

        with patch(self.MOCK_AUTH) as mock_auth:
            mock_auth.return_value = (mock_user, None)
            with patch(self.MOCK_COMPS) as mock_comps:
                mock_comps.return_value = (
                    [],
                    {"success": False, "details": "upstream failed"},
                )

                response = client.get("/api/v1/search/propertyComps?address=123 Main St")

                assert response.status_code in [500, 502, 503]
                data = response.get_json()
                assert data["success"] is False


class TestPropertyResearchRoutes:
    """Test property research endpoint"""

    def test_property_research_with_address(self, client):
        """Test POST /api/v1/research/property with address"""
        request_data = {"address": "123 Main St, City, State"}

        with patch("app.routes.search.research.research_property_task") as mock_task:
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

        with patch("app.routes.search.research.research_property_task") as mock_task:
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

        with patch("app.routes.search.research.research_property_task") as mock_task:
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

        with patch(
            "app.services.search.property.property_stream.generate_property_stream"
        ) as mock_stream:
            # Mock streaming generator
            def mock_generator():
                yield "data: {}\n\n"

            mock_stream.return_value = mock_generator()

            response = client.post(
                "/api/v1/research/property?stream=true",
                json=request_data,
            )

            # Streaming returns 200 with SSE content type
            assert response.status_code == 200
            assert response.content_type == "text/event-stream; charset=utf-8"

    def test_property_compare_endpoint(self, client):
        """Test POST /api/v1/research/compare (no pros/cons)"""
        request_data = {"address": "123 Main St, City, State"}

        with patch("app.routes.search.research.compare_property_task") as mock_task:
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

    def test_research_task_status_pending(self, client):
        """Test GET /api/v1/research/task-status/<id> with pending task"""
        with patch("app.routes.search.research.celery.AsyncResult") as mock_result:
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
        with patch("app.routes.search.research.celery.AsyncResult") as mock_result:
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
        with patch("app.routes.search.research.celery.AsyncResult") as mock_result:
            mock_task = Mock()
            mock_task.status = "FAILURE"
            mock_result.return_value = mock_task

            response = client.get("/api/v1/research/task-status/task-123")

            assert response.status_code == 200
            data = response.get_json()
            assert data["success"] is False
            assert data["status"] == "FAILURE"
            assert "failed" in data["message"].lower()
