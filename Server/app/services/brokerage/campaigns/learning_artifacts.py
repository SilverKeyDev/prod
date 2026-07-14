"""Persist learning-loop artifacts (review/draft/cache) beside demo data.

Campaign CRUD stays in SQLAlchemy (SIL-306 ``service.py``). This module only
stores SIL-309 outputs under ``Server/data/skyslope-demo/campaigns/``.
"""

from __future__ import annotations

import json
from copy import deepcopy
from threading import Lock
from typing import Any

from app.services.brokerage.campaigns.paths import (
    CAMPAIGNS_JSON,
    LEARNING_RESULTS_DIR,
)

_lock = Lock()
_json_cache: dict[str, Any] | None = None


def load_json_campaign_store(*, force_reload: bool = False) -> dict[str, Any]:
    """Optional JSON training store (stable camp-* ids) for offline/unit tests."""
    global _json_cache
    with _lock:
        if _json_cache is not None and not force_reload:
            return deepcopy(_json_cache)
        if not CAMPAIGNS_JSON.is_file():
            _json_cache = {"brokerage_org_id": None, "campaigns": []}
            return deepcopy(_json_cache)
        with CAMPAIGNS_JSON.open(encoding="utf-8") as fh:
            _json_cache = json.load(fh)
        return deepcopy(_json_cache)


def get_json_campaign(
    campaign_id: str,
    *,
    brokerage_org_id: str | None = None,
) -> dict[str, Any] | None:
    """Return a JSON campaign only when id matches and (if given) org matches."""
    store = load_json_campaign_store()
    if brokerage_org_id is not None and store.get("brokerage_org_id") != brokerage_org_id:
        return None
    for camp in store.get("campaigns", []):
        if camp.get("id") == campaign_id:
            return camp
    return None


def _learning_result_path(campaign_id: str):
    return LEARNING_RESULTS_DIR / f"{campaign_id}.json"


def load_learning_result(campaign_id: str) -> dict[str, Any] | None:
    path = _learning_result_path(campaign_id)
    if not path.is_file():
        return None
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


def save_learning_result(campaign_id: str, payload: dict[str, Any]) -> None:
    LEARNING_RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    path = _learning_result_path(campaign_id)
    with path.open("w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2)
        fh.write("\n")
