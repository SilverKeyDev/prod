"""Google Calendar API mocks for pytest."""

from contextlib import ExitStack
from unittest.mock import Mock, patch

import pytest


@pytest.fixture
def mock_google_calendar():
    """Mock Google Calendar API (patch `build` at each module import site)."""
    service_mock = Mock()
    events_mock = Mock()
    calendars_mock = Mock()

    events_mock.list = Mock(
        return_value=Mock(
            execute=Mock(
                return_value={
                    "items": [
                        {
                            "id": "event-123",
                            "summary": "Test Event",
                            "start": {"dateTime": "2024-01-01T10:00:00Z"},
                            "end": {"dateTime": "2024-01-01T11:00:00Z"},
                        }
                    ]
                }
            )
        )
    )
    events_mock.insert = Mock(
        return_value=Mock(
            execute=Mock(
                return_value={
                    "id": "new-event-123",
                    "summary": "New Event",
                    "htmlLink": "https://calendar.google.com/event?eid=...",
                    "start": {"dateTime": "2024-02-01T10:00:00Z", "timeZone": "UTC"},
                    "end": {"dateTime": "2024-02-01T11:00:00Z", "timeZone": "UTC"},
                    "status": "confirmed",
                }
            )
        )
    )
    events_mock.update = Mock(return_value=Mock(execute=Mock(return_value={"id": "event-123"})))
    events_mock.delete = Mock(return_value=Mock(execute=Mock(return_value={})))

    calendars_mock.list = Mock(
        return_value=Mock(
            execute=Mock(
                return_value={
                    "items": [
                        {
                            "id": "primary",
                            "summary": "Primary Calendar",
                            "accessRole": "owner",
                        }
                    ]
                }
            )
        )
    )
    calendars_mock.insert = Mock(
        return_value=Mock(
            execute=Mock(
                return_value={
                    "id": "silverkey-calendar-123",
                    "summary": "SilverKey Calendar",
                }
            )
        )
    )

    calendar_list_ops = Mock()
    calendar_list_ops.list = calendars_mock.list
    acl_mock = Mock()
    acl_mock.insert = Mock(
        return_value=Mock(execute=Mock(return_value={"id": "acl-rule-123", "role": "reader"}))
    )

    freebusy_mock = Mock()
    freebusy_mock.query.return_value.execute.return_value = {
        "calendars": {
            "primary": {
                "busy": [
                    {
                        "start": "2024-02-01T10:00:00Z",
                        "end": "2024-02-01T11:00:00Z",
                    }
                ]
            }
        }
    }

    service_mock.events = Mock(return_value=events_mock)
    service_mock.calendars = Mock(return_value=calendars_mock)
    service_mock.calendarList = Mock(return_value=calendar_list_ops)
    service_mock.acl = Mock(return_value=acl_mock)
    service_mock.freebusy = Mock(return_value=freebusy_mock)

    build_patch_targets = (
        "googleapiclient.discovery.build",
        "app.services.calendar.events.operations.build",
        "app.services.calendar.events.operations_list_events.build",
        "app.services.calendar.calendars.calendar_create.build",
        "app.services.calendar.calendars.calendar_delete.build",
        "app.services.calendar.calendars.silverkey_calendar.build",
        "app.services.calendar.calendars.sharing.build",
        "app.services.calendar.calendars.resolution.build",
        "app.services.calendar.availability.freebusy.build",
    )

    with ExitStack() as stack:
        first_patch = None
        for target in build_patch_targets:
            p = stack.enter_context(patch(target))
            p.return_value = service_mock
            if first_patch is None:
                first_patch = p
        yield first_patch
