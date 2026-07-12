"""Unit tests for campaign routes (SIL-306 / 307) — service mocked where needed."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from flask import Flask

BROKERAGE_ORG_ID = "test-brokerage-org-id-123"


@pytest.fixture
def mock_user():
    user = MagicMock()
    user.id = "test-user-id-123"
    user.brokerage_org_ids = [BROKERAGE_ORG_ID]
    return user


class TestCampaignRoutes:
    def test_list_campaigns_200(self, app: Flask, client, mock_user):
        with app.app_context():
            with (
                patch("app.services.auth.get_current_user", return_value=mock_user),
                patch(
                    "app.services.brokerage.campaigns.service.list_campaigns",
                    return_value={
                        "success": True,
                        "brokerage_org_id": BROKERAGE_ORG_ID,
                        "campaigns": [],
                    },
                ),
            ):
                res = client.get(
                    f"/api/v1/brokerage/analytics/campaigns?brokerage_org_id={BROKERAGE_ORG_ID}"
                )
                assert res.status_code == 200
                assert res.get_json()["success"] is True

    def test_list_campaigns_401(self, app: Flask, client):
        with app.app_context():
            with patch("app.services.auth.get_current_user", return_value=None):
                res = client.get(
                    f"/api/v1/brokerage/analytics/campaigns?brokerage_org_id={BROKERAGE_ORG_ID}"
                )
                assert res.status_code == 401

    def test_create_campaign_201(self, app: Flask, client, mock_user):
        payload = {
            "name": "Test campaign",
            "goal_metric": "title_attach",
            "variants": [
                {"variant_key": "A", "subject": "A", "body_template": "a"},
                {"variant_key": "B", "subject": "B", "body_template": "b"},
            ],
            "segment": "targeted_engagement",
        }
        with app.app_context():
            with (
                patch("app.services.auth.get_current_user", return_value=mock_user),
                patch(
                    "app.services.brokerage.campaigns.service.create_campaign",
                    return_value={
                        "success": True,
                        "campaign": {
                            "id": "c1",
                            "name": "Test campaign",
                            "variant_counts": {"A": 2, "B": 2},
                        },
                    },
                ),
            ):
                res = client.post(
                    f"/api/v1/brokerage/analytics/campaigns?brokerage_org_id={BROKERAGE_ORG_ID}",
                    json=payload,
                )
                assert res.status_code == 201
                data = res.get_json()
                assert data["success"] is True
                assert (
                    data["campaign"]["variant_counts"]["A"]
                    + data["campaign"]["variant_counts"]["B"]
                    == 4
                )

    def test_create_campaign_403_wrong_org(self, app: Flask, client, mock_user):
        with app.app_context():
            with patch("app.services.auth.get_current_user", return_value=mock_user):
                res = client.post(
                    "/api/v1/brokerage/analytics/campaigns?brokerage_org_id=other-org",
                    json={"name": "x", "variants": []},
                )
                assert res.status_code == 403

    def test_results_404(self, app: Flask, client, mock_user):
        with app.app_context():
            with (
                patch("app.services.auth.get_current_user", return_value=mock_user),
                patch(
                    "app.services.brokerage.campaigns.results.get_campaign_results",
                    return_value={"success": False, "error": "campaign_not_found"},
                ),
            ):
                res = client.get(
                    f"/api/v1/brokerage/analytics/campaigns/missing/results"
                    f"?brokerage_org_id={BROKERAGE_ORG_ID}"
                )
                assert res.status_code == 404

    def test_inventory_200(self, app: Flask, client, mock_user):
        with app.app_context():
            with (
                patch("app.services.auth.get_current_user", return_value=mock_user),
                patch(
                    "app.services.brokerage.inventory.get_brokerage_inventory_listings",
                    return_value={
                        "success": True,
                        "brokerage_org_id": BROKERAGE_ORG_ID,
                        "listings": [{"id": "1", "lat": 1.0, "lng": 2.0, "status": "active"}],
                        "summary": {"active_count": 1, "sold_count": 0, "total_count": 1},
                    },
                ),
            ):
                res = client.get(
                    f"/api/v1/brokerage/analytics/inventory?brokerage_org_id={BROKERAGE_ORG_ID}"
                )
                assert res.status_code == 200
                assert res.get_json()["listings"]
