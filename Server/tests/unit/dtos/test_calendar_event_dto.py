"""Unit tests for CalendarEventDTO."""

from __future__ import annotations

from unittest.mock import Mock, patch

from app.dtos.calendar.calendar_event import CalendarEventDTO, _has_create_metadata


def _google_event(**overrides):
    base = {
        "id": "event-123",
        "summary": "Test Event",
        "start": {"dateTime": "2024-01-01T10:00:00Z", "timeZone": "UTC"},
        "end": {"dateTime": "2024-01-01T11:00:00Z", "timeZone": "UTC"},
    }
    base.update(overrides)
    return base


def _calendar_row(**overrides):
    row = Mock()
    row.google_event_id = overrides.get("google_event_id", "event-123")
    row.itinerary = overrides.get("itinerary")
    row.event_type = overrides.get("event_type")
    row.meet_url = overrides.get("meet_url")
    row.conference_status = overrides.get("conference_status")
    return row


class TestCalendarEventDTOToResponse:
    def test_merges_db_overlays(self):
        row = _calendar_row(event_type="property_viewing")

        result = CalendarEventDTO.to_response(_google_event(), calendar_event_row=row)

        assert result["silverKeyEventType"] == "property_viewing"
        assert result["summary"] == "Test Event"
        assert "itinerary" not in result

    def test_overlays_virtual_meeting_and_meet_url(self):
        row = _calendar_row(
            meet_url="https://meet.google.com/abc-defg-hij",
            conference_status="success",
        )

        result = CalendarEventDTO.to_response(_google_event(), calendar_event_row=row)

        assert result["silverKeyVirtualMeetingEnabled"] is True
        assert result["hangoutLink"] == "https://meet.google.com/abc-defg-hij"

    def test_virtual_meeting_disabled_when_db_cleared(self):
        row = _calendar_row(meet_url=None, conference_status=None)

        result = CalendarEventDTO.to_response(
            _google_event(hangoutLink="https://meet.google.com/stale-link"),
            calendar_event_row=row,
        )

        assert result["silverKeyVirtualMeetingEnabled"] is False
        assert result["hangoutLink"] == "https://meet.google.com/stale-link"

    def test_preserves_google_metadata_keys(self):
        google = _google_event(
            kind="calendar#event",
            htmlLink="https://calendar.google.com/event?eid=abc",
            etag='"etag-1"',
        )
        result = CalendarEventDTO.to_response(google)
        assert result["kind"] == "calendar#event"
        assert result["htmlLink"] == "https://calendar.google.com/event?eid=abc"
        assert result["etag"] == '"etag-1"'

    def test_create_uses_create_response_when_metadata_present(self):
        google = _google_event(
            kind="calendar#event",
            etag='"etag-1"',
            htmlLink="https://calendar.google.com/event?eid=abc",
            created="2024-01-01T10:00:00.000Z",
            updated="2024-01-01T10:00:00.000Z",
            creator={"email": "user@example.com"},
            organizer={"email": "user@example.com"},
            sequence=0,
            iCalUID="ical-123",
            status="confirmed",
        )
        assert _has_create_metadata(google) is True
        result = CalendarEventDTO.to_response(google, create=True)
        assert result["status"] == "confirmed"
        assert result["kind"] == "calendar#event"

    def test_create_falls_back_without_full_metadata(self):
        google = _google_event(htmlLink="https://calendar.google.com/event?eid=abc")
        assert _has_create_metadata(google) is False
        result = CalendarEventDTO.to_response(google, create=True)
        assert result["htmlLink"] == "https://calendar.google.com/event?eid=abc"


class TestCalendarEventDTOEnrichEvents:
    @patch("app.dtos.calendar.calendar_event.db.session.scalars")
    def test_batch_merges_by_google_event_id(self, mock_scalars):
        row = _calendar_row(
            google_event_id="event-123",
            event_type="meeting",
        )
        mock_scalars.return_value.all.return_value = [row]

        events = [
            {
                "id": "event-123",
                "summary": "Listed",
                "start": {"dateTime": "2024-01-01T10:00:00Z"},
                "end": {"dateTime": "2024-01-01T11:00:00Z"},
            },
            {
                "id": "event-456",
                "summary": "No DB row",
                "start": {"dateTime": "2024-01-02T10:00:00Z"},
                "end": {"dateTime": "2024-01-02T11:00:00Z"},
            },
        ]

        enriched = CalendarEventDTO.enrich_events("user-123", events)

        assert len(enriched) == 2
        assert enriched[0]["silverKeyEventType"] == "meeting"
        assert "itinerary" not in enriched[0]
        assert "silverKeyEventType" not in enriched[1]

    def test_returns_empty_for_non_list(self):
        assert CalendarEventDTO.enrich_events("user-123", None) == []
