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
