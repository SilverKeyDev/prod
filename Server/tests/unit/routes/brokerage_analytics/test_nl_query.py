"""Unit tests for POST /api/v1/brokerage/analytics/nl-query (SIL-323)."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from flask import Flask

from app.services.brokerage_db_mcp import NlQueryResult, QueryGuardrailError

BROKERAGE_ORG_ID = "test-brokerage-org-id-123"


@pytest.fixture
def mock_user():
    user = MagicMock()
    user.id = "test-user-id-123"
    user.brokerage_org_ids = [BROKERAGE_ORG_ID]
    return user


def test_nl_query_200(app: Flask, client, mock_user):
    fake = NlQueryResult(
        question="closed transactions by agent last quarter",
        sql=(
            "SELECT agent_id, COUNT(*) AS closed_count "
            "FROM skyslope_transactions "
            "WHERE brokerage_id = :brokerage_org_id LIMIT 500"
        ),
        viz_hint="bar",
        columns=("agent_id", "closed_count"),
        rows=({"agent_id": "agent-a", "closed_count": 2},),
        row_count=1,
    )
    with app.app_context():
        with (
            patch("app.services.auth.get_current_user", return_value=mock_user),
            # Handler imports run_nl_query inside the function — patch the service module.
            patch(
                "app.services.brokerage_db_mcp.run_nl_query",
                return_value=fake,
            ),
        ):
            res = client.post(
                "/api/v1/brokerage/analytics/nl-query",
                json={
                    "brokerage_org_id": BROKERAGE_ORG_ID,
                    "question": "closed transactions by agent last quarter",
                },
            )
            assert res.status_code == 200
            data = res.get_json()
            assert data["success"] is True
            assert data["viz_hint"] == "bar"
            assert data["row_count"] == 1
            assert data["rows"][0]["agent_id"] == "agent-a"
            assert "LIMIT" in data["sql"].upper()


def test_nl_query_401(app: Flask, client):
    with app.app_context():
        with patch("app.services.auth.get_current_user", return_value=None):
            res = client.post(
                "/api/v1/brokerage/analytics/nl-query",
                json={
                    "brokerage_org_id": BROKERAGE_ORG_ID,
                    "question": "how many closings?",
                },
            )
            assert res.status_code == 401


def test_nl_query_empty_question_400(app: Flask, client, mock_user):
    with app.app_context():
        with patch("app.services.auth.get_current_user", return_value=mock_user):
            res = client.post(
                "/api/v1/brokerage/analytics/nl-query",
                json={"brokerage_org_id": BROKERAGE_ORG_ID, "question": "  "},
            )
            assert res.status_code == 400
            assert res.get_json()["success"] is False


def test_nl_query_guardrail_400(app: Flask, client, mock_user):
    with app.app_context():
        with (
            patch("app.services.auth.get_current_user", return_value=mock_user),
            patch(
                "app.services.brokerage_db_mcp.run_nl_query",
                side_effect=QueryGuardrailError("nope", code="banned_keyword"),
            ),
        ):
            res = client.post(
                "/api/v1/brokerage/analytics/nl-query",
                json={
                    "brokerage_org_id": BROKERAGE_ORG_ID,
                    "question": "delete everything",
                },
            )
            assert res.status_code == 400
            body = res.get_json()
            assert body["success"] is False
            assert body["error"] == "banned_keyword"
