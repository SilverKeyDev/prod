"""
Unit tests for GET /api/v1/brokerage/analytics/overview

Tests cover:
- Happy path: returns 200 with correct structure
- Missing brokerage_org_id: returns 400 (handled by decorator)
- Brokerage not found: returns 404
- Invalid date format: returns 400
- Unauthorized access: returns 401
- Wrong brokerage: returns 403
"""
from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from flask import Flask

BROKERAGE_ORG_ID = "test-brokerage-org-id-123"
OTHER_BROKERAGE_ORG_ID = "other-brokerage-org-id-456"


@pytest.fixture
def mock_user():
    """Mock authenticated user with brokerage access."""
    user = MagicMock()
    user.id = "test-user-id-123"
    user.brokerage_org_ids = [BROKERAGE_ORG_ID]
    return user


@pytest.fixture
def mock_analytics_result():
    """Mock successful analytics result from the service."""
    return {
        "success": True,
        "brokerage_org_id": BROKERAGE_ORG_ID,
        "brokerage_name": "Test Realty",
        "date_from": "2026-05-17T00:00:00+00:00",
        "date_to": "2026-06-17T00:00:00+00:00",
        "overview": {
            "active_agents": 5,
            "open_transactions": 12,
            "at_risk_agents": 1,
            "messaging_sla_percent": 85,
        },
        "transaction_funnel": [
            {"stage": "Search", "count": 10, "drop_off_percent": 0},
            {"stage": "Tour", "count": 7, "drop_off_percent": 30},
            {"stage": "Offer", "count": 5, "drop_off_percent": 29},
            {"stage": "Contract", "count": 4, "drop_off_percent": 20},
            {"stage": "Closing", "count": 3, "drop_off_percent": 25},
        ],
        "agent_performance": [],
        "messaging_activity": [],
    }


class TestGetAnalyticsOverview:
    """Tests for GET /api/v1/brokerage/analytics/overview"""

    def test_returns_200_with_valid_request(
        self, app: Flask, client, mock_user, mock_analytics_result
    ):
        """Happy path — valid brokerage_org_id returns analytics data."""
        with app.app_context():
            with (
                patch(
                    "app.services.auth.get_current_user",
                    return_value=mock_user,
                ),
                patch(
                    "app.routes.brokerage_analytics.get_brokerage_analytics_overview",
                    return_value=mock_analytics_result,
                ),
            ):
                response = client.get(
                    f"/api/v1/brokerage/analytics/overview?brokerage_org_id={BROKERAGE_ORG_ID}"
                )
                assert response.status_code == 200
                data = response.get_json()
                assert data["success"] is True
                assert data["brokerage_org_id"] == BROKERAGE_ORG_ID
                assert "overview" in data
                assert "transaction_funnel" in data
                assert data["overview"]["active_agents"] == 5

    def test_returns_400_without_brokerage_org_id(self, app: Flask, client, mock_user):
        """Missing brokerage_org_id returns 400 — handled by require_brokerage_scope."""
        with app.app_context():
            with patch(
                "app.services.auth.get_current_user",
                return_value=mock_user,
            ):
                response = client.get("/api/v1/brokerage/analytics/overview")
                assert response.status_code == 400
                data = response.get_json()
                assert data["success"] is False

    def test_returns_401_without_auth(self, app: Flask, client):
        """No authenticated user returns 401."""
        with app.app_context():
            with patch(
                "app.services.auth.get_current_user",
                return_value=None,
            ):
                response = client.get(
                    f"/api/v1/brokerage/analytics/overview?brokerage_org_id={BROKERAGE_ORG_ID}"
                )
                assert response.status_code == 401

    def test_returns_403_for_wrong_brokerage(self, app: Flask, client, mock_user):
        """User cannot access a brokerage they don't belong to."""
        with app.app_context():
            with patch(
                "app.services.auth.get_current_user",
                return_value=mock_user,
            ):
                response = client.get(
                    f"/api/v1/brokerage/analytics/overview?brokerage_org_id={OTHER_BROKERAGE_ORG_ID}"
                )
                assert response.status_code == 403
                data = response.get_json()
                assert data["success"] is False

    def test_returns_404_when_brokerage_not_found(self, app: Flask, client, mock_user):
        """Service returns brokerage_not_found error → 404 HTTP response."""
        with app.app_context():
            with (
                patch(
                    "app.services.auth.get_current_user",
                    return_value=mock_user,
                ),
                patch(
                    "app.routes.brokerage_analytics.get_brokerage_analytics_overview",
                    return_value={"success": False, "error": "brokerage_not_found"},
                ),
            ):
                response = client.get(
                    f"/api/v1/brokerage/analytics/overview?brokerage_org_id={BROKERAGE_ORG_ID}"
                )
                assert response.status_code == 404

    def test_returns_400_for_invalid_date_from(self, app: Flask, client, mock_user):
        """Invalid date_from format returns 400."""
        with app.app_context():
            with patch(
                "app.services.auth.get_current_user",
                return_value=mock_user,
            ):
                response = client.get(
                    f"/api/v1/brokerage/analytics/overview"
                    f"?brokerage_org_id={BROKERAGE_ORG_ID}&date_from=not-a-date"
                )
                assert response.status_code == 400
                data = response.get_json()
                assert "date_from" in data["error"]

    def test_returns_400_for_invalid_date_to(self, app: Flask, client, mock_user):
        """Invalid date_to format returns 400."""
        with app.app_context():
            with patch(
                "app.services.auth.get_current_user",
                return_value=mock_user,
            ):
                response = client.get(
                    f"/api/v1/brokerage/analytics/overview"
                    f"?brokerage_org_id={BROKERAGE_ORG_ID}&date_to=not-a-date"
                )
                assert response.status_code == 400
                data = response.get_json()
                assert "date_to" in data["error"]

    def test_accepts_valid_date_range(self, app: Flask, client, mock_user, mock_analytics_result):
        """Valid date_from and date_to are accepted and passed to service."""
        with app.app_context():
            with (
                patch(
                    "app.services.auth.get_current_user",
                    return_value=mock_user,
                ),
                patch(
                    "app.routes.brokerage_analytics.get_brokerage_analytics_overview",
                    return_value=mock_analytics_result,
                ) as mock_service,
            ):
                response = client.get(
                    f"/api/v1/brokerage/analytics/overview"
                    f"?brokerage_org_id={BROKERAGE_ORG_ID}"
                    f"&date_from=2026-01-01&date_to=2026-06-01"
                )
                assert response.status_code == 200
                mock_service.assert_called_once()
                call_filters = mock_service.call_args[0][0]
                assert call_filters.date_from is not None
                assert call_filters.date_to is not None
