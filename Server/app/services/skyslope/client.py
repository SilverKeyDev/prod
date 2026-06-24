"""SkySlope Partnership/Forms API client (stub until SIL-273)."""

from __future__ import annotations

from collections.abc import Iterator
from datetime import datetime
from typing import Any, Protocol


class SkySlopeClientProtocol(Protocol):
    def iter_transactions(
        self, *, updated_since: datetime | None = None
    ) -> Iterator[list[dict[str, Any]]]:
        ...


class MockSkySlopeClient:
    """Test/dev client returning in-memory pages."""

    def __init__(self, pages: list[list[dict[str, Any]]] | None = None):
        self._pages = pages or []

    def iter_transactions(
        self, *, updated_since: datetime | None = None
    ) -> Iterator[list[dict[str, Any]]]:
        del updated_since
        yield from self._pages


class SkySlopeClient:
    """
    Real HTTP client — implement in SIL-273.
    For now, raises so production misconfig is obvious.
    """

    def __init__(self, *, api_key: str, skyslope_org_id: str | None = None):
        self.api_key = api_key
        self.skyslope_org_id = skyslope_org_id

    def iter_transactions(
        self, *, updated_since: datetime | None = None
    ) -> Iterator[list[dict[str, Any]]]:
        del updated_since
        raise NotImplementedError("SkySlope HTTP client not implemented (SIL-273)")
