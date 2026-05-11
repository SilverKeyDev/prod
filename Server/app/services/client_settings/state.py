"""Merge, sanitize, and defaults for user client UI settings (JSON document)."""

from __future__ import annotations

import json
from typing import Any

# Keep in sync with Client packages/features/saved/utils/librarySort.ts
HOMES_SORT_ALLOWED = frozenset(
    {
        "date_desc",
        "date_asc",
        "price_asc",
        "price_desc",
        "address_asc",
    }
)
DOCUMENTS_SORT_ALLOWED = frozenset(["date_desc", "date_asc", "name_asc"])
DOCUSIGN_SORT_ALLOWED = frozenset(
    {
        "date_desc",
        "date_asc",
        "stage:draft",
        "stage:sent",
        "stage:delivered",
        "stage:signed",
        "stage:completed",
        "stage:voided",
        "stage:declined",
    }
)

LAYOUT_ALLOWED = frozenset({"grid", "list"})
CALENDAR_VIEW_ALLOWED = frozenset({"week", "month"})
# Active Library route tab; must match OpenAPI ClientSettings.saved.tab / schemas Tab enum.
SAVED_TAB_ALLOWED = frozenset({"homes", "documents", "forms-library", "agreements"})

LIBRARY_SECTIONS = frozenset({"homes", "documents", "docusign"})

# Max serialized size for entire settings object (bytes)
MAX_SETTINGS_JSON_BYTES = 512_000
# Max onboarding draft blob (bytes) after json serialization
MAX_ONBOARDING_DRAFT_BYTES = 200_000

MAX_VIEWING_TOUR_ANCHORS = 30
MAX_VIEWING_ANCHOR_ID_LEN = 80
MAX_VIEWING_ANCHOR_LABEL_LEN = 120
MAX_VIEWING_ENDPOINT_STRING_LEN = 500


def default_settings() -> dict[str, Any]:
    return {
        "v": 1,
        "library": {
            "homes": {"layout": "grid", "sort": "date_desc"},
            "documents": {"layout": "grid", "sort": "date_desc"},
            "docusign": {"layout": "grid", "sort": "date_desc"},
        },
        "saved": {"tab": "homes"},
        "calendar": {"shell": "month"},
    }


def _norm_sort(section: str, raw: Any) -> str:
    if not isinstance(raw, str):
        return default_settings()["library"][section]["sort"]
    s = raw.strip()
    if section == "homes" and s in HOMES_SORT_ALLOWED:
        return s
    if section == "documents" and s in DOCUMENTS_SORT_ALLOWED:
        return s
    if section == "docusign" and s in DOCUSIGN_SORT_ALLOWED:
        return s
    return default_settings()["library"][section]["sort"]


def _norm_layout(raw: Any) -> str:
    if isinstance(raw, str) and raw in LAYOUT_ALLOWED:
        return raw
    return "grid"


def _norm_calendar_view(raw: Any, default: str) -> str:
    if isinstance(raw, str) and raw in CALENDAR_VIEW_ALLOWED:
        return raw
    return default


def _deep_merge(base: dict[str, Any], patch: dict[str, Any]) -> dict[str, Any]:
    out = dict(base)
    for k, v in patch.items():
        if v is None:
            out.pop(k, None)
            continue
        if k in out and isinstance(out[k], dict) and isinstance(v, dict):
            out[k] = _deep_merge(out[k], v)
        else:
            out[k] = v
    return out


def _sanitize_library(raw: Any) -> dict[str, Any]:
    defaults = default_settings()["library"]
    if not isinstance(raw, dict):
        return dict(defaults)
    out: dict[str, Any] = {}
    for section in LIBRARY_SECTIONS:
        dflt = defaults[section]
        sec = raw.get(section)
        if not isinstance(sec, dict):
            out[section] = dict(dflt)
            continue
        out[section] = {
            "layout": _norm_layout(sec.get("layout")),
            "sort": _norm_sort(section, sec.get("sort")),
        }
    return out


def _sanitize_saved(raw: Any) -> dict[str, Any]:
    dflt = default_settings()["saved"]
    if not isinstance(raw, dict):
        return dict(dflt)
    tab = raw.get("tab")
    if isinstance(tab, str) and tab in SAVED_TAB_ALLOWED:
        return {"tab": tab}
    return dict(dflt)


def _sanitize_calendar(raw: Any) -> dict[str, Any]:
    dflt = default_settings()["calendar"]
    if not isinstance(raw, dict):
        return dict(dflt)
    return {
        "shell": _norm_calendar_view(raw.get("shell"), dflt["shell"]),
    }


def _strip_endpoint_string(val: Any, max_len: int) -> str | None:
    if not isinstance(val, str):
        return None
    s = val.strip()
    if not s:
        return None
    return s[:max_len]


def _sanitize_viewing_route_endpoint(raw: Any) -> dict[str, Any] | None:
    if not isinstance(raw, dict):
        return None
    out: dict[str, Any] = {}
    label = _strip_endpoint_string(raw.get("label"), MAX_VIEWING_ENDPOINT_STRING_LEN)
    if label is not None:
        out["label"] = label
    addr = _strip_endpoint_string(raw.get("address"), MAX_VIEWING_ENDPOINT_STRING_LEN)
    if addr is not None:
        out["address"] = addr
    for key in ("lat", "lng"):
        v = raw.get(key)
        if v is None:
            continue
        try:
            out[key] = float(v)
        except (TypeError, ValueError):
            continue
    if not any(k in out for k in ("address", "lat", "lng")):
        return None
    return out


def _sanitize_viewing_tour(raw: Any) -> dict[str, Any] | None:
    if raw is None:
        return None
    if not isinstance(raw, dict):
        return None
    anchors_out: list[dict[str, Any]] = []
    anchors_raw = raw.get("anchors")
    if isinstance(anchors_raw, list):
        for item in anchors_raw[:MAX_VIEWING_TOUR_ANCHORS]:
            if not isinstance(item, dict):
                continue
            aid = _strip_endpoint_string(item.get("id"), MAX_VIEWING_ANCHOR_ID_LEN)
            label = _strip_endpoint_string(item.get("label"), MAX_VIEWING_ANCHOR_LABEL_LEN)
            if aid is None or label is None:
                continue
            endpoint = _sanitize_viewing_route_endpoint(item.get("endpoint"))
            if endpoint is None:
                continue
            anchors_out.append({"id": aid, "label": label, "endpoint": endpoint})

    out: dict[str, Any] = {"anchors": anchors_out}
    dflt_raw = raw.get("default_start_anchor_id")
    dflt = _strip_endpoint_string(dflt_raw, MAX_VIEWING_ANCHOR_ID_LEN)
    if dflt is not None and any(a["id"] == dflt for a in anchors_out):
        out["default_start_anchor_id"] = dflt
    else:
        out["default_start_anchor_id"] = None
    return out


def _sanitize_onboarding_draft(raw: Any) -> dict[str, Any] | None:
    if raw is None:
        return None
    if not isinstance(raw, dict):
        return None
    # Shallow copy only JSON-serializable-friendly values; cap size
    try:
        dumped = json.dumps(raw, default=str)
    except (TypeError, ValueError):
        return None
    if len(dumped.encode("utf-8")) > MAX_ONBOARDING_DRAFT_BYTES:
        return None
    return raw


def sanitize_settings(raw: Any) -> dict[str, Any]:
    """Return a full sanitized settings object from arbitrary input."""
    base = default_settings()
    if not isinstance(raw, dict):
        return base
    out = dict(base)
    if "v" in raw:
        try:
            out["v"] = int(raw["v"])
        except (TypeError, ValueError):
            out["v"] = 1
    out["library"] = _sanitize_library(raw.get("library"))
    out["saved"] = _sanitize_saved(raw.get("saved"))
    out["calendar"] = _sanitize_calendar(raw.get("calendar"))
    od = _sanitize_onboarding_draft(raw.get("onboarding_draft"))
    if od is not None:
        out["onboarding_draft"] = od
    elif "onboarding_draft" in raw and raw["onboarding_draft"] is None:
        out.pop("onboarding_draft", None)

    vt = _sanitize_viewing_tour(raw.get("viewing_tour"))
    if vt is not None:
        out["viewing_tour"] = vt
    elif "viewing_tour" in raw and raw["viewing_tour"] is None:
        out.pop("viewing_tour", None)

    return out


def merge_and_sanitize(existing: dict[str, Any] | None, patch: dict[str, Any]) -> dict[str, Any]:
    """Deep-merge patch into existing, then sanitize. `None` in patch removes a top-level key."""
    current = sanitize_settings(existing) if existing else default_settings()
    merged = _deep_merge(current, patch)
    return sanitize_settings(merged)


def assert_settings_size(settings: dict[str, Any]) -> None:
    dumped = json.dumps(settings, default=str)
    if len(dumped.encode("utf-8")) > MAX_SETTINGS_JSON_BYTES:
        raise ValueError("settings too large")
