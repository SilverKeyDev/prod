"""Unit tests for negotiation Perplexity payload construction."""

from app.services.negotiation.payload_builder import _response_format_for, build_payload


def test_response_format_for_strategy_uses_json_schema():
    fmt = _response_format_for("strategy")
    assert fmt["type"] == "json_schema"
    assert fmt["json_schema"]["name"] == "negotiation_strategy"
    assert fmt["json_schema"]["strict"] is True
    assert "properties" in fmt["json_schema"]["schema"]


def test_response_format_for_unknown_section_returns_json_object():
    assert _response_format_for("other") == {"type": "json_object"}


def test_build_payload_includes_user_budget_in_messages():
    payload = build_payload(
        "strategy",
        "123 Main St",
        "sonar-pro",
        user_preferences={
            "home_budget_min": 400000,
            "home_budget_max": 550000,
            "preferred_home_features": ["garage"],
        },
    )
    user_content = payload["messages"][1]["content"]
    assert "$400,000 - $550,000" in user_content
    assert "garage" in user_content
    assert payload["model"] == "sonar-pro"
    assert payload["response_format"]["type"] == "json_schema"


def test_build_payload_omits_preferences_block_when_empty():
    payload = build_payload("negotiation_strategy", "456 Oak Ave", "sonar-pro")
    user_content = payload["messages"][1]["content"]
    assert "Buyer Profile & Strategy Context" not in user_content
    assert "456 Oak Ave" in user_content


def test_build_payload_rejects_unsupported_section_type():
    try:
        build_payload("market_summary", "123 Main St", "sonar-pro")
        raised = False
    except ValueError as exc:
        raised = True
        assert "Unsupported section_type" in str(exc)
    assert raised
