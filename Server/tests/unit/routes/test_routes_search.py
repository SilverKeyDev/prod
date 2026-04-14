"""
Tests for search and research API routes
"""

from unittest.mock import Mock, patch

from app.models import User

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


class TestPolygonSearchRoutes:
    """Test polygon search endpoint"""

    def test_polygon_search_valid_request(self, client, db_session):
        """Test POST /api/v1/search/properties-by-polygon with valid request"""
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
            "viewport_polygon": [
                {"lat": 40.7128, "lng": -74.006},
                {"lat": 40.7158, "lng": -74.006},
                {"lat": 40.7158, "lng": -73.996},
                {"lat": 40.7128, "lng": -73.996},
            ],
            "user_preferences": {
                "max_price": 500000,
                "min_price": 300000,
                "bedrooms": 3,
                "bathrooms": 2,
            },
        }

        mock_search_result = {
            "success": True,
            "properties": [
                {
                    "id": "prop-1",
                    "address": "123 Main St",
                    "price": 400000,
                    "bedrooms": 3,
                    "bathrooms": 2,
                }
            ],
            "count": 1,
            "cached": False,
        }

        with patch(MOCK_GET_CURRENT_USER) as mock_get_user:
            with patch(MOCK_RESOLVE_PREFS_USER_ID) as mock_resolve:
                with patch(MOCK_PARSE_RESEARCH_BODY) as mock_parse:
                    with patch(MOCK_RUN_POLYGON_SEARCH) as mock_search:
                        mock_get_user.return_value = (user, None)
                        mock_resolve.return_value = ("user-123", None)
                        mock_parse.return_value = {}
                        mock_search.return_value = (mock_search_result, 200)

                        response = client.post(
                            "/api/v1/search/properties-by-polygon",
                            json=request_data,
                            headers={"Authorization": "Bearer mock_token"},
                        )

                        assert response.status_code == 200
                        data = response.get_json()
                        assert data["success"] is True
                        assert "properties" in data
                        assert len(data["properties"]) == 1
                        assert data["count"] == 1
                        assert data["cached"] is False

    def test_polygon_search_with_force_search(self, client, db_session):
        """Test POST /api/v1/search/properties-by-polygon with forceSearch=true"""
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
            "viewport_polygon": [
                {"lat": 40.7128, "lng": -74.006},
                {"lat": 40.7158, "lng": -74.006},
                {"lat": 40.7158, "lng": -73.996},
                {"lat": 40.7128, "lng": -73.996},
            ],
            "forceSearch": True,
        }

        mock_search_result = {
            "success": True,
            "properties": [],
            "count": 0,
            "cached": False,
        }

        with patch(MOCK_GET_CURRENT_USER) as mock_get_user:
            with patch(MOCK_RESOLVE_PREFS_USER_ID) as mock_resolve:
                with patch(MOCK_PARSE_RESEARCH_BODY) as mock_parse:
                    with patch(MOCK_RUN_POLYGON_SEARCH) as mock_search:
                        mock_get_user.return_value = (user, None)
                        mock_resolve.return_value = ("user-123", None)
                        mock_parse.return_value = {"forceSearch": True}
                        mock_search.return_value = (mock_search_result, 200)

                        response = client.post(
                            "/api/v1/search/properties-by-polygon",
                            json=request_data,
                            headers={"Authorization": "Bearer mock_token"},
                        )

                        assert response.status_code == 200
                        data = response.get_json()
                        assert data["success"] is True
                        assert data["cached"] is False

    def test_polygon_search_invalid_polygon(self, client, db_session):
        """Test POST /api/v1/search/properties-by-polygon with invalid polygon"""
        user = User(
            id="user-123",
            cognito_id="cognito-user-1",
            email="user@example.com",
            name="Test User",
            is_agent=False,
        )
        db_session.session.add(user)
        db_session.session.commit()

        # Invalid polygon - less than 3 points
        request_data = {
            "viewport_polygon": [
                {"lat": 40.7128, "lng": -74.006},
                {"lat": 40.7158, "lng": -74.006},
            ]
        }

        with patch(MOCK_GET_CURRENT_USER) as mock_get_user:
            mock_get_user.return_value = (user, None)

            response = client.post(
                "/api/v1/search/properties-by-polygon",
                json=request_data,
                headers={"Authorization": "Bearer mock_token"},
            )

            # Validation will catch this (needs at least 3 points for a polygon)
            assert response.status_code == 400

    def test_polygon_search_requires_auth(self, client):
        """Test POST /api/v1/search/properties-by-polygon requires authentication"""
        request_data = {
            "viewport_polygon": [
                {"lat": 40.7128, "lng": -74.006},
                {"lat": 40.7158, "lng": -74.006},
                {"lat": 40.7158, "lng": -73.996},
                {"lat": 40.7128, "lng": -73.996},
            ]
        }

        with patch(MOCK_GET_CURRENT_USER) as mock_get_user:
            mock_get_user.return_value = (None, ({"success": False, "error": "UNAUTHORIZED"}, 401))

            response = client.post(
                "/api/v1/search/properties-by-polygon",
                json=request_data,
            )

            assert response.status_code == 401

    def test_polygon_search_agent_with_preferences_user_id(self, client, db_session):
        """Test polygon search where agent searches for client preferences"""
        agent = User(
            id="agent-123",
            cognito_id="cognito-agent-1",
            email="agent@example.com",
            name="Test Agent",
            is_agent=True,
        )
        db_session.session.add(agent)
        db_session.session.commit()

        request_data = {
            "viewport_polygon": [
                {"lat": 40.7128, "lng": -74.006},
                {"lat": 40.7158, "lng": -74.006},
                {"lat": 40.7158, "lng": -73.996},
                {"lat": 40.7128, "lng": -73.996},
            ],
            "preferences_user_id": "client-456",
        }

        mock_search_result = {
            "success": True,
            "properties": [],
            "count": 0,
        }

        with patch(MOCK_GET_CURRENT_USER) as mock_get_user:
            with patch(MOCK_RESOLVE_PREFS_USER_ID) as mock_resolve:
                with patch(MOCK_PARSE_RESEARCH_BODY) as mock_parse:
                    with patch(MOCK_RUN_POLYGON_SEARCH) as mock_search:
                        mock_get_user.return_value = (agent, None)
                        mock_resolve.return_value = ("client-456", None)
                        mock_parse.return_value = {"preferences_user_id": "client-456"}
                        mock_search.return_value = (mock_search_result, 200)

                        response = client.post(
                            "/api/v1/search/properties-by-polygon",
                            json=request_data,
                            headers={"Authorization": "Bearer mock_token"},
                        )

                        assert response.status_code == 200


class TestPropertyCompsRoutes:
    """Test property comparables endpoint"""

    def test_property_comps_with_address(self, client):
        """Test GET /api/v1/search/propertyComps with address"""
        mock_response = Mock()
        mock_response.ok = True
        mock_response.json.return_value = {
            "comps": [
                {
                    "zpid": "12345",
                    "address": "124 Main St",
                    "price": 395000,
                }
            ]
        }

        with patch("app.routes.search.search._SESSION.get") as mock_get:
            mock_get.return_value = mock_response

            response = client.get("/api/v1/search/propertyComps?address=123 Main St, City, State")

            assert response.status_code == 200
            data = response.get_json()
            assert data["success"] is True
            assert "data" in data
            assert "query" in data
            assert data["query"]["address"] == "123 Main St, City, State"

    def test_property_comps_with_zpid(self, client):
        """Test GET /api/v1/search/propertyComps with zpid"""
        mock_response = Mock()
        mock_response.ok = True
        mock_response.json.return_value = {
            "comps": [
                {
                    "zpid": "12346",
                    "address": "125 Main St",
                    "price": 405000,
                }
            ]
        }

        with patch("app.routes.search.search._SESSION.get") as mock_get:
            mock_get.return_value = mock_response

            response = client.get("/api/v1/search/propertyComps?zpid=12345")

            assert response.status_code == 200
            data = response.get_json()
            assert data["success"] is True
            assert data["query"]["zpid"] == "12345"

    def test_property_comps_with_property_url(self, client):
        """Test GET /api/v1/search/propertyComps with property_url"""
        mock_response = Mock()
        mock_response.ok = True
        mock_response.json.return_value = {"comps": []}

        with patch("app.routes.search.search._SESSION.get") as mock_get:
            mock_get.return_value = mock_response

            response = client.get(
                "/api/v1/search/propertyComps?property_url=https://www.zillow.com/homedetails/123"
            )

            assert response.status_code == 200
            data = response.get_json()
            assert data["success"] is True

    def test_property_comps_missing_params(self, client):
        """Test GET /api/v1/search/propertyComps with no parameters"""
        response = client.get("/api/v1/search/propertyComps")

        assert response.status_code == 400
        data = response.get_json()
        assert data["success"] is False
        assert "Provide one of" in data["message"]

    def test_property_comps_invalid_zpid(self, client):
        """Test GET /api/v1/search/propertyComps with invalid zpid format"""
        response = client.get("/api/v1/search/propertyComps?zpid=invalid")

        assert response.status_code == 400
        data = response.get_json()
        assert data["success"] is False
        assert "Invalid zpid format" in data["message"]

    def test_property_comps_api_error(self, client):
        """Test GET /api/v1/search/propertyComps when external API fails"""
        mock_response = Mock()
        mock_response.ok = False
        mock_response.status_code = 500

        with patch("app.routes.search.search._SESSION.get") as mock_get:
            mock_get.return_value = mock_response

            response = client.get("/api/v1/search/propertyComps?address=123 Main St")

            # Should handle external API error gracefully
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
        user.is_authenticated = True
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

        with patch("flask_login.utils._get_user") as mock_current_user:
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
        user.is_authenticated = True
        db_session.session.add(user)
        db_session.session.commit()

        request_data = {
            "homes_data": [
                {"id": "home-1", "price": 400000},
            ]
        }

        with patch("flask_login.utils._get_user") as mock_current_user:
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
        user.is_authenticated = True
        db_session.session.add(user)
        db_session.session.commit()

        request_data = {
            "user_data": {"user_id": "user-123"},
            "homes_data": [],
        }

        with patch("flask_login.utils._get_user") as mock_current_user:
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
        user.is_authenticated = True
        db_session.session.add(user)
        db_session.session.commit()

        with patch("flask_login.utils._get_user") as mock_current_user:
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


class TestIsochroneRoutes:
    """Test isochrone generation endpoint"""

    def test_isochrone_success(self, client, db_session):
        """Test GET /api/v1/search/isochrone with valid preferences"""
        user = User(
            id="user-123",
            cognito_id="cognito-user-1",
            email="user@example.com",
            name="Test User",
            is_agent=False,
        )
        db_session.session.add(user)
        db_session.session.commit()

        mock_prefs = {
            "important_locations": [
                {
                    "name": "Work",
                    "address": "123 Main St, City, State",
                    "commute_tolerance": 30,
                }
            ]
        }

        mock_isochrone = {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
            },
        }

        with patch(MOCK_GET_CURRENT_USER) as mock_get_user:
            with patch(MOCK_RESOLVE_PREFS_USER_ID) as mock_resolve:
                with patch(MOCK_GET_USER_PREFS) as mock_prefs_fn:
                    with patch(MOCK_PARSE_IMPORTANT_LOCATIONS) as mock_parse_locs:
                        with patch(MOCK_GEOCODE_ADDRESS) as mock_geocode:
                            with patch(MOCK_ISOCHRONE_UNION) as mock_iso:
                                mock_get_user.return_value = (user, None)
                                mock_resolve.return_value = ("user-123", None)
                                mock_prefs_fn.return_value = (mock_prefs, None)
                                mock_parse_locs.return_value = (
                                    mock_prefs["important_locations"],
                                    None,
                                )
                                mock_geocode.return_value = (40.7128, -74.006)
                                mock_iso.return_value = mock_isochrone

                                response = client.get(
                                    "/api/v1/search/isochrone",
                                    headers={"Authorization": "Bearer mock_token"},
                                )

                                assert response.status_code == 200
                                data = response.get_json()
                                assert data["success"] is True
                                assert "data" in data
                                assert "isochrone" in data["data"]
                                assert "center" in data["data"]

    def test_isochrone_no_locations(self, client, db_session):
        """Test GET /api/v1/search/isochrone with no important locations"""
        user = User(
            id="user-123",
            cognito_id="cognito-user-1",
            email="user@example.com",
            name="Test User",
            is_agent=False,
        )
        db_session.session.add(user)
        db_session.session.commit()

        with patch(MOCK_GET_CURRENT_USER) as mock_get_user:
            with patch(MOCK_RESOLVE_PREFS_USER_ID) as mock_resolve:
                with patch(MOCK_GET_USER_PREFS) as mock_prefs_fn:
                    with patch(MOCK_PARSE_IMPORTANT_LOCATIONS) as mock_parse_locs:
                        mock_get_user.return_value = (user, None)
                        mock_resolve.return_value = ("user-123", None)
                        mock_prefs_fn.return_value = ({}, None)
                        mock_parse_locs.return_value = (None, "No locations found")

                        response = client.get(
                            "/api/v1/search/isochrone",
                            headers={"Authorization": "Bearer mock_token"},
                        )

                        assert response.status_code == 400
                        data = response.get_json()
                        assert data["success"] is False
                        assert "NO_LOCATIONS" in data["error"]

    def test_isochrone_requires_auth(self, client):
        """Test GET /api/v1/search/isochrone requires authentication"""
        with patch(MOCK_GET_CURRENT_USER) as mock_get_user:
            mock_get_user.return_value = (None, ({"success": False, "error": "UNAUTHORIZED"}, 401))

            response = client.get("/api/v1/search/isochrone")

            assert response.status_code == 401


class TestMonthlyEstimatesRoutes:
    """Test monthly cost estimates endpoint"""

    def test_monthly_estimates_valid_zipcode(self, client):
        """Test GET /api/v1/search/monthly-cost-estimates with valid zipcode"""
        with patch("app.routes.search.search.monthly_cost_addon_estimates") as mock_estimates:
            mock_estimates.return_value = {
                "hoa_estimate": 0,
                "utilities_estimate": 0,
            }

            response = client.get("/api/v1/search/monthly-cost-estimates?zipcode=12345")

            assert response.status_code == 200
            data = response.get_json()
            assert data["success"] is True
            assert "hoa_estimate" in data
            assert "utilities_estimate" in data

    def test_monthly_estimates_missing_zipcode(self, client):
        """Test GET /api/v1/search/monthly-cost-estimates without zipcode"""
        response = client.get("/api/v1/search/monthly-cost-estimates")

        assert response.status_code == 400
        data = response.get_json()
        assert data["success"] is False
        assert "zipcode" in data["message"].lower()

    def test_monthly_estimates_invalid_zipcode(self, client):
        """Test GET /api/v1/search/monthly-cost-estimates with invalid zipcode"""
        with patch("app.routes.search.search.monthly_cost_addon_estimates") as mock_estimates:
            mock_estimates.side_effect = ValueError("Invalid zipcode format")

            response = client.get("/api/v1/search/monthly-cost-estimates?zipcode=invalid")

            assert response.status_code == 400
            data = response.get_json()
            assert data["success"] is False
