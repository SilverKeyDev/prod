"""SilverKey calendar dedupe: owner-only candidates and non-owner delete handling."""

from __future__ import annotations

from unittest.mock import Mock, patch

from googleapiclient.errors import HttpError


def _http_403_not_owner() -> HttpError:
    resp = Mock()
    resp.status = 403
    body = (
        b'{"error":{"code":403,"message":"Forbidden","errors":[{'
        b'"domain":"calendar","reason":"forbidden",'
        b'"message":"You need to have owner access to this calendar."}]}}'
    )
    return HttpError(resp, body)


def test_delete_calendar_returns_false_when_delete_requires_owner_access(app):
    """calendars().delete on a subscribed calendar must not raise; caller treats as skip."""
    from app.services.calendar.calendars.management import delete_calendar

    with app.app_context():
        with patch("app.services.calendar.calendars.calendar_delete.load_credentials"):
            with patch("app.services.calendar.calendars.calendar_delete.build") as mock_build:
                service_mock = Mock()
                delete_exec = Mock(side_effect=_http_403_not_owner())
                service_mock.calendars.return_value.delete.return_value.execute = delete_exec
                mock_build.return_value = service_mock
                result = delete_calendar(
                    user_id="user-123",
                    calendar_id="c_subscribed_1@group.calendar.google.com",
                    client_id="cid",
                    client_secret="sec",
                    token_endpoint="https://oauth2.googleapis.com/token",
                    scopes=["https://www.googleapis.com/auth/calendar"],
                )

                assert result is False
                delete_exec.assert_called_once()


def test_get_or_create_ignores_subscribed_silverkey_for_duplicate_deletion(app):
    """Owned + subscribed name match is one owned calendar — no calendars().delete."""
    from app.services.calendar.calendars.management import get_or_create_silverkey_calendar

    owned_id = "095993129e00000000000000000000000000000000000000000000@group.calendar.google.com"
    subscribed_id = (
        "c_a84c1c6e00000000000000000000000000000000000000000000@group.calendar.google.com"
    )

    list_payload = {
        "items": [
            {
                "id": owned_id,
                "summary": "SilverKey ~ Pat",
                "accessRole": "owner",
            },
            {
                "id": subscribed_id,
                "summary": "SilverKey ~ Pat",
                "accessRole": "reader",
            },
        ]
    }

    with app.app_context():
        with patch("app.services.calendar.calendars.silverkey_calendar.load_credentials"):
            with patch("app.services.calendar.calendars.silverkey_calendar.build") as mock_build:
                service_mock = Mock()
                service_mock.calendarList.return_value.list.return_value.execute.return_value = (
                    list_payload
                )
                mock_build.return_value = service_mock

                cal = get_or_create_silverkey_calendar(
                    user_id="user-123",
                    buyer_name=None,
                    client_id="cid",
                    client_secret="sec",
                    token_endpoint="https://oauth2.googleapis.com/token",
                    scopes=["https://www.googleapis.com/auth/calendar"],
                )

                assert cal.get("id") == owned_id
                service_mock.calendars.return_value.delete.assert_not_called()


def test_get_or_create_deletes_second_owned_duplicate(app):
    """Two owned SilverKey calendars: delete extras (mocked success)."""
    from app.services.calendar.calendars.management import get_or_create_silverkey_calendar

    first_id = "a_owned@group.calendar.google.com"
    second_id = "b_owned@group.calendar.google.com"

    list_payload = {
        "items": [
            {"id": first_id, "summary": "SilverKey ~ A", "accessRole": "owner"},
            {"id": second_id, "summary": "SilverKey ~ B", "accessRole": "owner"},
        ]
    }

    with app.app_context():
        with patch("app.services.calendar.calendars.silverkey_calendar.load_credentials"):
            with patch("app.services.calendar.calendars.silverkey_calendar.build") as mock_build:
                service_mock = Mock()
                service_mock.calendarList.return_value.list.return_value.execute.return_value = (
                    list_payload
                )
                delete_execute = Mock(return_value={})
                service_mock.calendars.return_value.delete.return_value.execute = delete_execute
                mock_build.return_value = service_mock

                with patch(
                    "app.services.calendar.calendars.silverkey_calendar.should_skip_silverkey_owned_dedupe",
                    return_value=False,
                ):
                    cal = get_or_create_silverkey_calendar(
                        user_id="user-dedupe",
                        buyer_name=None,
                        client_id="cid",
                        client_secret="sec",
                        token_endpoint="https://oauth2.googleapis.com/token",
                        scopes=["https://www.googleapis.com/auth/calendar"],
                    )

                assert cal.get("id") == first_id
                delete_execute.assert_called_once()
                call_kwargs = service_mock.calendars.return_value.delete.call_args
                assert call_kwargs[1]["calendarId"] == second_id
