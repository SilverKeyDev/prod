"""Resolve partner rev share URLs for outbound redirects (optional SilverKey placeholders)."""

from __future__ import annotations

import re
from typing import Any
from urllib.parse import quote

_ALLOWED_PLACEHOLDERS = frozenset(
    {"agent_id", "buyer_id", "transaction_id", "link_id", "partner_slug"}
)
_PLACEHOLDER_RE = re.compile(r"\{([a-z_]+)\}")


def interpolate_destination_url(
    template: str,
    *,
    link_id: str,
    agent_id: str | None = None,
    buyer_id: str | None = None,
    transaction_id: str | None = None,
    partner_slug: str | None = None,
    extra: dict[str, str] | None = None,
) -> str:
    """
    Replace allowed ``{placeholder}`` tokens in the partner destination template.

    Unknown placeholders are left unchanged so misconfigured templates fail visibly.
    """
    values: dict[str, str] = {
        "link_id": link_id,
    }
    if agent_id:
        values["agent_id"] = agent_id
    if buyer_id:
        values["buyer_id"] = buyer_id
    if transaction_id:
        values["transaction_id"] = transaction_id
    if partner_slug:
        values["partner_slug"] = partner_slug
    if extra:
        for key, val in extra.items():
            if key in _ALLOWED_PLACEHOLDERS and val:
                values[key] = val

    def _replace(match: re.Match[str]) -> str:
        key = match.group(1)
        if key not in _ALLOWED_PLACEHOLDERS:
            return match.group(0)
        raw = values.get(key)
        if raw is None:
            return match.group(0)
        return quote(str(raw), safe="")

    return _PLACEHOLDER_RE.sub(_replace, template)


def validate_template_placeholders(template: str) -> list[str]:
    """Return unknown placeholder names in a template (for admin validation)."""
    unknown: list[str] = []
    for match in _PLACEHOLDER_RE.finditer(template):
        key = match.group(1)
        if key not in _ALLOWED_PLACEHOLDERS:
            unknown.append(key)
    return unknown


def append_query_params(base_url: str, params: dict[str, Any]) -> str:
    """Append non-empty query params to a URL (used for optional prefill passthrough)."""
    from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

    parsed = urlparse(base_url)
    existing = dict(parse_qsl(parsed.query, keep_blank_values=False))
    for key, value in params.items():
        if value is None:
            continue
        text = str(value).strip()
        if text:
            existing[key] = text
    new_query = urlencode(existing)
    return urlunparse(parsed._replace(query=new_query))
