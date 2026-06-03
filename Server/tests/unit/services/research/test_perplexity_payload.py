"""Unit tests for research report Perplexity payload construction."""

from app.services.research.report_generation.report_payload_builder import (
    _response_format_for,
    build_payload,
)


def test_research_response_format_defaults_to_json_object():
    assert _response_format_for("demographics") == {"type": "json_object"}


def test_research_build_payload_for_demographics_section():
    payload = build_payload(
        "demographics",
        "789 Pine Rd, Austin, TX",
        "sonar-pro",
        params={"temperature": 0.1},
    )
    assert payload["model"] == "sonar-pro"
    assert payload["temperature"] == 0.1
    assert payload["response_format"]["type"] == "json_object"
    user_content = payload["messages"][1]["content"]
    assert "demographics" in user_content
    assert "789 Pine Rd" in user_content
