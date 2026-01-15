"""
Event-related helpers for Google Calendar routes
Extracts event data parsing and manipulation utilities
"""

from datetime import datetime, timezone
from typing import Optional, Dict, Any

from app.utils.security.app_logging import get_logger

logger = get_logger()


def parse_google_datetime(datetime_str: Optional[str]) -> Optional[datetime]:
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
        normalized_str = datetime_str.replace('Z', '+00:00')
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
        if 'T' in datetime_str:
            # Extract date and time part (first 19 characters: YYYY-MM-DDTHH:MM:SS)
            return datetime.strptime(datetime_str[:19], "%Y-%m-%dT%H:%M:%S")
    except (ValueError, AttributeError):
        pass
    
    logger.warning(f"Failed to parse datetime string: {datetime_str}")
    return None


def extract_event_datetimes(google_event: Dict[str, Any]) -> tuple[Optional[datetime], Optional[datetime], str]:
    """
    Extract start and end datetimes from a Google Calendar event.
    
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
    
    # Parse start datetime
    if google_event.get("start") and google_event["start"].get("dateTime"):
        start_datetime = parse_google_datetime(google_event["start"]["dateTime"])
        timezone_str = google_event["start"].get("timeZone", "UTC")
    
    # Parse end datetime
    if google_event.get("end") and google_event["end"].get("dateTime"):
        end_datetime = parse_google_datetime(google_event["end"]["dateTime"])
        # Use end timezone if start timezone wasn't found
        if timezone_str == "UTC" and google_event["end"].get("timeZone"):
            timezone_str = google_event["end"].get("timeZone", "UTC")
    
    return start_datetime, end_datetime, timezone_str


def validate_max_results(max_results_str: Optional[str], default: int = 100, min_val: int = 1, max_val: int = 2500) -> int:
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


def extract_calendar_id_from_request(event_data: Dict[str, Any], default: str = "primary") -> str:
    """
    Extract calendar ID from event data, removing it from the dict.
    
    Args:
        event_data: Event data dictionary (will be modified)
        default: Default calendar ID if not provided
    
    Returns:
        Calendar ID string
    """
    return event_data.pop("calendarId", default)
