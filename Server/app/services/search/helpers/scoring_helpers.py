"""
Helper functions for property scoring and sorting.
"""

from __future__ import annotations

import os
import time
import zlib
from typing import Any, cast

import redis

from logger import log

from ..home_matching.config.match import find_best_matches
from ..home_matching.mcda import MCDA_CONFIG, score_listing_mcda
from ..home_matching.preprocessing.home_input_data import format_homes_data_from_api

_REDIS_SOCKET_CONNECT_TIMEOUT_S = 5.0
_REDIS_SOCKET_TIMEOUT_S = 5.0
_REDIS_MAX_CONNECTIONS = 32
_SCORE_SORT_KEY_TTL_S = 300

_scoring_redis: redis.Redis | None = None


def _scoring_redis_url() -> str | None:
    """Prefer REDIS_URL; fall back to Celery broker (same instance in local dev)."""
    return (os.getenv("REDIS_URL") or os.getenv("CELERY_URL") or "").strip() or None


def _get_scoring_redis() -> redis.Redis | None:
    """Shared pooled client for ephemeral sorted-set sorts (see optional_redis_json_cache)."""
    global _scoring_redis
    if _scoring_redis is not None:
        return _scoring_redis
    url = _scoring_redis_url()
    if url:
        _scoring_redis = redis.Redis.from_url(
            url,
            decode_responses=True,
            max_connections=_REDIS_MAX_CONNECTIONS,
            socket_connect_timeout=_REDIS_SOCKET_CONNECT_TIMEOUT_S,
            socket_timeout=_REDIS_SOCKET_TIMEOUT_S,
        )
        return _scoring_redis
    redis_host = os.getenv("REDIS_HOST", "localhost")
    redis_port = int(os.getenv("REDIS_PORT", 6379))
    _scoring_redis = redis.Redis(
        host=redis_host,
        port=redis_port,
        db=0,
        decode_responses=True,
        max_connections=_REDIS_MAX_CONNECTIONS,
        socket_connect_timeout=_REDIS_SOCKET_CONNECT_TIMEOUT_S,
        socket_timeout=_REDIS_SOCKET_TIMEOUT_S,
    )
    return _scoring_redis


def _listings_have_scoring_payload(properties: list[dict[str, Any]]) -> bool:
    """True when at least one row has fields MCDA can use (skip tie-break on empty shells)."""
    for prop in properties:
        if prop.get("price") or prop.get("bedrooms") or prop.get("livingArea") or prop.get("sqft"):
            return True
    return False


def _apply_deterministic_score_tiebreak(
    score_map: dict[str, float], properties: list[dict[str, Any]]
) -> None:
    """When every listing rounds to the same score, spread by 0.1 steps for sort and UI."""
    if len(score_map) < 2 or not _listings_have_scoring_payload(properties):
        return
    rounded = {zpid: round(score, 1) for zpid, score in score_map.items()}
    if len(set(rounded.values())) > 1:
        return
    out_lo = float(MCDA_CONFIG["output_display_min"])
    out_hi = float(MCDA_CONFIG["output_display_max"])
    base = next(iter(rounded.values()))
    zpids_sorted = sorted(
        score_map.keys(), key=lambda z: (zlib.crc32(str(z).encode("utf-8")), str(z))
    )
    n = len(zpids_sorted)
    for i, zpid in enumerate(zpids_sorted):
        offset = (i - (n - 1) / 2.0) * 0.1
        adjusted = base + offset
        score_map[zpid] = round(max(out_lo, min(out_hi, adjusted)), 1)


def score_and_sort_properties(
    properties: list[dict[str, Any]],
    user_data: dict[str, Any],
    request_id: str,
    status_type: str = "ForSale",
) -> list[dict[str, Any]]:
    """
    Score properties using home matching and sort by score.
    Uses Redis for efficient sorting with Python fallback.

    Returns:
        List of properties with _score field added, sorted by score descending.
    """
    if not properties:
        return []

    try:
        preferences = user_data.get("preferences") or {}
        embed_requested = float(MCDA_CONFIG.get("embedding_blend_weight", 0.0))
        embed_cap = float(MCDA_CONFIG.get("embedding_blend_weight_cap", 0.01))
        # At least 99% of the blended score from MCDA (heuristic); cap embedding share.
        embed_weight = max(0.0, min(embed_requested, embed_cap))
        out_lo = float(MCDA_CONFIG["output_display_min"])
        out_hi = float(MCDA_CONFIG["output_display_max"])

        embedding_by_zpid: dict[str, float] = {}
        if embed_weight > 0.0:
            homes_data = format_homes_data_from_api(properties)
            scored_matches = find_best_matches(
                user_data=user_data,
                homes_data=homes_data,
                top_k=len(homes_data),
                include_explanations=False,
                embedding_provider="sentence_transformer",
                request_id=request_id,
                track_to_db=True,
            )
            for match in scored_matches:
                home_data = match.get("home_data", {})
                zpid = home_data.get("zpid")
                score = match.get("final_score", 0.0)
                if zpid is not None:
                    embedding_by_zpid[str(zpid)] = float(score)

        score_map: dict[str, float] = {}
        for prop in properties:
            zpid = prop.get("zpid")
            if zpid is None:
                continue
            zkey = str(zpid)
            mcda = score_listing_mcda(
                preferences,
                prop,
                status_type=status_type,
            )
            if embed_weight > 0.0:
                emb = embedding_by_zpid.get(zkey)
                if emb is not None:
                    emb_display = out_lo + (emb / 100.0) * (out_hi - out_lo)
                    mcda = (1.0 - embed_weight) * mcda + embed_weight * emb_display
                    mcda = round(mcda, 1)
            score_map[zkey] = mcda

        _apply_deterministic_score_tiebreak(score_map, properties)

        # Try Redis sorting first
        scored_properties = _sort_with_redis(properties, score_map, request_id)
        if scored_properties:
            return scored_properties

        # Fallback to Python sorting
        return _sort_with_python(properties, score_map)

    except Exception as e:
        log.error("ERRORS", "Property scoring failed", e)
        # Return properties with default scores
        for prop in properties:
            prop["_score"] = 0.0
        return properties


def _sort_with_redis(
    properties: list[dict[str, Any]], score_map: dict[str, float], request_id: str
) -> list[dict[str, Any]]:
    """Sort properties using a short-lived Redis sorted set (pipelined ZADD, TTL on key)."""
    try:
        redis_client = _get_scoring_redis()
        sort_key = f"property_scores:{request_id}:{int(time.time())}"

        pipe = redis_client.pipeline(transaction=False)
        for zpid, score in score_map.items():
            pipe.zadd(sort_key, {str(zpid): score})
        pipe.expire(sort_key, _SCORE_SORT_KEY_TTL_S)
        pipe.execute()

        sorted_zpids = cast(
            list[str],
            redis_client.zrevrange(sort_key, 0, -1, withscores=False),
        )

        # Build sorted properties list
        prop_map = {str(prop.get("zpid")): prop for prop in properties}
        scored_properties = []

        for zpid in sorted_zpids:
            if zpid in prop_map:
                prop = prop_map[zpid]
                prop["_score"] = score_map.get(zpid, 0.0)
                scored_properties.append(prop)

        # Add remaining unscored properties
        for prop in properties:
            zpid = str(prop.get("zpid"))
            if zpid not in score_map:
                prop["_score"] = 0.0
                scored_properties.append(prop)

        redis_client.delete(sort_key)
        return scored_properties

    except Exception as redis_error:
        log.warn(
            "SEARCH",
            "Redis sorting failed; falling back to Python sort",
            {"error": str(redis_error)},
        )
        return []


def _sort_with_python(
    properties: list[dict[str, Any]], score_map: dict[str, float]
) -> list[dict[str, Any]]:
    """Sort properties using Python (fallback)."""
    for prop in properties:
        zk = str(prop["zpid"]) if prop.get("zpid") is not None else ""
        prop["_score"] = score_map.get(zk, 0.0)

    return sorted(properties, key=lambda x: x.get("_score", 0.0), reverse=True)
