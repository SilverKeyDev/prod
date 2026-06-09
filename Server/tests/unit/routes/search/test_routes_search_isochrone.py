"""Tests for isochrone search routes."""

from unittest.mock import patch

from app.models import User

from .search_route_test_constants import (
    MOCK_ISO_GEOCODE,
    MOCK_ISO_GET_PREFS,
    MOCK_ISO_GET_USER,
    MOCK_ISO_PARSE_LOCS,
    MOCK_ISO_RESOLVE,
    MOCK_ISO_UNION,
)


class TestIsochroneRoutes:
    """Test isochrone generation endpoint"""

    def test_isochrone_success(self, client, db_session):
        """Test GET /api/v1/search/isochrone with valid preferences"""
        user = User(
            id="user-123",
            cognito_id="cognito-user-1",
            email="user@example.com",
            name="Test User",
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
                        mock_parse_locs.return_value = ([], None)

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

    def test_isochrone_empty_locations_list(self, client, db_session):
        """Empty important_locations list returns 400 NO_LOCATIONS."""
        user = User(
            id="user-123",
            cognito_id="cognito-user-1",
            email="user@example.com",
            name="Test User",
        )
        db_session.session.add(user)
        db_session.session.commit()

        with patch(MOCK_ISO_GET_USER) as mock_get_user:
            with patch(MOCK_ISO_RESOLVE) as mock_resolve:
                with patch(MOCK_ISO_GET_PREFS) as mock_prefs_fn:
                    with patch(MOCK_ISO_PARSE_LOCS) as mock_parse_locs:
                        mock_get_user.return_value = (user, None)
                        mock_resolve.return_value = ("user-123", None)
                        mock_prefs_fn.return_value = ({"important_locations": []}, None)
                        mock_parse_locs.return_value = ([], None)

                        response = client.get(
                            "/api/v1/search/isochrone",
                            headers={"Authorization": "Bearer mock_token"},
                        )

                        assert response.status_code == 400
                        data = response.get_json()
                        assert data["error"] == "NO_LOCATIONS"

    def test_isochrone_no_valid_addresses(self, client, db_session):
        """Locations with blank addresses return 400 NO_VALID_LOCATIONS."""
        user = User(
            id="user-123",
            cognito_id="cognito-user-1",
            email="user@example.com",
            name="Test User",
        )
        db_session.session.add(user)
        db_session.session.commit()

        blank_locations = [
            {"name": "Work", "address": "", "commute_tolerance": 30},
            {"name": "Home", "address": "   ", "commute_tolerance": 20},
        ]

        with patch(MOCK_ISO_GET_USER) as mock_get_user:
            with patch(MOCK_ISO_RESOLVE) as mock_resolve:
                with patch(MOCK_ISO_GET_PREFS) as mock_prefs_fn:
                    with patch(MOCK_ISO_PARSE_LOCS) as mock_parse_locs:
                        mock_get_user.return_value = (user, None)
                        mock_resolve.return_value = ("user-123", None)
                        mock_prefs_fn.return_value = (
                            {"important_locations": blank_locations},
                            None,
                        )
                        mock_parse_locs.return_value = (blank_locations, None)

                        response = client.get(
                            "/api/v1/search/isochrone",
                            headers={"Authorization": "Bearer mock_token"},
                        )

                        assert response.status_code == 400
                        data = response.get_json()
                        assert data["error"] == "NO_VALID_LOCATIONS"

    def test_isochrone_multiple_locations_success(self, client, db_session):
        """Two important locations return combined isochrone and individual entries."""
        user = User(
            id="user-123",
            cognito_id="cognito-user-1",
            email="user@example.com",
            name="Test User",
        )
        db_session.session.add(user)
        db_session.session.commit()

        locations = [
            {
                "name": "Work",
                "address": "123 Main St, City, State",
                "commute_tolerance": 30,
            },
            {
                "name": "School",
                "address": "456 Oak Ave, City, State",
                "commute_tolerance": 20,
            },
        ]

        mock_isochrone = {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
            },
            "extras": {
                "individual_features": [
                    {"type": "Feature", "geometry": {"type": "Polygon", "coordinates": []}},
                    {"type": "Feature", "geometry": {"type": "Polygon", "coordinates": []}},
                ]
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
                                mock_prefs_fn.return_value = (
                                    {"important_locations": locations},
                                    None,
                                )
                                mock_parse_locs.return_value = (locations, None)
                                mock_geocode.return_value = (40.7128, -74.006)
                                mock_iso.return_value = mock_isochrone

                                response = client.get(
                                    "/api/v1/search/isochrone",
                                    headers={"Authorization": "Bearer mock_token"},
                                )

                                assert response.status_code == 200
                                data = response.get_json()
                                assert data["success"] is True
                                assert len(data["data"]["individual_isochrones"]) == 2
                                mock_iso.assert_called_once()
                                call_addresses = mock_iso.call_args[0][0]
                                assert len(call_addresses) == 2

    def test_isochrone_generation_failure(self, client, db_session):
        """Geometry generation errors return secure 500 without exception text."""
        user = User(
            id="user-123",
            cognito_id="cognito-user-1",
            email="user@example.com",
            name="Test User",
        )
        db_session.session.add(user)
        db_session.session.commit()

        locations = [
            {
                "name": "Work",
                "address": "123 Main St, City, State",
                "commute_tolerance": 30,
            }
        ]

        create_collection_msg = (
            "ufunc 'create_collection' not supported for the input types, "
            "and the inputs could not be safely coerced to any supported types "
            "according to the casting rule ''safe''"
        )

        with patch(MOCK_ISO_GET_USER) as mock_get_user:
            with patch(MOCK_ISO_RESOLVE) as mock_resolve:
                with patch(MOCK_ISO_GET_PREFS) as mock_prefs_fn:
                    with patch(MOCK_ISO_PARSE_LOCS) as mock_parse_locs:
                        with patch(MOCK_ISO_GEOCODE) as mock_geocode:
                            with patch(MOCK_ISO_UNION) as mock_iso:
                                mock_get_user.return_value = (user, None)
                                mock_resolve.return_value = ("user-123", None)
                                mock_prefs_fn.return_value = (
                                    {"important_locations": locations},
                                    None,
                                )
                                mock_parse_locs.return_value = (locations, None)
                                mock_geocode.return_value = (40.7128, -74.006)
                                mock_iso.side_effect = Exception(create_collection_msg)

                                response = client.get(
                                    "/api/v1/search/isochrone",
                                    headers={"Authorization": "Bearer mock_token"},
                                )

                                assert response.status_code == 500
                                data = response.get_json()
                                assert data["success"] is False
                                assert data["error"] in {"database_error", "server_error"}
                                assert "error_id" in data
                                assert create_collection_msg not in data.get("message", "")
