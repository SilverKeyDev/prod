"""Shared constants and JSON body coercion for OpenAPI validation decorators."""

import os
from typing import Any

from pydantic import BaseModel

# Validation mode: gradual (log + accept) or strict (reject invalid)
VALIDATION_MODE = os.getenv("OPENAPI_VALIDATION_MODE", "gradual")

OPENAPI_VALIDATE_REQUEST_ATTR = "_openapi_validate_request_schema"
OPENAPI_VALIDATE_FORM_ATTR = "_openapi_validate_form_schema"


def coerce_json_body_for_schema(schema: type[BaseModel], json_data: Any) -> dict[str, Any]:
    """
    Normalize legacy JSON bodies so validation receives a dict.

    Some routes historically accepted a raw JSON array while OpenAPI describes an object.
    """
    if json_data is None:
        return {}
    if isinstance(json_data, dict):
        d: dict[str, Any] = dict(json_data)
        name = schema.__name__
        # Google Calendar legacy bodies (OpenAPI uses different field names / nesting).
        if name == "CreateCalendarRequest" and "summary" not in d and "name" in d:
            d = {**d, "summary": d["name"]}
        if name == "AddCalendarACLRequest" and "scope" not in d and d.get("agent_email"):
            d = {
                "role": d.get("role", "writer"),
                "scope": {"type": "user", "value": d["agent_email"]},
            }
        if name == "FreebusyRequest":
            if "items" not in d:
                ids = d.get("calendarIds") or ["primary"]
                d = {**d, "items": [{"id": cid} for cid in ids]}
        if name == "ClientAvailabilityRequest":
            if "start_date" not in d and "timeMin" in d:
                d["start_date"] = d.pop("timeMin")
            if "end_date" not in d and "timeMax" in d:
                d["end_date"] = d.pop("timeMax")
            if "timezone" not in d and "timeZone" in d:
                d["timezone"] = d.pop("timeZone")
        if name == "UpdateTaskChecklistRequest":
            if "data" not in d and "checkedIds" in d:
                raw_ids = d.get("checkedIds")
                if isinstance(raw_ids, list):
                    coerced_ids: list[int] = []
                    for x in raw_ids:
                        if isinstance(x, bool):
                            continue
                        if isinstance(x, int):
                            coerced_ids.append(x)
                        elif isinstance(x, float) and x.is_integer():
                            coerced_ids.append(int(x))
                    return {"data": {"items": [], "checkedIds": coerced_ids}}
        if name in ("AddFeedLikeRequest", "AddCommentRequest"):
            if "home_id" not in d or d.get("home_id") in (None, ""):
                hid = d.get("homeId") or d.get("home_id")
                if hid is not None:
                    d = {**d, "home_id": str(hid).strip() if hid else ""}
        if name == "ClientErrorReport":
            out = dict(d)
            if not out.get("error_message"):
                msg = out.get("message") or out.get("name") or ""
                if not msg and out.get("stack"):
                    msg = str(out["stack"])[:2000]
                out["error_message"] = msg if msg else "(no message)"
            if "user_agent" not in out and out.get("userAgent"):
                out["user_agent"] = out["userAgent"]
            return out
        return d
    # Match OpenAPI-generated class names without importing app.schemas (heavy import graph).
    if schema.__name__ == "UpdateChecklistRequest" and isinstance(json_data, list):
        return {"checklist": {"checkedIds": json_data}}
    if schema.__name__ == "BulkUpdateFavoritesRequest" and isinstance(json_data, list):
        return {"favorites": json_data}
    # Non-dict bodies cannot be passed as **kwargs to the schema
    return {}


# Backward-compatible alias for tests and internal callers
_coerce_json_body_for_schema = coerce_json_body_for_schema
