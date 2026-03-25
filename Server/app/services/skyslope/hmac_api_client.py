"""HTTP client for api.skyslope.com using cached HMAC session (Bearer)."""

from __future__ import annotations

from typing import Any

import requests

from app.config.skyslope import get_skyslope_config, is_skyslope_hmac_configured
from app.services.skyslope.hmac_session import (
    SkySlopeHmacSessionManager,
    get_default_hmac_session_manager,
)
from logger import LOG_CATEGORIES, log


class SkySlopeHmacApiError(Exception):
    """Raised when api.skyslope.com returns an error."""

    def __init__(self, message: str, status_code: int | None = None, response: dict | None = None):
        super().__init__(message)
        self.status_code = status_code
        self.response = response


class SkySlopeHmacApiClient:
    """
    Call api.skyslope.com REST endpoints with OpenAPI Bearer session auth.

    Session is obtained via HMAC /auth/login and cached (see SkySlopeHmacSessionManager).
    """

    def __init__(
        self,
        api_base: str | None = None,
        session_manager: SkySlopeHmacSessionManager | None = None,
    ) -> None:
        if not is_skyslope_hmac_configured():
            raise ValueError("SkySlope HMAC is not configured")
        cfg = get_skyslope_config()
        self.api_base = (api_base or cfg.get("hmac_api_base") or "https://api.skyslope.com").rstrip(
            "/"
        )
        self._session_manager = session_manager or get_default_hmac_session_manager()
        self._http = requests.Session()

    def _log_rate_limit_headers(self, resp: requests.Response) -> None:
        limit = resp.headers.get("x-ratelimit-limit")
        remaining = resp.headers.get("x-ratelimit-remaining")
        reset = resp.headers.get("x-ratelimit-reset")
        if limit is None and remaining is None:
            return
        payload: dict[str, str] = {}
        if limit is not None:
            payload["limit"] = limit
        if remaining is not None:
            payload["remaining"] = remaining
        if reset is not None:
            payload["reset"] = reset
        log.debug(LOG_CATEGORIES["API"], "SkySlope HMAC API rate limit headers", payload)

    def _request(
        self,
        method: str,
        path: str,
        *,
        json: dict | None = None,
        params: dict | None = None,
        _retry_on_unauthorized: bool = True,
    ) -> dict | list:
        path = path if path.startswith("/") else f"/{path}"
        url = f"{self.api_base}{path}"
        token = self._session_manager.get_session()
        headers = {"Authorization": f"Bearer {token}"}

        resp = self._http.request(
            method,
            url,
            headers=headers,
            json=json,
            params=params,
            timeout=30,
        )
        self._log_rate_limit_headers(resp)

        if resp.status_code == 401 and _retry_on_unauthorized:
            self._session_manager.clear()
            self._session_manager.get_session(force_refresh=True)
            return self._request(
                method,
                path,
                json=json,
                params=params,
                _retry_on_unauthorized=False,
            )

        if resp.status_code >= 400:
            try:
                err_body: Any = resp.json()
            except Exception:
                err_body = {"raw": resp.text}
            if not isinstance(err_body, dict):
                err_body = {"raw": err_body}
            raise SkySlopeHmacApiError(
                f"SkySlope HMAC API error: {resp.status_code}",
                status_code=resp.status_code,
                response=err_body,
            )

        if resp.status_code == 204 or not resp.content:
            return {}
        return resp.json()

    def get_replica_timestamp(self) -> dict[str, Any]:
        """
        Bulk-export test endpoint (GET /api/files/replica-timestamp).

        Confirms HMAC session + Bearer auth against api.skyslope.com.
        """
        return self._request("GET", "/api/files/replica-timestamp")  # type: ignore[return-value]
