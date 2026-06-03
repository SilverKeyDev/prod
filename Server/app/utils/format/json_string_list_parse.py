"""Parse UI/DB fields that store a list of strings as JSON arrays or comma-separated text."""

from __future__ import annotations

import json
from typing import Any


def parse_json_or_csv_string_list(raw: Any) -> list[str]:
    """
    Parse a JSON-or-CSV id list stored as text (or Python list from ORM).

    Used for discovery profile arrays and other JSON/CSV text list fields.
    strips elements for JSON-derived lists and CSV splits on comma after trim.
    """
    if raw is None or raw == "":
        return []
    if isinstance(raw, list):
        out: list[str] = []
        for x in raw:
            if x is None:
                continue
            s = str(x).strip()
            if s:
                out.append(s)
        return out
    if not isinstance(raw, str):
        return []
    if not str(raw).strip():
        return []
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, list):
            return [_strip_nonempty(x) for x in parsed if _strip_nonempty(x)]
        one = _strip_nonempty(parsed)
        return [one] if one else []
    except (json.JSONDecodeError, TypeError):
        return [cid.strip() for cid in raw.split(",") if cid.strip()]


def _strip_nonempty(x: Any) -> str:
    s = "" if x is None else str(x).strip()
    return s
