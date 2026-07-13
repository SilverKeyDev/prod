"""Parametrized route tests: analytics GETs × timelines (SIL-274)."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from flask import Flask

BROKERAGE_ORG_ID = "test-brokerage-org-id-123"

TIMELINES = ["week", "month", "year", "5years", "all"]

STUB_ROUTES = [
    "/volume",
    "/price",
    "/location",
    "/type",
    "/timing",
    "/ancillary",
    "/deal-failure",
    "/targeted-agent-engagement",
    "/agent-retention-risk",
]


@pytest.fixture
def mock_user():
    user = MagicMock()
    user.id = "test-user-id-123"
    user.brokerage_org_ids = [BROKERAGE_ORG_ID]
    return user


class TestAnalyticsTimelineMatrix:
    @pytest.mark.parametrize("timeline", TIMELINES)
    @pytest.mark.parametrize("route", STUB_ROUTES)
    def test_stub_routes_accept_timeline_and_return_200(
        self, app: Flask, client, mock_user, route: str, timeline: str
    ):
        with app.app_context():
            with patch(
                "app.services.auth.get_current_user",
                return_value=mock_user,
            ):
                response = client.get(
                    f"/api/v1/brokerage/analytics{route}"
                    f"?brokerage_org_id={BROKERAGE_ORG_ID}&timeline={timeline}"
                )
                assert response.status_code == 200, response.get_json()
                data = response.get_json()
                assert data["success"] is True
                assert data["timeline"] == timeline
                assert data["brokerage_org_id"] == BROKERAGE_ORG_ID
                assert "date_from" in data and "date_to" in data

    def test_ancillary_totals_increase_with_longer_timeline(self, app: Flask, client, mock_user):
        with app.app_context():
            with patch(
                "app.services.auth.get_current_user",
                return_value=mock_user,
            ):
                week = client.get(
                    f"/api/v1/brokerage/analytics/ancillary"
                    f"?brokerage_org_id={BROKERAGE_ORG_ID}&timeline=week"
                ).get_json()
                year = client.get(
                    f"/api/v1/brokerage/analytics/ancillary"
                    f"?brokerage_org_id={BROKERAGE_ORG_ID}&timeline=year"
                ).get_json()
                assert week["total_transactions"] < year["total_transactions"]
                assert (
                    week["summary"]["total_leakage_dollars"]
                    < year["summary"]["total_leakage_dollars"]
                )
                assert week["by_agent"][0]["transactions"] < year["by_agent"][0]["transactions"]

    def test_deal_failure_totals_increase_with_longer_timeline(self, app: Flask, client, mock_user):
        with app.app_context():
            with patch(
                "app.services.auth.get_current_user",
                return_value=mock_user,
            ):
                week = client.get(
                    f"/api/v1/brokerage/analytics/deal-failure"
                    f"?brokerage_org_id={BROKERAGE_ORG_ID}&timeline=week"
                ).get_json()
                year = client.get(
                    f"/api/v1/brokerage/analytics/deal-failure"
                    f"?brokerage_org_id={BROKERAGE_ORG_ID}&timeline=year"
                ).get_json()
                assert week["summary"]["total_transactions"] < year["summary"]["total_transactions"]

    def test_invalid_timeline_returns_400(self, app: Flask, client, mock_user):
        with app.app_context():
            with patch(
                "app.services.auth.get_current_user",
                return_value=mock_user,
            ):
                response = client.get(
                    f"/api/v1/brokerage/analytics/ancillary"
                    f"?brokerage_org_id={BROKERAGE_ORG_ID}&timeline=decade"
                )
                assert response.status_code == 400
                data = response.get_json()
                assert data["success"] is False

    def test_overview_passes_timeline_into_service(self, app: Flask, client, mock_user):
        captured = {}

        def fake_overview(filters):
            captured["timeline"] = filters.timeline
            return {
                "success": True,
                "brokerage_org_id": BROKERAGE_ORG_ID,
                "brokerage_name": "Test",
                "date_from": filters.date_from.isoformat() if filters.date_from else "",
                "date_to": filters.date_to.isoformat() if filters.date_to else "",
                "timeline": filters.timeline,
                "overview": {"active_agents": 1, "open_transactions": 1, "at_risk_agents": 0},
                "transaction_funnel": [],
                "agent_performance": [],
            }

        with app.app_context():
            with (
                patch(
                    "app.services.auth.get_current_user",
                    return_value=mock_user,
                ),
                patch(
                    "app.routes.brokerage_analytics.get_brokerage_analytics_overview",
                    side_effect=fake_overview,
                ),
            ):
                response = client.get(
                    f"/api/v1/brokerage/analytics/overview"
                    f"?brokerage_org_id={BROKERAGE_ORG_ID}&timeline=week"
                )
                assert response.status_code == 200
                assert captured["timeline"] == "week"
                assert response.get_json()["timeline"] == "week"
