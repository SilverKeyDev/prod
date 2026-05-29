"""Tests for monthly estimates and area search auth routes."""

from unittest.mock import Mock, patch

from flask import jsonify

from .search_route_test_constants import MOCK_GET_CURRENT_USER


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
