"""Serialize/deserialize per-brokerage SkySlope AccessKey + AccessSecret."""

from __future__ import annotations

import json
from typing import Any

_PAYLOAD_VERSION = 1


def serialize_brokerage_credentials(*, access_key: str, access_secret: str) -> str:
    return json.dumps(
        {
            "v": _PAYLOAD_VERSION,
            "access_key": access_key.strip(),
            "access_secret": access_secret.strip(),
        }
    )


def parse_brokerage_credentials(plaintext: str) -> tuple[str, str]:
    """
    Return (access_key, access_secret).
    Supports JSON payloads and legacy plain-text (access key only).
    """
    trimmed = plaintext.strip()
    if not trimmed:
        return "", ""

    if trimmed.startswith("{"):
        try:
            data: dict[str, Any] = json.loads(trimmed)
        except json.JSONDecodeError:
            return trimmed, ""
        access_key = str(data.get("access_key") or "").strip()
        access_secret = str(data.get("access_secret") or "").strip()
        return access_key, access_secret
    return trimmed, ""
