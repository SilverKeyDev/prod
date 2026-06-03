"""Presigned partner logo URLs for admin and buyer-facing placements."""

from __future__ import annotations


def resolve_partner_logo_url(logo_url: str | None) -> str | None:
    """Return http(s) URLs as-is; presign S3 keys for integration-logos/."""
    if not logo_url:
        return None
    trimmed = logo_url.strip()
    if not trimmed:
        return None
    if trimmed.startswith("http://") or trimmed.startswith("https://"):
        return trimmed
    if trimmed.startswith("/"):
        return trimmed

    from app.services.documents import s3_service

    if not s3_service or not s3_service.s3_client:
        return None
    return s3_service.generate_view_url(trimmed)


def enrich_partner_dict_logo(partner_dict: dict) -> dict:
    out = dict(partner_dict)
    raw = out.get("logo_url")
    presigned = resolve_partner_logo_url(raw)
    if presigned:
        out["logo_url"] = presigned
    return out
