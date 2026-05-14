"""Tests for home matching, isochrone, and monthly estimates search routes."""

from unittest.mock import Mock, patch

from flask import jsonify

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

MOCK_ISO_GET_USER = "app.routes.search.search_isochrone_routes.get_authenticated_user"
MOCK_ISO_RESOLVE = (
    "app.routes.search.search_isochrone_routes.resolve_preferences_user_id_for_research"
)
MOCK_ISO_GET_PREFS = "app.routes.search.search_isochrone_routes.get_user_preferences_parsed"
MOCK_ISO_PARSE_LOCS = "app.routes.search.search_isochrone_routes.parse_important_locations"
MOCK_ISO_GEOCODE = "app.routes.search.search_isochrone_routes.geocode_address_google"
MOCK_ISO_UNION = "app.routes.search.search_isochrone_routes.isochrone_union_for_addresses"


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

        with patch(MOCK_ISO_GET_USER) as mock_get_user:
            with patch(MOCK_ISO_RESOLVE) as mock_resolve:
                with patch(MOCK_ISO_GET_PREFS) as mock_prefs_fn:
                    with patch(MOCK_ISO_PARSE_LOCS) as mock_parse_locs:
                        with patch(MOCK_ISO_GEOCODE) as mock_geocode:
                            with patch(MOCK_ISO_UNION) as mock_iso:
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

        with patch(MOCK_ISO_GET_USER) as mock_get_user:
            with patch(MOCK_ISO_RESOLVE) as mock_resolve:
                with patch(MOCK_ISO_GET_PREFS) as mock_prefs_fn:
                    with patch(MOCK_ISO_PARSE_LOCS) as mock_parse_locs:
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
        with patch(MOCK_ISO_GET_USER) as mock_get_user:
            mock_get_user.return_value = (None, ({"success": False, "error": "UNAUTHORIZED"}, 401))

            response = client.get("/api/v1/search/isochrone")

            assert response.status_code == 401


class TestMonthlyEstimatesRoutes:
    """Test monthly cost estimates endpoint"""

    def test_monthly_estimates_valid_zipcode(self, client):
        """Test GET /api/v1/search/monthly-cost-estimates with valid zipcode"""
        mock_user = Mock()
        mock_user.id = "user-1"

        with patch(MOCK_GET_CURRENT_USER) as mock_auth:
            mock_auth.return_value = (mock_user, None)
            with patch("app.routes.search.search.monthly_cost_addon_estimates") as mock_estimates:
                mock_estimates.return_value = {
                    "hoa_monthly": 0.0,
                    "utilities_monthly": 0.0,
                }

                response = client.get("/api/v1/search/monthly-cost-estimates?zipcode=12345")

                assert response.status_code == 200
                data = response.get_json()
                assert data["success"] is True
                assert "hoa_monthly" in data
                assert "utilities_monthly" in data

    def test_monthly_estimates_missing_zipcode(self, client):
        """Test GET /api/v1/search/monthly-cost-estimates without zipcode"""
        mock_user = Mock()
        mock_user.id = "user-1"

        with patch(MOCK_GET_CURRENT_USER) as mock_auth:
            mock_auth.return_value = (mock_user, None)
            response = client.get("/api/v1/search/monthly-cost-estimates")

            assert response.status_code == 400
            data = response.get_json()
            assert data["success"] is False
            assert "zipcode" in data["message"].lower()

    def test_monthly_estimates_invalid_zipcode(self, client):
        """Test GET /api/v1/search/monthly-cost-estimates with invalid zipcode"""
        mock_user = Mock()
        mock_user.id = "user-1"

        with patch(MOCK_GET_CURRENT_USER) as mock_auth:
            mock_auth.return_value = (mock_user, None)
            with patch("app.routes.search.search.monthly_cost_addon_estimates") as mock_estimates:
                mock_estimates.side_effect = ValueError("Invalid zipcode format")

                response = client.get("/api/v1/search/monthly-cost-estimates?zipcode=invalid")

                assert response.status_code == 400
                data = response.get_json()
                assert data["success"] is False

    def test_monthly_estimates_requires_auth(self, client):
        """Unauthenticated requests receive 401."""
        with patch(MOCK_GET_CURRENT_USER) as mock_auth:
            mock_auth.return_value = (
                None,
                (jsonify({"success": False, "error": "UNAUTHORIZED"}), 401),
            )
            response = client.get("/api/v1/search/monthly-cost-estimates?zipcode=12345")
            assert response.status_code == 401


class TestAreaSearchRoutesAuth:
    """Auth on area suggestions / boundary (Slipstream-backed)."""

    def test_area_suggestions_requires_auth(self, client):
        with patch(MOCK_GET_CURRENT_USER) as mock_auth:
            mock_auth.return_value = (
                None,
                (jsonify({"success": False, "error": "UNAUTHORIZED"}), 401),
            )
            response = client.get("/api/v1/search/area-suggestions?keyword=atl")
            assert response.status_code == 401

    def test_area_boundary_requires_auth(self, client):
        with patch(MOCK_GET_CURRENT_USER) as mock_auth:
            mock_auth.return_value = (
                None,
                (jsonify({"success": False, "error": "UNAUTHORIZED"}), 401),
            )
            response = client.get("/api/v1/search/area-boundary?id=1")
            assert response.status_code == 401
