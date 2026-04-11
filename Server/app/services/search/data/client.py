"""Pooled HTTP client for Slipstream API with retry/backoff and auth injection.

Example full JSON for ``GET /ws/listings/get`` (single home, ``details=true``): see
``slipstream_response_reference.SLIPSTREAM_LISTINGS_GET_RESPONSE_EXAMPLE``.
"""

from __future__ import annotations

from typing import Any

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from .config import SLIPSTREAM_BASE, SLIPSTREAM_MARKET, SLIPSTREAM_PRIVATE


def _build_session() -> requests.Session:
    """Build pooled session with retry/backoff for Slipstream."""
    s = requests.Session()
    retry = Retry(
        total=5,
        backoff_factor=0.5,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=frozenset(["GET", "POST"]),
        raise_on_status=False,
    )
    s.mount("https://", HTTPAdapter(max_retries=retry))  # type: ignore[arg-type]
    return s


_session: requests.Session | None = None


def get_session() -> requests.Session:
    """Return the module-level pooled session (lazily created)."""
    global _session
    if _session is None:
        _session = _build_session()
    return _session


def get_slipstream_headers() -> dict[str, str]:
    """Standard Slipstream request headers."""
    return {
        "Authorization": SLIPSTREAM_PRIVATE or "",
        "Accept": "application/json",
    }


def slipstream_get(
    path: str,
    params: dict[str, Any] | None = None,
    timeout: int = 300,
) -> requests.Response:
    """Issue a GET to Slipstream, injecting auth header and default market param."""
    params = dict(params or {})
    params.setdefault("market", SLIPSTREAM_MARKET)
    url = f"{SLIPSTREAM_BASE}{path}"
    return get_session().get(url, headers=get_slipstream_headers(), params=params, timeout=timeout)


def slipstream_post(
    path: str,
    data: dict[str, Any] | None = None,
    timeout: int = 300,
) -> requests.Response:
    """Issue a POST to Slipstream (application/x-www-form-urlencoded)."""
    data = dict(data or {})
    data.setdefault("market", SLIPSTREAM_MARKET)
    url = f"{SLIPSTREAM_BASE}{path}"
    return get_session().post(url, headers=get_slipstream_headers(), data=data, timeout=timeout)


def validate_token() -> dict[str, Any]:
    """Call /ws/api/status to verify the token and market access."""
    resp = slipstream_get("/ws/api/status", params={"markets": "true"})
    resp.raise_for_status()
    return resp.json()
