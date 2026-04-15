"""
Helper functions for property scoring and sorting.
"""

from __future__ import annotations

import os
import time
from typing import Any, cast

import redis
from flask import current_app

from ..home_matching.config.match import find_best_matches
from ..home_matching.mcda import MCDA_CONFIG, score_listing_mcda
from ..home_matching.preprocessing.home_input_data import format_homes_data_from_api


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

        # Try Redis sorting first
        scored_properties = _sort_with_redis(properties, score_map, request_id)
        if scored_properties:
            return scored_properties

        # Fallback to Python sorting
        return _sort_with_python(properties, score_map)

    except Exception as e:
        current_app.logger.error(f"⚠️ Property scoring failed: {str(e)}")
        # Return properties with default scores
        for prop in properties:
            prop["_score"] = 0.0
        return properties


def _sort_with_redis(
    properties: list[dict[str, Any]], score_map: dict[str, float], request_id: str
) -> list[dict[str, Any]]:
    """Sort properties using Redis sorted set."""
    redis_client = None
    try:
        redis_url = os.getenv("REDIS_URL", "").strip()
        if redis_url:
            redis_client = redis.Redis.from_url(redis_url, decode_responses=False)
        else:
            redis_host = os.getenv("REDIS_HOST", "localhost")
            redis_port = int(os.getenv("REDIS_PORT", 6379))
            redis_client = redis.Redis(
                host=redis_host, port=redis_port, db=0, decode_responses=False
            )

        sort_key = f"property_scores:{request_id}:{int(time.time())}"

        # Add scores to Redis
        for zpid, score in score_map.items():
            redis_client.zadd(sort_key, {str(zpid): score})

        redis_client.expire(sort_key, 300)

        # Get sorted zpids (cast: sync Redis client returns list, not Awaitable)
        raw_zpids = cast(
            list[bytes | str],
            redis_client.zrevrange(sort_key, 0, -1, withscores=False),
        )
        sorted_zpids = [
            zpid.decode("utf-8") if isinstance(zpid, bytes) else str(zpid) for zpid in raw_zpids
        ]

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
        current_app.logger.warning(
            f"⚠️ Redis sorting failed: {str(redis_error)}, falling back to Python sort"
        )
        return []
    finally:
        if redis_client:
            try:
                redis_client.close()
            except Exception:
                pass


def _sort_with_python(
    properties: list[dict[str, Any]], score_map: dict[str, float]
) -> list[dict[str, Any]]:
    """Sort properties using Python (fallback)."""
    for prop in properties:
        zk = str(prop["zpid"]) if prop.get("zpid") is not None else ""
        prop["_score"] = score_map.get(zk, 0.0)

    return sorted(properties, key=lambda x: x.get("_score", 0.0), reverse=True)
