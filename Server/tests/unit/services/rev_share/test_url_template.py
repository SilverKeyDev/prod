"""Tests for rev-share URL template interpolation."""

from app.services.rev_share.url_template import (
    interpolate_destination_url,
    validate_template_placeholders,
)


def test_interpolate_allowed_placeholders():
    url = interpolate_destination_url(
        "https://example.com/?a={agent_id}&b={buyer_id}",
        agent_id="agent-1",
        link_id="link-1",
        buyer_id="buyer-2",
    )
    assert "agent-1" in url
    assert "buyer-2" in url


def test_validate_unknown_placeholder():
    unknown = validate_template_placeholders("https://x.com/{evil}")
    assert "evil" in unknown
