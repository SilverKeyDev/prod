from __future__ import annotations

from typing import Optional, Dict, Any

from app import db
from app.models.home_universal import HomeUniversal
from app.utils.address_format import normalize_address
from app.utils.currency import format_currency
from app.services.search.zillow_url import build_zillow_url


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

    # Build Zillow URL if not already provided
    zillow_url = home.get("zillow_url") or home.get("zillowUrl")
    if not zillow_url:
        # Construct zillow_url from property data using helper function
        # Extract zpid for params if available
        params = None
        zpid = home.get("zpid")
        if zpid:
            try:
                params = {"zpid": str(zpid).strip()}
            except Exception:
                params = None
        zillow_url = build_zillow_url(home, params)

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
    
    # Only include zillow_url if we have a value
    if zillow_url:
        fields["zillow_url"] = zillow_url

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
        return existing

    record = HomeUniversal(user_id=str(user_id), **fields)
    if set_liked:
        record.is_liked = True
    db.session.add(record)
    db.session.commit()
    return record


