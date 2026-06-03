"""Unit tests for negotiation strategy route orchestration."""

from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import patch

from app.services.negotiation.strategy_route_service import (
    build_negotiation_strategy_payload,
    resolve_preferences_user_id,
)


def test_resolve_preferences_user_id_defaults_to_self():
    user = SimpleNamespace(id="user-1")
    prefs_id, err, status = resolve_preferences_user_id(user, None)
    assert prefs_id == "user-1"
    assert err is None
    assert status is None


def test_resolve_preferences_user_id_rejects_non_agent_targeting_client():
    user = SimpleNamespace(id="buyer-1")
    prefs_id, err, status = resolve_preferences_user_id(user, "client-2")
    assert prefs_id is None
    assert status == 403
    assert "Only agents" in err["error"]


def test_resolve_preferences_user_id_rejects_agent_without_client_access():
    user = SimpleNamespace(id="agent-1")
    with (
        patch("app.services.negotiation.strategy_route_service.user_is_agent", return_value=True),
        patch(
            "app.services.negotiation.strategy_route_service.agent_may_access_client",
            return_value=False,
        ),
    ):
        prefs_id, err, status = resolve_preferences_user_id(user, "client-2")
    assert prefs_id is None
    assert status == 403
    assert "Access denied" in err["error"]


def test_resolve_preferences_user_id_allows_managing_agent():
    user = SimpleNamespace(id="agent-1")
    with (
        patch("app.services.negotiation.strategy_route_service.user_is_agent", return_value=True),
        patch(
            "app.services.negotiation.strategy_route_service.agent_may_access_client",
            return_value=True,
        ),
    ):
        prefs_id, err, status = resolve_preferences_user_id(user, "client-2")
    assert prefs_id == "client-2"
    assert err is None


def test_build_negotiation_strategy_payload_success():
    user = SimpleNamespace(id="user-1")
    strategy = {"opening_offer_rationale": "Comp-based opening at $500k"}

    with (
        patch(
            "app.services.negotiation.strategy_route_service.get_preferences_dict_optional",
            return_value={"home_budget_max": 550000},
        ),
        patch(
            "app.services.negotiation.strategy_route_service.get_property_detail",
            return_value=(None, "not found"),
        ),
        patch(
            "app.services.negotiation.strategy_route_service.generate_negotiation_strategy",
            return_value=strategy,
        ),
        patch(
            "app.services.negotiation.strategy_route_service.capture_product_event",
        ) as mock_capture,
    ):
        body, status = build_negotiation_strategy_payload(
            user,
            address="123 Main St",
        )

    assert status == 200
    assert body["success"] is True
    assert body["strategy"] == strategy
    assert body["property_address"] == "123 Main St"
    mock_capture.assert_called_once()


def test_build_negotiation_strategy_payload_propagates_access_denial():
    user = SimpleNamespace(id="buyer-1")
    body, status = build_negotiation_strategy_payload(
        user,
        address="123 Main St",
        target_user_id="other-user",
    )
    assert status == 403
    assert body["success"] is False
