"""Unit tests for OpenAPI request body coercion helpers."""

from __future__ import annotations

import pytest

from app.utils.validation.decorators import _coerce_json_body_for_schema

from .validation_decorator_test_schemas import (
    AddCalendarACLRequest,
    AddCommentRequest,
    AddFeedLikeRequest,
    BulkUpdateFavoritesRequest,
    ClientAvailabilityRequest,
    ClientErrorReport,
    CreateCalendarRequest,
    FreebusyRequest,
    UpdateChecklistRequest,
    UpdateTaskChecklistRequest,
    ValidRequestBody,
)


def test_coerce_none_returns_empty_dict():
    assert _coerce_json_body_for_schema(CreateCalendarRequest, None) == {}


def test_coerce_plain_dict_unchanged_when_no_branch():
    payload = {"email": "a@example.com"}
    assert _coerce_json_body_for_schema(ValidRequestBody, payload) == payload


def test_coerce_create_calendar_request_maps_name_to_summary():
    raw = {"name": "Work Calendar", "timeZone": "America/New_York"}
    out = _coerce_json_body_for_schema(CreateCalendarRequest, raw)
    assert out["summary"] == "Work Calendar"
    assert out["name"] == "Work Calendar"


def test_coerce_create_calendar_request_keeps_existing_summary():
    raw = {"name": "Ignored", "summary": "Primary"}
    out = _coerce_json_body_for_schema(CreateCalendarRequest, raw)
    assert out["summary"] == "Primary"


def test_coerce_add_calendar_acl_request_builds_scope_from_agent_email():
    raw = {"agent_email": "agent@example.com", "role": "reader"}
    out = _coerce_json_body_for_schema(AddCalendarACLRequest, raw)
    assert out["scope"] == {"type": "user", "value": "agent@example.com"}
    assert out["role"] == "reader"


def test_coerce_add_calendar_acl_request_default_writer_role():
    raw = {"agent_email": "agent@example.com"}
    out = _coerce_json_body_for_schema(AddCalendarACLRequest, raw)
    assert out["role"] == "writer"


def test_coerce_freebusy_request_builds_items_from_calendar_ids():
    raw = {"calendarIds": ["cal-a", "cal-b"]}
    out = _coerce_json_body_for_schema(FreebusyRequest, raw)
    assert out["items"] == [{"id": "cal-a"}, {"id": "cal-b"}]


def test_coerce_freebusy_request_defaults_primary_when_no_calendar_ids():
    raw = {"timeMin": "2020-01-01T00:00:00Z"}
    out = _coerce_json_body_for_schema(FreebusyRequest, raw)
    assert out["items"] == [{"id": "primary"}]


def test_coerce_client_availability_request_renames_legacy_fields():
    raw = {
        "timeMin": "2020-01-01",
        "timeMax": "2020-01-02",
        "timeZone": "UTC",
    }
    out = _coerce_json_body_for_schema(ClientAvailabilityRequest, raw)
    assert out["start_date"] == "2020-01-01"
    assert out["end_date"] == "2020-01-02"
    assert out["timezone"] == "UTC"
    assert "timeMin" not in out
    assert "timeMax" not in out
    assert "timeZone" not in out


def test_coerce_update_task_checklist_request_wraps_checked_ids():
    raw = {"checkedIds": [1, 2, 3.0, True, "skip"]}
    out = _coerce_json_body_for_schema(UpdateTaskChecklistRequest, raw)
    assert out == {"data": {"items": [], "checkedIds": [1, 2, 3]}}


def test_coerce_update_checklist_request_list_body():
    assert _coerce_json_body_for_schema(UpdateChecklistRequest, [4, 5]) == {
        "checklist": {"checkedIds": [4, 5]}
    }


def test_coerce_bulk_update_favorites_request_list_body():
    favorites = [{"home_id": "h1"}, {"home_id": "h2"}]
    assert _coerce_json_body_for_schema(BulkUpdateFavoritesRequest, favorites) == {
        "favorites": favorites
    }


@pytest.mark.parametrize("schema", [AddFeedLikeRequest, AddCommentRequest])
def test_coerce_feed_like_maps_home_id_from_camel_case(schema):
    raw = {"homeId": "  abc123  "}
    out = _coerce_json_body_for_schema(schema, raw)
    assert out["home_id"] == "abc123"


def test_coerce_client_error_report_fills_error_message_from_message():
    raw = {"message": "Something broke"}
    out = _coerce_json_body_for_schema(ClientErrorReport, raw)
    assert out["error_message"] == "Something broke"


def test_coerce_client_error_report_falls_back_to_stack_snippet():
    raw = {"stack": "Traceback line 1\nline 2"}
    out = _coerce_json_body_for_schema(ClientErrorReport, raw)
    assert out["error_message"] == raw["stack"]


def test_coerce_client_error_report_default_message_when_empty():
    out = _coerce_json_body_for_schema(ClientErrorReport, {})
    assert out["error_message"] == "(no message)"


def test_coerce_client_error_report_maps_user_agent():
    raw = {"userAgent": "TestAgent/1.0", "error_message": "err"}
    out = _coerce_json_body_for_schema(ClientErrorReport, raw)
    assert out["user_agent"] == "TestAgent/1.0"


def test_coerce_non_dict_non_list_returns_empty_dict():
    assert _coerce_json_body_for_schema(ValidRequestBody, ["not", "a", "dict"]) == {}
