"""SkySlope Transaction Management API client."""

from __future__ import annotations

import time
from collections.abc import Iterator
from datetime import datetime, timezone
from typing import Any, Protocol

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from app.services.skyslope.auth import build_auth_headers, get_session_ticket
from app.services.skyslope.errors import (
    SkySlopeAuthError,
    SkySlopeError,
    SkySlopeRateLimitError,
    SkySlopeUpstreamError,
)
from app.services.skyslope.http_config import (
    SKYSLOPE_API_BASE_URL,
    SKYSLOPE_BULK_OBJECT_TYPE,
    SKYSLOPE_FILES_PATH,
    SKYSLOPE_HEALTHCHECK_PATH,
    SKYSLOPE_PAGE_SIZE,
    SKYSLOPE_REQUEST_TIMEOUT_SEC,
)
from logger import log


class SkySlopeClientProtocol(Protocol):
    def iter_transactions(
        self, *, updated_since: datetime | None = None
    ) -> Iterator[list[dict[str, Any]]]: ...

    def test_connection(self) -> None: ...


class MockSkySlopeClient:
    """Test/dev client returning in-memory pages"""

    def __init__(self, pages: list[list[dict[str, Any]]] | None = None):
        self._pages = pages or []

    def iter_transactions(
        self, *, updated_since: datetime | None = None
    ) -> Iterator[list[dict[str, Any]]]:
        del updated_since
        yield from self._pages

    def test_connection(self) -> None:
        return None


_session: requests.Session | None = None


def _build_http_session() -> requests.Session:
    session = requests.Session()
    retry = Retry(
        total=3,
        backoff_factor=0.5,
        status_forcelist=(500, 502, 503, 504),
        allowed_methods=frozenset(["GET", "POST"]),
        raise_on_status=False,
    )
    session.mount("https://", HTTPAdapter(max_retries=retry))  # type: ignore[arg-type]
    return session


def _get_http_session() -> requests.Session:
    global _session
    if _session is None:
        _session = _build_http_session()
    return _session


def _extract_files(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    if not isinstance(payload, dict):
        return []
    for key in ("files", "Files", "data", "items", "results"):
        value = payload.get(key)
        if isinstance(value, list):
            return [item for item in value if isinstance(item, dict)]
    return []


def _maybe_sleep_for_rate_limit(response: requests.Response) -> None:
    remaining = response.headers.get("x-ratelimit-remaining")
    reset_at = response.headers.get("x-ratelimit-reset")
    if remaining is None or reset_at is None:
        return
    try:
        if int(remaining) > 0:
            return
        wait_seconds = max(0, int(reset_at) - int(time.time()))
    except ValueError:
        return
    if wait_seconds > 0:
        log.info("API", "SkySlope rate limit pause", {"wait_seconds": wait_seconds})
        time.sleep(min(wait_seconds, 60))


class SkySlopeClient:
    def __init__(
        self,
        *,
        access_key: str,
        access_secret: str,
        skyslope_org_id: str | None = None,
    ):
        self.access_key = access_key.strip()
        self.access_secret = access_secret.strip()
        self.skyslope_org_id = (skyslope_org_id or "").strip() or None
        if not self.access_key or not self.access_secret:
            raise SkySlopeAuthError("Brokerage AccessKey and AccessSecret are required")

    def _session_ticket(self) -> str:
        return get_session_ticket(access_key=self.access_key, access_secret=self.access_secret)

    def _request(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, Any] | None = None,
        session_ticket: str | None = None,
    ) -> requests.Response:
        ticket = session_ticket or self._session_ticket()
        headers = build_auth_headers(access_key=self.access_key, access_secret=self.access_secret)
        headers["Session"] = ticket
        url = f"{SKYSLOPE_API_BASE_URL}{path}"
        try:
            response = _get_http_session().request(
                method,
                url,
                headers=headers,
                params=params,
                timeout=SKYSLOPE_REQUEST_TIMEOUT_SEC,
            )
        except requests.RequestException as exc:
            raise SkySlopeUpstreamError("Network error contacting SkySlope") from exc

        _maybe_sleep_for_rate_limit(response)

        if response.status_code in (401, 403):
            raise SkySlopeAuthError(
                "SkySlope rejected credentials", status_code=response.status_code
            )
        if response.status_code == 429:
            raise SkySlopeRateLimitError("SkySlope rate limit exceeded", status_code=429)
        if response.status_code >= 500:
            raise SkySlopeUpstreamError("SkySlope server error", status_code=response.status_code)
        if response.status_code >= 400:
            raise SkySlopeError(
                f"SkySlope request failed ({response.status_code})",
                status_code=response.status_code,
            )
        return response

    def test_connection(self) -> None:
        self._request("GET", SKYSLOPE_HEALTHCHECK_PATH)

    def iter_transactions(
        self, *, updated_since: datetime | None = None
    ) -> Iterator[list[dict[str, Any]]]:
        page_number = 1
        modified_after = None
        if updated_since is not None:
            modified_after = updated_since.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        session_ticket = self._session_ticket()
        total_yielded = 0

        while True:
            params: dict[str, Any] = {
                "objectType": SKYSLOPE_BULK_OBJECT_TYPE,
                "PageNumber": page_number,
            }
            if modified_after:
                params["modifiedAfter"] = modified_after
            response = self.request(
                "GET",
                SKYSLOPE_FILES_PATH,
                params=params,
                session_ticket=session_ticket,
            )
            try:
                payload = response.json()
            except ValueError as exc:
                raise SkySlopeUpstreamError("SkySlope returned invalid JSON") from exc

            items = _extract_files(payload)
            if items:
                total_yielded += len(items)
                yield items
            if len(items) < SKYSLOPE_PAGE_SIZE:
                break
            page_number += 1
        log.info(
            "API",
            "SkySlope files export completed",
            {
                "org_id": self.skyslope_org_id,
                "incremental": updated_since is not None,
                "records": total_yielded,
            },
        )
