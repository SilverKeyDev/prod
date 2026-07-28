"""Pooled HTTP clients for search upstream APIs (RapidAPI + Slipstream).

SIL-324: listing/search will use RapidAPI; Slipstream remains for area routes until cut over.
"""

from __future__ import annotations

from typing import Any

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from .config import (
    RAPIDAPI_BASE,
    RAPIDAPI_HOST,
    RAPIDAPI_KEY,
    SLIPSTREAM_BASE,
    SLIPSTREAM_MARKET,
    SLIPSTREAM_PRIVATE,
)


def _build_session(*, allow_post: bool) -> requests.Session:
    """Build pooled session with retry/backoff."""
    s = requests.Session()
    methods = frozenset(["GET", "POST"] if allow_post else ["GET"])
    retry = Retry(
        total=5,
        backoff_factor=0.5,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=methods,
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry)  # type: ignore[arg-type]
    s.mount("https://", adapter)
    s.mount("http://", adapter)
    return s


# ---- RapidAPI session ----

_rapidapi_session: requests.Session | None = None


def get_rapidapi_session() -> requests.Session:
    """Return the module-level RapidAPI session (lazily created)."""
    global _rapidapi_session
    if _rapidapi_session is None:
        _rapidapi_session = _build_session(allow_post=False)
    return _rapidapi_session


def get_rapidapi_headers() -> dict[str, str]:
    """Standard RapidAPI headers."""
    return {
        "x-rapidapi-host": RAPIDAPI_HOST,
        "x-rapidapi-key": RAPIDAPI_KEY or "",
        "Accept": "application/json",
    }


def rapidapi_get(
    path: str,
    params: dict[str, Any] | None = None,
    timeout: int = 300,
) -> requests.Response:
    """Issue a GET to RapidAPI (e.g. ``/propertyByPolygon``, ``/property``)."""
    url = f"{RAPIDAPI_BASE}{path}"
    return get_rapidapi_session().get(
        url,
        headers=get_rapidapi_headers(),
        params=params or {},
        timeout=timeout,
    )


# ---- Slipstream session (unchanged behavior for Phase 2) ----

_session: requests.Session | None = None


def get_session() -> requests.Session:
    """Return the module-level Slipstream session (lazily created)."""
    global _session
    if _session is None:
        _session = _build_session(allow_post=True)
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
    """Call Slipstream /ws/api/status to verify the token and market access."""
    resp = slipstream_get("/ws/api/status", params={"markets": "true"})
    resp.raise_for_status()
    return resp.json()
