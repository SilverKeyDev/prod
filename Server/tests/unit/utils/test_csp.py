"""Tests for Content-Security-Policy builder."""

from app.utils.security.csp import build_content_security_policy


def test_csp_connect_src_includes_posthog_us_cloud():
    policy = build_content_security_policy()
    assert "https://us.i.posthog.com" in policy
    assert "https://us.posthog.com" in policy
