"""Serialize DocuSign SDK models to REST JSON-compatible dicts (camelCase)."""

from __future__ import annotations

from typing import Any

from docusign_esign.client.api_client import ApiClient

_client = ApiClient()


def docusign_sanitize(obj: Any) -> Any:
    return _client.sanitize_for_serialization(obj)
