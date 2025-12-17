"""
Helper functions for property scoring and sorting.
"""
from __future__ import annotations

import os
import redis
import time
from typing import Dict, Any, List
from flask import current_app

from ...home_matching.app.match import find_best_matches


def score_and_sort_properties(
    properties: List[Dict[str, Any]],
    user_data: Dict[str, Any],
    request_id: str
) -> List[Dict[str, Any]]:
    """
    Score properties using home matching and sort by score.
    Uses Redis for efficient sorting with Python fallback.
    
    Returns:
        List of properties with _score field added, sorted by score descending.
    """
    if not properties:
        return []
    
    try:
        # Convert properties to format expected by home matching system
        homes_data = []
        for prop in properties:
            home_data = {
                "zpid": prop.get("zpid"),
                "address": prop.get("address", ""),
                "price": prop.get("price"),
                "bedrooms": prop.get("bedrooms"),
                "bathrooms": prop.get("bathrooms"),
                "livingArea": prop.get("livingArea"),
                "lotAreaValue": prop.get("lotAreaValue"),
                "propertyType": prop.get("propertyType"),
                "latitude": prop.get("latitude"),
                "longitude": prop.get("longitude"),
                "listingStatus": prop.get("listingStatus"),
                "yearBuilt": prop.get("yearBuilt"),
                "homeType": prop.get("homeType"),
                "raw_data": prop
            }
            homes_data.append(home_data)
        
        # Get scored matches
        scored_matches = find_best_matches(
            user_data=user_data,
            homes_data=homes_data,
            top_k=len(homes_data),
            include_explanations=False,
            embedding_provider="sentence_transformer",
            llm_provider="openai"
        )
        
        # Build score map
        score_map = {}
        for match in scored_matches:
            home_data = match.get("home_data", {})
            zpid = home_data.get("zpid")
            score = match.get("final_score", 0.0)
            if zpid:
                score_map[zpid] = score
        
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
    properties: List[Dict[str, Any]],
    score_map: Dict[Any, float],
    request_id: str
) -> List[Dict[str, Any]]:
    """Sort properties using Redis sorted set."""
    redis_client = None
    try:
        redis_host = os.getenv('REDIS_HOST', 'localhost')
        redis_port = int(os.getenv('REDIS_PORT', 6379))
        redis_client = redis.Redis(
            host=redis_host,
            port=redis_port,
            db=0,
            decode_responses=False
        )
        
        sort_key = f"property_scores:{request_id}:{int(time.time())}"
        
        # Add scores to Redis
        for zpid, score in score_map.items():
            redis_client.zadd(sort_key, {str(zpid): score})
        
        redis_client.expire(sort_key, 300)
        
        # Get sorted zpids
        sorted_zpids = redis_client.zrevrange(sort_key, 0, -1, withscores=False)
        sorted_zpids = [zpid.decode('utf-8') if isinstance(zpid, bytes) else str(zpid) for zpid in sorted_zpids]
        
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
        current_app.logger.warning(f"⚠️ Redis sorting failed: {str(redis_error)}, falling back to Python sort")
        return []
    finally:
        if redis_client:
            try:
                redis_client.close()
            except:
                pass


def _sort_with_python(
    properties: List[Dict[str, Any]],
    score_map: Dict[Any, float]
) -> List[Dict[str, Any]]:
    """Sort properties using Python (fallback)."""
    for prop in properties:
        zpid = prop.get("zpid")
        prop["_score"] = score_map.get(zpid, 0.0)
    
    return sorted(properties, key=lambda x: x.get("_score", 0.0), reverse=True)
