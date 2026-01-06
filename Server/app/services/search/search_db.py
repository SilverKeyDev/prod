from __future__ import annotations

from datetime import datetime
from typing import Optional, Dict, Any

from app import db
from app.models import HomeUniversal, HomeLikes
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
    
    # Prepare all fields from HomeUniversal
    fields = {
        "user_id": str(home_universal.user_id),
        "is_liked": home_universal.is_liked,
        "address": home_universal.address,
        "city": home_universal.city,
        "state": home_universal.state,
        "zipcode": home_universal.zipcode,
        "beds": home_universal.beds,
        "baths": home_universal.baths,
        "sqft": home_universal.sqft,
        "lot_size": home_universal.lot_size,
        "price": home_universal.price,
        "image_url": home_universal.image_url,
        "image_urls": home_universal.image_urls,
        "zpid": home_universal.zpid,
        "listing_status": home_universal.listing_status,
        "property_type": home_universal.property_type,
        "home_type": home_universal.home_type,
        "year_built": home_universal.year_built,
        "score": home_universal.score,
        "latitude": home_universal.latitude,
        "longitude": home_universal.longitude,
        "living_area": home_universal.living_area,
        "lot_area_value": home_universal.lot_area_value,
        "lot_area_unit": home_universal.lot_area_unit,
        "features": home_universal.features,
        "property_analysis": home_universal.property_analysis,
        "commute_data": home_universal.commute_data,
        "raw_data": home_universal.raw_data,
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


def add_or_update_home_basic(user_id: str, home: Dict[str, Any], set_liked: bool = False) -> HomeUniversal:
    """
    Add or update a minimal home record for a user using basic/search fields.
    - De-dupes by normalized address per user
    - Updates known fields if record exists
    - Optionally sets is_liked to True

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

    # Find existing by normalized address
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

    fields = {
        "address": address,
        "beds": str(home.get("bedrooms", "") or ""),
        "baths": str(home.get("bathrooms", "") or ""),
        "sqft": str(home.get("sqft", home.get("livingArea", "")) or ""),
        "lot_size": str(home.get("lotSize", home.get("lotAreaValue", "")) or ""),
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
        # If caller requests to like, ensure flag is set on existing record
        if set_liked:
            existing.is_liked = True
        db.session.commit()
        # Sync to HomeLikes with like history after committing HomeUniversal changes
        if set_liked:
            sync_to_home_likes(existing, action="liked")
        return existing

    record = HomeUniversal(user_id=str(user_id), **fields)
    if set_liked:
        record.is_liked = True
    db.session.add(record)
    db.session.commit()
    
    # If liked, sync to HomeLikes with like history
    if set_liked:
        sync_to_home_likes(record, action="liked")
    
    return record


