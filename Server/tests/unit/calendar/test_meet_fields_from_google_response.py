"""Tests for Meet metadata derived from Google Calendar API event payloads."""

from app.services.calendar.events.creation import meet_fields_from_google_response


def test_meet_success_when_hangout_link():
    url, status = meet_fields_from_google_response(
        {"hangoutLink": "https://meet.google.com/abc-defg-hij"},
        meet_requested=True,
    )
    assert url == "https://meet.google.com/abc-defg-hij"
    assert status == "success"


def test_meet_pending():
    url, status = meet_fields_from_google_response(
        {"conferenceData": {"createRequest": {"status": {"statusCode": "pending"}}}},
        meet_requested=True,
    )
    assert url is None
    assert status == "pending"


def test_meet_failure_after_request_without_link():
    url, status = meet_fields_from_google_response({}, meet_requested=True)
    assert url is None
    assert status == "failure"


def test_no_meet_when_not_requested():
    url, status = meet_fields_from_google_response({}, meet_requested=False)
    assert url is None
    assert status is None
