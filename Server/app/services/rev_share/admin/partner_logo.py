"""Presigned partner logo URLs for admin and buyer-facing placements."""

from __future__ import annotations

import os

LOGO_ALLOWED_MIME_TYPES: dict[str, list[str]] = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/gif": [".gif"],
    "image/webp": [".webp"],
}

LOGO_MAX_BYTES = 15 * 1024 * 1024


def is_external_logo_reference(value: str | None) -> bool:
    """True when value is a URL path clients must not persist as the stored S3 key."""
    if not value:
        return False
    trimmed = value.strip()
    return trimmed.startswith(("http://", "https://", "/"))


def coerce_logo_url_for_storage(value: object | None) -> str | None | object:
    """
    Normalize logo_url for DB storage.

    Returns:
        str — S3 key to store
        None — clear logo
        _SKIP_LOGO_UPDATE — caller should not change partner.logo_url (e.g. presigned URL in PATCH)
    """
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    if is_external_logo_reference(text):
        return _SKIP_LOGO_UPDATE
    return text


_SKIP_LOGO_UPDATE = object()


def content_type_for_logo_key(s3_key: str, fallback: str = "image/png") -> str:
    ext = os.path.splitext(s3_key.lower())[1]
    return {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
    }.get(ext, fallback)


def resolve_partner_logo_url(
    logo_url: str | None, *, content_type: str | None = None
) -> str | None:
    """Return http(s) URLs as-is; presign S3 keys for integration-logos/."""
    if not logo_url:
        return None
    trimmed = logo_url.strip()
    if not trimmed:
        return None
    if is_external_logo_reference(trimmed):
        return trimmed

    from app.services.documents import s3_service

    if not s3_service or not s3_service.s3_client:
        return None
    mime = content_type or content_type_for_logo_key(trimmed)
    return s3_service.generate_view_url(trimmed, content_type=mime)


def delete_stored_partner_logo(logo_url: str | None) -> None:
    """Best-effort removal of an S3-stored integration logo key."""
    if not logo_url or is_external_logo_reference(logo_url):
        return
    from app.services.documents import s3_service

    if not s3_service or not s3_service.s3_client:
        return
    try:
        s3_service.delete_pdf(logo_url.strip())
    except Exception:
        pass


def enrich_partner_dict_logo(partner_dict: dict) -> dict:
    out = dict(partner_dict)
    raw = out.get("logo_url")
    presigned = resolve_partner_logo_url(raw if isinstance(raw, str) else None)
    if presigned:
        out["logo_url"] = presigned
    return out
