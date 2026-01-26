from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List, Tuple
from flask import current_app

from app import db
from app.models import HomeUniversal, HomeLikes, HomeNotInterested, UserPreferences
from app.utils.address_format import normalize_address
from app.utils.currency import format_currency


def sync_to_home_likes(home_universal: HomeUniversal, action: str = "liked") -> HomeLikes:
    """
    Sync a HomeUniversal record to HomeLikes and add a timestamp entry to like_history.
    
    Args:
        home_universal: The HomeUniversal record to sync
        action: Either "liked" or "unliked"
    
    Returns:
        The HomeLikes record (created or updated)
    """
    if action not in ("liked", "unliked"):
        raise ValueError("action must be 'liked' or 'unliked'")
    
    # Find existing HomeLikes record by normalized address
    existing_likes: Optional[HomeLikes] = None
    if home_universal.address:
        try:
            norm = normalize_address(home_universal.address)
        except Exception:
            norm = home_universal.address.strip().lower()
        
        for rec in HomeLikes.query.filter_by(user_id=str(home_universal.user_id)).all():
            if not rec.address:
                continue
            try:
                rec_norm = normalize_address(rec.address)
            except Exception:
                rec_norm = rec.address.strip().lower()
            if rec_norm == norm:
                existing_likes = rec
                break
    
    # Prepare only fields that exist in HomeLikes model
    # HomeLikes only supports: user_id, is_liked, address, zpid, mls_home_id, score, latitude, longitude
    fields = {
        "user_id": str(home_universal.user_id),
        "is_liked": home_universal.is_liked,
        "address": home_universal.address,
        "zpid": home_universal.zpid,
        "mls_home_id": home_universal.mls_home_id,
        "score": home_universal.score,
        "latitude": home_universal.latitude,
        "longitude": home_universal.longitude,
    }
    
    # Add timestamp entry to like_history
    timestamp_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "action": action
    }
    
    if existing_likes:
        # Update existing record
        for k, v in fields.items():
            setattr(existing_likes, k, v)
        # Initialize like_history if None
        if existing_likes.like_history is None:
            existing_likes.like_history = []
        # Add new timestamp entry
        existing_likes.like_history.append(timestamp_entry)
        db.session.commit()
        return existing_likes
    else:
        # Create new record
        like_history = [timestamp_entry]
        record = HomeLikes(like_history=like_history, **fields)
        db.session.add(record)
        db.session.commit()
        return record


def sync_to_home_not_interested(home_universal: HomeUniversal, action: str = "not_interested", why: Optional[str] = None) -> HomeNotInterested:
    """
    Sync a HomeUniversal record to HomeNotInterested and add a timestamp entry to not_interested_history.
    
    Args:
        home_universal: The HomeUniversal record to sync
        action: Either "not_interested" or "undo"
        why: Optional reason why not interested
    
    Returns:
        The HomeNotInterested record (created or updated)
    """
    if action not in ("not_interested", "undo"):
        raise ValueError("action must be 'not_interested' or 'undo'")
    
    # Find existing HomeNotInterested record by normalized address
    existing_not_interested: Optional[HomeNotInterested] = None
    if home_universal.address:
        try:
            norm = normalize_address(home_universal.address)
        except Exception:
            norm = home_universal.address.strip().lower()
        
        for rec in HomeNotInterested.query.filter_by(user_id=str(home_universal.user_id)).all():
            if not rec.address:
                continue
            try:
                rec_norm = normalize_address(rec.address)
            except Exception:
                rec_norm = rec.address.strip().lower()
            if rec_norm == norm:
                existing_not_interested = rec
                break
    
    # Prepare fields from HomeUniversal (only fields that exist in HomeNotInterested)
    fields = {
        "user_id": str(home_universal.user_id),
        "is_not_interested": action == "not_interested",
        "address": home_universal.address,
        "zpid": home_universal.zpid,
        "mls_home_id": home_universal.mls_home_id,
        "score": home_universal.score,
        "latitude": home_universal.latitude,
        "longitude": home_universal.longitude,
    }
    
    # Add timestamp entry to not_interested_history
    timestamp_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "action": action
    }
    if why and action == "not_interested":
        timestamp_entry["why"] = why
    
    if existing_not_interested:
        # Update existing record
        for k, v in fields.items():
            setattr(existing_not_interested, k, v)
        # Update why field if provided
        if why and action == "not_interested":
            existing_not_interested.why = why
        # Initialize not_interested_history if None
        if existing_not_interested.not_interested_history is None:
            existing_not_interested.not_interested_history = []
        # Add new timestamp entry
        existing_not_interested.not_interested_history.append(timestamp_entry)
        db.session.commit()
        return existing_not_interested
    else:
        # Create new record
        not_interested_history = [timestamp_entry]
        record_fields = fields.copy()
        if why and action == "not_interested":
            record_fields["why"] = why
        record = HomeNotInterested(not_interested_history=not_interested_history, **record_fields)
        db.session.add(record)
        db.session.commit()
        return record


def add_or_update_home_basic(user_id: str, home: Dict[str, Any], set_liked: bool = False, ranking: Optional[int] = None) -> HomeUniversal:
    """
    Add or update a minimal home record for a user using basic/search fields.
    - De-dupes by normalized address per user
    - Updates known fields if record exists
    - Optionally sets is_liked to True
    - Optionally sets ranking (position in search results, 1-based)

    Expected keys in `home`:
      address, bedrooms, bathrooms, sqft, lotSize, price, image_url/imageUrl/imgSrc
    """
    if not user_id:
        raise ValueError("user_id is required")

    address = (home.get("address") or "").strip()
    if not address:
        # If address missing, no-op (cannot reliably de-dupe)
        raise ValueError("address is required")

    try:
        norm = normalize_address(address)
    except Exception:
        norm = address.lower()

    # Find existing by normalized address (check both current and non-current)
    existing: Optional[HomeUniversal] = None
    for rec in HomeUniversal.query.filter_by(user_id=str(user_id)).all():
        if not rec.address:
            continue
        try:
            rec_norm = normalize_address(rec.address)
        except Exception:
            rec_norm = rec.address.strip().lower()
        if rec_norm == norm:
            existing = rec
            break

    image_url = (
        home.get("image_url")
        or home.get("imageUrl")
        or home.get("imgSrc")
        or home.get("image")
        or ""
    )

    # Inline score extraction/coercion without new helpers
    parsed_score: Optional[float] = None
    # direct keys
    for _key in ("score", "_score", "rankingScore", "ranking_score", "matchScore", "match_score"):
        if _key in home:
            _val = home.get(_key)
            if isinstance(_val, (int, float)):
                try:
                    parsed_score = float(_val)
                except Exception:
                    parsed_score = None
            elif isinstance(_val, str):
                _s = _val.strip()
                if _s.endswith("%"):
                    _s = _s[:-1].strip()
                    try:
                        parsed_score = float(_s) / 100.0
                    except Exception:
                        parsed_score = None
                else:
                    try:
                        parsed_score = float(_s)
                    except Exception:
                        parsed_score = None
            if parsed_score is not None:
                break

    # nested common shapes if still None
    if parsed_score is None:
        _ranking = home.get("ranking") or {}
        if isinstance(_ranking, dict) and "score" in _ranking:
            _val = _ranking.get("score")
            try:
                parsed_score = float(_val) if not (isinstance(_val, str) and _val.endswith("%")) else float(_val[:-1].strip()) / 100.0
            except Exception:
                parsed_score = None

    if parsed_score is None:
        _analysis = home.get("property_analysis") or home.get("propertyAnalysis") or {}
        if isinstance(_analysis, dict):
            for _key in ("score", "matchScore", "match_score"):
                if _key in _analysis:
                    _val = _analysis.get(_key)
                    try:
                        parsed_score = float(_val) if not (isinstance(_val, str) and _val.endswith("%")) else float(_val[:-1].strip()) / 100.0
                    except Exception:
                        parsed_score = None
                    if parsed_score is not None:
                        break

    # Persist score with exactly one decimal place when available
    if parsed_score is not None:
        try:
            parsed_score = round(float(parsed_score), 1)
        except Exception:
            parsed_score = None

    # Extract lot area value and unit - handle both string and numeric values
    lot_area_value_raw = home.get("lotAreaValue") or home.get("lotSize") or ""
    lot_area_unit = home.get("lotAreaUnit") or ""
    
    # Convert lot_area_value to string if it's a number
    lot_area_value = ""
    if lot_area_value_raw:
        try:
            lot_area_value = str(lot_area_value_raw)
        except Exception:
            lot_area_value = ""
    
    fields = {
        "address": address,
        "beds": str(home.get("bedrooms", "") or ""),
        "baths": str(home.get("bathrooms", "") or ""),
        "sqft": str(home.get("sqft", home.get("livingArea", "")) or ""),
        "lot_size": lot_area_value,
        "lot_area_value": lot_area_value if lot_area_value else None,
        "lot_area_unit": str(lot_area_unit) if lot_area_unit else None,
        "price": format_currency(home.get("price", "")),
        "image_url": image_url,
        "score": parsed_score,
    }

    if existing:
        # Update only with non-empty incoming values
        for k, v in fields.items():
            if isinstance(v, str):
                if v.strip() != "":
                    setattr(existing, k, v)
            else:
                if v is not None:
                    setattr(existing, k, v)
        # Mark as current when updating
        existing.current = True
        # Set ranking if provided
        if ranking is not None:
            existing.ranking = ranking
        # If caller requests to like, ensure flag is set on existing record
        if set_liked:
            existing.is_liked = True
        db.session.commit()
        # Sync to HomeLikes with like history after committing HomeUniversal changes
        if set_liked:
            sync_to_home_likes(existing, action="liked")
        return existing

    record = HomeUniversal(user_id=str(user_id), current=True, ranking=ranking, **fields)
    if set_liked:
        record.is_liked = True
    db.session.add(record)
    db.session.commit()
    
    # If liked, sync to HomeLikes with like history
    if set_liked:
        sync_to_home_likes(record, action="liked")
    
    return record


def get_cached_search_results(user_id: str) -> List[Dict[str, Any]]:
    """
    Retrieve cached search results from HomeUniversal table.
    
    Args:
        user_id: User ID to get cached results for
        
    Returns:
        List of property dictionaries in API response format
    """
    try:
        # Query current homes ordered by ranking (1 = best)
        homes = HomeUniversal.query.filter(
            HomeUniversal.user_id == str(user_id),
            HomeUniversal.current == True
        ).order_by(HomeUniversal.ranking.asc()).all()
        
        results = []
        for home in homes:
            # Transform HomeUniversal to PropertySearchResult format
            property_dict: Dict[str, Any] = {}
            
            # Basic identifiers
            if home.zpid:
                property_dict['zpid'] = str(home.zpid)
            if home.mls_home_id:
                property_dict['mls_home_id'] = home.mls_home_id
            
            # Address
            if home.address:
                property_dict['address'] = home.address
            
            # Price - convert string to number if possible
            if home.price:
                try:
                    # Remove commas and dollar signs, then convert
                    price_str = str(home.price).replace(',', '').replace('$', '').strip()
                    property_dict['price'] = int(float(price_str))
                except (ValueError, TypeError):
                    # If conversion fails, keep as string in raw_data
                    property_dict['price'] = None
            
            # Bedrooms and bathrooms - convert string to int if possible
            if home.beds:
                try:
                    property_dict['bedrooms'] = int(float(str(home.beds)))
                except (ValueError, TypeError):
                    property_dict['bedrooms'] = None
            
            if home.baths:
                try:
                    property_dict['bathrooms'] = int(float(str(home.baths)))
                except (ValueError, TypeError):
                    property_dict['bathrooms'] = None
            
            # Living area (sqft) - convert string to number
            if home.sqft or home.living_area:
                sqft_value = home.sqft or home.living_area
                try:
                    sqft_str = str(sqft_value).replace(',', '').strip()
                    property_dict['livingArea'] = int(float(sqft_str))
                except (ValueError, TypeError):
                    property_dict['livingArea'] = None
            
            # Coordinates
            if home.latitude is not None:
                property_dict['latitude'] = float(home.latitude)
            if home.longitude is not None:
                property_dict['longitude'] = float(home.longitude)
            
            # Lot area
            if home.lot_area_value:
                try:
                    lot_value_str = str(home.lot_area_value).replace(',', '').strip()
                    property_dict['lotAreaValue'] = float(lot_value_str)
                except (ValueError, TypeError):
                    property_dict['lotAreaValue'] = None
            
            if home.lot_area_unit:
                property_dict['lotAreaUnit'] = str(home.lot_area_unit)
            
            # Property type and status
            if home.property_type:
                property_dict['propertyType'] = home.property_type
            if home.listing_status:
                property_dict['listingStatus'] = home.listing_status
            
            # Image
            if home.image_url:
                property_dict['imgSrc'] = home.image_url
            
            # Score - map score to _score (backend uses _score)
            if home.score is not None:
                property_dict['_score'] = float(home.score)
            else:
                property_dict['_score'] = 0.0
            
            # Include raw_data if available for additional fields
            if home.raw_data and isinstance(home.raw_data, dict):
                # Merge any additional fields from raw_data
                for key, value in home.raw_data.items():
                    if key not in property_dict:
                        property_dict[key] = value
            
            results.append(property_dict)
        
        current_app.logger.debug(
            f"[CACHE] Retrieved {len(results)} cached results for user {user_id}"
        )
        return results
        
    except Exception as e:
        current_app.logger.error(
            f"[CACHE] ❌ Error retrieving cached results for user {user_id}: {e}",
            exc_info=True
        )
        return []


def get_cached_results_with_age(user_id: str) -> Tuple[List[Dict[str, Any]], Optional[int]]:
    """
    Retrieve cached search results with cache age information.
    
    Args:
        user_id: User ID to get cached results for
        
    Returns:
        Tuple of (results: List[Dict], cache_age_days: Optional[int]):
        - results: List of property dictionaries
        - cache_age_days: Age of cache in days, or None if no results
    """
    results = get_cached_search_results(user_id)
    
    if not results:
        return [], None
    
    # Calculate cache age from most recent home
    most_recent_home = HomeUniversal.query.filter(
        HomeUniversal.user_id == str(user_id),
        HomeUniversal.current == True
    ).order_by(HomeUniversal.updated_at.desc()).first()
    
    cache_age_days = None
    if most_recent_home and most_recent_home.updated_at:
        age_delta = datetime.utcnow() - most_recent_home.updated_at
        cache_age_days = age_delta.days
    
    return results, cache_age_days


def is_search_cache_valid(user_id: str) -> Tuple[bool, Optional[List[Dict[str, Any]]]]:
    """
    Check if search results cache is valid for a user.
    
    Cache is valid if:
    1. User has search results (HomeUniversal records with current=True)
    2. User preferences haven't changed in the last 7 days (UserPreferences.updated_at within 7 days)
    
    Args:
        user_id: User ID to check cache for
        
    Returns:
        Tuple of (is_valid: bool, cached_results: Optional[List[Dict]]):
        - If cache is valid, returns (True, cached_results)
        - If cache is invalid, returns (False, None)
    """
    try:
        # Calculate 7 days ago threshold for user preferences check
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        
        # Check if user has current search results (age doesn't matter)
        current_homes = HomeUniversal.query.filter(
            HomeUniversal.user_id == str(user_id),
            HomeUniversal.current == True
        ).order_by(HomeUniversal.ranking.asc()).all()
        
        if not current_homes:
            current_app.logger.debug(f"[CACHE] No current search results found for user {user_id}")
            return False, None
        
        # Check if user preferences have been updated within last 7 days
        user_prefs = UserPreferences.query.filter_by(user_id=str(user_id)).first()
        
        if not user_prefs:
            current_app.logger.debug(f"[CACHE] No user preferences found for user {user_id}")
            return False, None
        
        if not user_prefs.updated_at or user_prefs.updated_at < seven_days_ago:
            current_app.logger.debug(
                f"[CACHE] User preferences too old for user {user_id}. "
                f"Updated: {user_prefs.updated_at}, threshold: {seven_days_ago}"
            )
            return False, None
        
        # Both conditions met - cache is valid
        cached_results = get_cached_search_results(user_id)
        
        return True, cached_results
        
    except Exception as e:
        current_app.logger.error(
            f"[CACHE] ❌ Error checking cache validity for user {user_id}: {e}",
            exc_info=True
        )
        return False, None


def get_cached_results_for_only_cached(user_id: str) -> Tuple[Optional[List[Dict[str, Any]]], Optional[int]]:
    """
    Get cached results with age when onlyCached=true, even if cache is invalid.
    This ensures the route never returns empty results - returns DB data if available.
    
    Args:
        user_id: User ID to get cached results for
        
    Returns:
        Tuple of (results: Optional[List[Dict]], cache_age_days: Optional[int]):
        - results: List of property dictionaries if found, None if no results exist
        - cache_age_days: Age of cache in days, or None if no results
    """
    results, cache_age_days = get_cached_results_with_age(user_id)
    return (results if results else None, cache_age_days)


def mark_past_search_results_as_not_current(user_id: str) -> int:
    """
    Mark all past search results for a user as not current (current=False).
    This should be called at the start of a new search to ensure old results
    are properly archived before new results are saved.
    
    Args:
        user_id: User ID to mark past results for
        
    Returns:
        Number of records updated
    """
    try:
        # Find all current homes for this user
        current_homes = HomeUniversal.query.filter(
            HomeUniversal.user_id == str(user_id),
            HomeUniversal.current == True
        ).all()
        
        count = len(current_homes)
        if count > 0:
            # Mark all as not current
            for home in current_homes:
                home.current = False
            
            db.session.commit()
            current_app.logger.debug(
                f"[CACHE] Marked {count} past search results as not current for user {user_id}"
            )
        
        return count
        
    except Exception as e:
        current_app.logger.error(
            f"[CACHE] ❌ Error marking past search results as not current for user {user_id}: {e}",
            exc_info=True
        )
        db.session.rollback()
        return 0

