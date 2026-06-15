"""Tests for property comps, research, and related search API routes."""

from unittest.mock import Mock, patch


class TestPropertyCompsRoutes:
    """Test property comparables endpoint"""

    MOCK_AUTH = "app.routes.search.search.get_authenticated_user"
    MOCK_COMPS = "app.routes.search.search.slipstream_get_comps"

    def test_property_comps_with_address(self, client):
        """Test GET /api/v1/search/propertyComps with address"""

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

                assert response.status_code == 503
                data = response.get_json()
                assert data["success"] is False
                assert data["error"] == "external_api_error"
                assert "error_id" in data
