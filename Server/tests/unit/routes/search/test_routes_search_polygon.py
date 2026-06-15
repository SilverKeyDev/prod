"""Tests for polygon search API routes."""

from unittest.mock import patch

from app.models import AgentConnections, User, UserRole
from tests.support.user_roles import create_user_with_roles

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

    def test_polygon_search_cached_results(self, client, db_session):
        """Test POST /api/v1/search/properties-by-polygon returns cached=true from runner."""
        user = User(
            id="user-123",
            cognito_id="cognito-user-1",
            email="user@example.com",
            name="Test User",
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
        }

        mock_search_result = {
            "success": True,
            "properties": [],
            "count": 0,
            "cached": True,
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
                        assert data["cached"] is True

    def test_polygon_search_invalid_polygon(self, client, db_session):
        """Test POST /api/v1/search/properties-by-polygon with invalid polygon"""
        user = User(
            id="user-123",
            cognito_id="cognito-user-1",
            email="user@example.com",
            name="Test User",
        )
        db_session.session.add(user)
        db_session.session.commit()

        # Invalid polygon - less than 3 points; forceSearch exercises geometry validation path
        request_data = {
            "viewport_polygon": [
                {"lat": 40.7128, "lng": -74.006},
                {"lat": 40.7158, "lng": -74.006},
            ],
            "forceSearch": True,
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
        )
        db_session.session.add(agent)
        db_session.session.add(UserRole(user_id=agent.id, role="agent"))
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

    def test_polygon_agent_preferences_user_id_forbidden_non_client(self, client, db_session):
        """Agent cannot search with preferences_user_id outside linked clients."""
        agent = create_user_with_roles(
            db_session.session,
            id="agent-1",
            cognito_id="cognito-agent-1",
            email="agent@example.com",
            name="Agent",
            roles=("agent",),
            commit=False,
        )
        good_client = User(
            id="client-good",
            cognito_id="cognito-client-good",
            email="good@example.com",
            name="Good Client",
        )
        db_session.session.add(good_client)
        db_session.session.add(AgentConnections(agent_id="agent-1", client_id="client-good"))
        db_session.session.commit()

        request_data = {
            "viewport_polygon": [
                {"lat": 40.7128, "lng": -74.006},
                {"lat": 40.7158, "lng": -74.006},
                {"lat": 40.7158, "lng": -73.996},
                {"lat": 40.7128, "lng": -73.996},
            ],
            "preferences_user_id": "not-a-client",
        }

        with patch(MOCK_GET_CURRENT_USER) as mock_get_user:
            with patch(MOCK_RUN_POLYGON_SEARCH) as mock_search:
                mock_get_user.return_value = (agent, None)
                response = client.post(
                    "/api/v1/search/properties-by-polygon",
                    json=request_data,
                    headers={"Authorization": "Bearer mock_token"},
                )
                assert response.status_code == 403
                mock_search.assert_not_called()

    def test_polygon_buyer_preferences_user_id_ignored_uses_self(self, client, db_session):
        """Buyers cannot escalate to another user's preferences; subject stays self."""
        buyer = User(
            id="buyer-1",
            cognito_id="cognito-buyer-1",
            email="buyer@example.com",
            name="Buyer",
        )
        db_session.session.add(buyer)
        db_session.session.commit()

        request_data = {
            "viewport_polygon": [
                {"lat": 40.7128, "lng": -74.006},
                {"lat": 40.7158, "lng": -74.006},
                {"lat": 40.7158, "lng": -73.996},
                {"lat": 40.7128, "lng": -73.996},
            ],
            "preferences_user_id": "someone-else",
        }
        mock_search_result = {"success": True, "properties": [], "total_count": 0}

        with patch(MOCK_GET_CURRENT_USER) as mock_get_user:
            with patch(MOCK_RUN_POLYGON_SEARCH) as mock_search:
                mock_get_user.return_value = (buyer, None)
                mock_search.return_value = (mock_search_result, 200)
                response = client.post(
                    "/api/v1/search/properties-by-polygon",
                    json=request_data,
                    headers={"Authorization": "Bearer mock_token"},
                )
                assert response.status_code == 200
                mock_search.assert_called_once()
                assert mock_search.call_args.kwargs["preferences_subject_user_id"] == "buyer-1"
