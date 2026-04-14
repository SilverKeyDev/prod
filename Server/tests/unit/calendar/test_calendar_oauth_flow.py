"""Tests for Google Calendar OAuth authorize URL scope selection."""

from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

from app.services.calendar.oauth.flow import build_auth_url
from app.services.calendar.permissions.constants import oauth_requested_scope_urls


class TestCalendarOAuthFlowScopes:
    def test_oauth_requested_scope_urls_excludes_full_calendar_and_events_freebusy(self) -> None:
        urls = oauth_requested_scope_urls()
        assert "https://www.googleapis.com/auth/calendar" not in urls
        assert "https://www.googleapis.com/auth/calendar.events.freebusy" not in urls
        assert "https://www.googleapis.com/auth/calendar.freebusy" in urls
        assert "https://www.googleapis.com/auth/calendar.app.created" in urls

    def test_build_auth_url_scope_query_never_includes_excluded_scopes(self) -> None:
        with patch("app.services.calendar.oauth.flow.db.session.add"):
            with patch("app.services.calendar.oauth.flow.db.session.commit"):
                auth_url, _state = build_auth_url(
                    client_id="cid",
                    client_secret="sec",
                    redirect_uri="https://example.com/cb",
                    auth_endpoint="https://accounts.google.com/o/oauth2/v2/auth",
                    scopes=[],
                    user_id="user-1",
                )
        parsed = urlparse(auth_url)
        q = parse_qs(parsed.query)
        scope_param = q.get("scope", [""])[0]
        parts = scope_param.split()
        assert "https://www.googleapis.com/auth/calendar" not in parts
        assert "https://www.googleapis.com/auth/calendar.events.freebusy" not in parts
