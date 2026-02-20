"""
Helpers for fetching report JSON from S3 (e.g. for chat context).
"""

from __future__ import annotations

import json

from app.services.documents.s3_service import s3_service


def _download_json_from_s3(json_s3_key: str) -> dict | None:
    """
    Download JSON from S3 by key and return parsed dict, or None on failure.
    """
    raw = s3_service.get_pdf(json_s3_key)
    if raw is None:
        return None
    try:
        return json.loads(raw.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None
