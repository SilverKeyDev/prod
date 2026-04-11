"""
Event-related helpers for Google Calendar routes
Extracts event data parsing and manipulation utilities
"""

from datetime import datetime, time, timedelta, timezone
from typing import Any
from zoneinfo import ZoneInfo

from app.utils.security.app_logging import get_logger

logger = get_logger()


def parse_google_datetime(datetime_str: str | None) -> datetime | None:
    """
    Parse a Google Calendar datetime string to a Python datetime object.

    Handles multiple datetime formats and fallbacks:
    1. ISO format (Python 3.7+)
    2. dateutil parser (if available)
    3. strptime for common formats

    Args:
        datetime_str: ISO 8601 datetime string from Google Calendar API

    Returns:
        Parsed datetime object or None if parsing fails
    """
    if not datetime_str:
        return None

    # Try ISO format parsing (Python 3.7+)
    try:
        # Replace 'Z' with '+00:00' for timezone-aware parsing
        normalized_str = datetime_str.replace("Z", "+00:00")
        return datetime.fromisoformat(normalized_str)
    except (ValueError, AttributeError):
        pass

    # Fallback to dateutil parser if available
    try:
        from dateutil import parser as date_parser

        return date_parser.parse(datetime_str)
    except ImportError:
        pass
    except Exception:
        pass

    # Last resort: use datetime.strptime for common formats
    try:
        # Try to parse common ISO format without timezone
        if "T" in datetime_str:
            # Extract date and time part (first 19 characters: YYYY-MM-DDTHH:MM:SS)
            return datetime.strptime(datetime_str[:19], "%Y-%m-%dT%H:%M:%S")
    except (ValueError, AttributeError):
        pass

    logger.warning(f"Failed to parse datetime string: {datetime_str}")
    return None


def _parse_ymd(date_str: str | None) -> datetime | None:
    if not date_str or not isinstance(date_str, str):
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        return None


def extract_event_datetimes(
    google_event: dict[str, Any],
) -> tuple[datetime | None, datetime | None, str]:
    """
    Extract start and end datetimes from a Google Calendar event.

    All-day events use start.date / end.date (end date is exclusive per Google). Stored in DB as
    naive UTC: start = midnight UTC on the first day; end = last inclusive day at 23:59:59.999999 UTC.
    The ``timezone`` column holds the event/calendar zone when present for display.

    Args:
        google_event: Google Calendar event dictionary

    Returns:
        Tuple of (start_datetime, end_datetime, timezone_str):
        - start_datetime: Parsed start datetime or None
        - end_datetime: Parsed end datetime or None
        - timezone_str: Timezone string from event or "UTC" as default
    """
    start_datetime = None
    end_datetime = None
    timezone_str = "UTC"

    start_obj = google_event.get("start") or {}
    end_obj = google_event.get("end") or {}

    # All-day: start.date / end.date (YYYY-MM-DD), end exclusive
    if start_obj.get("date") and end_obj.get("date") and not start_obj.get("dateTime"):
        start_naive = _parse_ymd(start_obj.get("date"))
        end_exclusive_naive = _parse_ymd(end_obj.get("date"))
        if start_naive and end_exclusive_naive:
            timezone_str = start_obj.get("timeZone") or end_obj.get("timeZone") or "UTC"
            try:
                tz = ZoneInfo(timezone_str)
            except Exception:
                tz = ZoneInfo("UTC")
                timezone_str = "UTC"

            start_date = start_naive.date()
            end_exclusive = end_exclusive_naive.date()
            last_inclusive = end_exclusive - timedelta(days=1)
            if last_inclusive < start_date:
                last_inclusive = start_date

            start_local = datetime.combine(start_date, time.min, tzinfo=tz)
            end_local = datetime.combine(last_inclusive, time(23, 59, 59, 999999), tzinfo=tz)
            start_datetime = start_local.astimezone(timezone.utc).replace(tzinfo=None)
            end_datetime = end_local.astimezone(timezone.utc).replace(tzinfo=None)
        return start_datetime, end_datetime, timezone_str

    # Timed: dateTime on start/end
    if start_obj.get("dateTime"):
        start_datetime = parse_google_datetime(start_obj["dateTime"])
        timezone_str = start_obj.get("timeZone", "UTC")

    if end_obj.get("dateTime"):
        end_datetime = parse_google_datetime(end_obj["dateTime"])
        if timezone_str == "UTC" and end_obj.get("timeZone"):
            timezone_str = end_obj.get("timeZone", "UTC")

    return start_datetime, end_datetime, timezone_str


def validate_max_results(
    max_results_str: str | None, default: int = 100, min_val: int = 1, max_val: int = 2500
) -> int:
    """
    Validate and clamp maxResults parameter for Google Calendar API.

    Args:
        max_results_str: String value from request parameter
        default: Default value if parsing fails
        min_val: Minimum allowed value
        max_val: Maximum allowed value (Google Calendar API limit is 2500)

    Returns:
        Validated integer value within the allowed range
    """
    if not max_results_str:
        return default

    try:
        max_results = int(max_results_str)
        # Clamp between min and max
        return max(min_val, min(max_results, max_val))
    except (ValueError, TypeError):
        logger.warning(f"Invalid maxResults value: {max_results_str}, using default {default}")
        return default


def extract_calendar_id_from_request(event_data: dict[str, Any], default: str = "primary") -> str:
    """
    Extract calendar ID from event data, removing it from the dict.

    Args:
        event_data: Event data dictionary (will be modified)
        default: Default calendar ID if not provided

    Returns:
        Calendar ID string
    """
    return event_data.pop("calendarId", default)
