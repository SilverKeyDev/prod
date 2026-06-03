"""Google Calendar event dict + CalendarEvent ORM → OpenAPI `GoogleEvent` response."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from pydantic import ValidationError
from sqlalchemy import select

from app import db
from app.models.calendar.calendar_event import CalendarEvent
from app.schemas.generated import (
    GoogleEvent,
    GoogleEventCreateResponse,
    ViewingItinerary,
    ViewingRouteEndMode,
)
from app.utils.validation.helpers import sanitize_validation_errors_for_log
from logger import log

if TYPE_CHECKING:
    pass

_CREATE_METADATA_FIELDS = frozenset(
    {
        "kind",
        "etag",
        "htmlLink",
        "created",
        "updated",
        "creator",
        "organizer",
        "sequence",
        "iCalUID",
        "status",
    }
)


def _coerce_viewing_itinerary_enums(model: ViewingItinerary) -> ViewingItinerary:
    """Coerce string enum fields from legacy DB JSON before JSON serialization."""
    updates: dict[str, ViewingRouteEndMode] = {}
    if isinstance(model.end_mode, str):
        updates["end_mode"] = ViewingRouteEndMode(model.end_mode)
    elif model.end_mode is None:
        # Legacy rows omit end_mode; API contract treats that as last_property.
        updates["end_mode"] = ViewingRouteEndMode.last_property
    if updates:
        return model.model_copy(update=updates)
    return model


def _viewing_itinerary_response_dict(model: ViewingItinerary) -> dict[str, Any]:
    """Serialize ViewingItinerary with legacy defaults applied for API responses."""
    return _coerce_viewing_itinerary_enums(model).model_dump(mode="json", warnings=False)


def _itinerary_for_response(raw: dict[str, Any] | None) -> dict[str, Any] | None:
    """Validate itinerary against ViewingItinerary; tolerate legacy DB rows on failure."""
    if not raw:
        return None
    try:
        return _viewing_itinerary_response_dict(ViewingItinerary.model_validate(raw))
    except ValidationError as e:
        log.warn(
            "HTTP",
            "Calendar event itinerary failed ViewingItinerary validation; returning legacy shape",
            {"errors": sanitize_validation_errors_for_log(e.errors())},
        )
        return raw


def _has_create_metadata(payload: dict[str, Any]) -> bool:
    return all(field in payload for field in _CREATE_METADATA_FIELDS)


def _validate_event_payload(payload: dict[str, Any], *, create: bool) -> GoogleEvent | None:
    """Validate merged payload against OpenAPI; log and return None on failure."""
    schema: type[GoogleEvent]
    if create and _has_create_metadata(payload):
        schema = GoogleEventCreateResponse
    else:
        schema = GoogleEvent

    try:
        return schema.model_validate(payload)
    except ValidationError as e:
        log.warn(
            "HTTP",
            f"Calendar event failed {schema.__name__} validation",
            {
                "errors": sanitize_validation_errors_for_log(e.errors()),
                "event_id": payload.get("id"),
            },
        )
        return None


class CalendarEventDTO:
    """Build calendar event API payloads validated against generated OpenAPI models."""

    @classmethod
    def _merge_db_overlays(
        cls,
        payload: dict[str, Any],
        calendar_event_row: CalendarEvent | None,
    ) -> dict[str, Any]:
        if calendar_event_row is None:
            return payload

        if calendar_event_row.itinerary:
            payload["itinerary"] = _itinerary_for_response(calendar_event_row.itinerary)
        if calendar_event_row.event_type:
            payload["silverKeyEventType"] = calendar_event_row.event_type
        return payload

    @classmethod
    def to_response(
        cls,
        google_event: dict[str, Any],
        *,
        calendar_event_row: CalendarEvent | None = None,
        create: bool = False,
    ) -> dict[str, Any]:
        """
        Merge Google Calendar API fields with SilverKey DB overlays and validate at the DTO boundary.

        Returns the merged dict (preserving Google-only metadata keys) with normalized
        itinerary/silverKeyEventType when validation succeeds.
        """
        payload = dict(google_event) if isinstance(google_event, dict) else {}
        payload = cls._merge_db_overlays(payload, calendar_event_row)

        validated = _validate_event_payload(payload, create=create)
        if validated is not None:
            if validated.itinerary is not None:
                payload["itinerary"] = _viewing_itinerary_response_dict(validated.itinerary)
            if validated.silverKeyEventType is not None:
                payload["silverKeyEventType"] = validated.silverKeyEventType

        return payload

    @classmethod
    def enrich_events(cls, user_id: str, events: list[Any]) -> list[dict[str, Any]]:
        """Attach DB itinerary and silverKeyEventType to Google event dicts in a list."""
        if not events or not isinstance(events, list):
            return []

        ids = [e.get("id") for e in events if isinstance(e, dict) and e.get("id")]
        if not ids:
            return [dict(e) for e in events if isinstance(e, dict)]

        rows = db.session.scalars(
            select(CalendarEvent).where(
                CalendarEvent.user_id == user_id,
                CalendarEvent.google_event_id.in_(ids),
            )
        ).all()
        by_gid = {r.google_event_id: r for r in rows if r.google_event_id}

        enriched: list[dict[str, Any]] = []
        for ev in events:
            if not isinstance(ev, dict):
                continue
            row = by_gid.get(ev.get("id")) if ev.get("id") else None
            enriched.append(cls.to_response(ev, calendar_event_row=row))
        return enriched
