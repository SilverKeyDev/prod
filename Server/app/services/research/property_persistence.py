"""
Data persistence utilities for property research endpoints.
Handles persisting property data to HomeUniversal database.
"""
from typing import Dict, Any, Optional, List
from flask import current_app

from app import db
from app.models import HomeUniversal
from app.utils.address_format import normalize_address
from app.utils.currency import format_currency


def build_update_fields(
    data: Dict[str, Any],
    params: Dict[str, Any],
    full_address: str,
    primary_image: Optional[str],
    zillow_api_images: List[str],
    features: Dict[str, Any],
    property_analysis: Dict[str, Any],
    commute_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Build update fields dict for HomeUniversal record.
    
    Args:
        data: Property data dict
        params: API parameters dict
        full_address: Full address string
        primary_image: Primary image URL
        zillow_api_images: List of image URLs
        features: Property features dict
        property_analysis: Property analysis dict
        commute_data: Commute data dict
        
    Returns:
        Dict with update fields for HomeUniversal
    """
    # Extract address fields from data
    street = city = state = ""
    zipcode = None
    addr = data.get("address") or {}
    if isinstance(addr, dict):
        street = (addr.get("streetAddress") or "").strip()
        city = (addr.get("city") or "").strip()
        state = (addr.get("state") or "").strip()
        zipcode = (addr.get("zipcode") or addr.get("zipCode") or None)
        zipcode = (str(zipcode).strip() if zipcode else None)
    street = street or (data.get("streetAddress") or "").strip()
    city = city or (data.get("city") or "").strip()
    state = state or (data.get("state") or "").strip()
    zipcode = zipcode or (str(data.get("zipcode") or data.get("zipCode") or "").strip() or None)
    
    return {
        'address': full_address,
        'city': city or data.get('city'),
        'state': state or data.get('state'),
        'zipcode': zipcode or data.get('zipcode') or data.get('zipCode'),
        'beds': str(data.get('bedrooms', data.get('beds', '')) or ''),
        'baths': str(data.get('bathrooms', data.get('baths', '')) or ''),
        'sqft': str(data.get('livingArea', data.get('sqft', '')) or ''),
        'lot_size': str(data.get('lotAreaValue', '') or ''),
        'price': format_currency(data.get('price', data.get('listPrice', ''))),
        'image_url': primary_image or '',
        'image_urls': zillow_api_images or [],
        'zpid': str(data.get('zpid') or (params.get('zpid') if isinstance(params, dict) else '') or ''),
        'listing_status': data.get('listingStatus'),
        'property_type': data.get('propertyType', data.get('homeType')),
        'home_type': data.get('homeType'),
        'year_built': str(data.get('yearBuilt') or ''),
        'latitude': data.get('latitude'),
        'longitude': data.get('longitude'),
        'living_area': str(data.get('livingArea', '') or ''),
        'lot_area_value': str(data.get('lotAreaValue', '') or ''),
        'lot_area_unit': data.get('lotAreaUnit'),
        'features': features,
        'property_analysis': property_analysis,
        'commute_data': commute_data,
        'raw_data': data,
    }


def find_existing_record(
    user_id: str,
    full_address: str
) -> Optional[HomeUniversal]:
    """
    Find existing HomeUniversal record by normalized address.
    
    Args:
        user_id: User ID
        full_address: Full address string
        
    Returns:
        HomeUniversal record if found, None otherwise
    """
    if not full_address:
        return None
    
    target_norm = None
    try:
        target_norm = normalize_address(full_address)
    except Exception:
        target_norm = full_address.strip().lower()
    
    for h in HomeUniversal.query.filter_by(user_id=str(user_id)).all():
        if not h.address:
            continue
        try:
            norm_existing = normalize_address(h.address)
        except Exception:
            norm_existing = h.address.strip().lower()
        if norm_existing == target_norm:
            return h
    
    return None


def persist_property_data(
    user_id: str,
    data: Dict[str, Any],
    params: Dict[str, Any],
    address: Optional[str],
    zillow_api_images: List[str],
    features: Dict[str, Any],
    property_analysis: Dict[str, Any],
    commute_data: Dict[str, Any],
    primary_image: Optional[str]
) -> None:
    """
    Persist property data to HomeUniversal database (upsert by normalized address).
    
    Args:
        user_id: User ID
        data: Property data dict
        params: API parameters dict
        address: Address string from request
        zillow_api_images: List of image URLs
        features: Property features dict
        property_analysis: Property analysis dict
        commute_data: Commute data dict
        primary_image: Primary image URL
    """
    try:
        # Derive address parts from payload
        street = city = state = ""
        zipcode = None
        addr = data.get("address") or {}
        if isinstance(addr, dict):
            street = (addr.get("streetAddress") or "").strip()
            city = (addr.get("city") or "").strip()
            state = (addr.get("state") or "").strip()
            zipcode = (addr.get("zipcode") or addr.get("zipCode") or None)
            zipcode = (str(zipcode).strip() if zipcode else None)
        street = street or (data.get("streetAddress") or "").strip()
        city = city or (data.get("city") or "").strip()
        state = state or (data.get("state") or "").strip()
        zipcode = zipcode or (str(data.get("zipcode") or data.get("zipCode") or "").strip() or None)
        
        full_address = None
        if street and city and state:
            full_address = f"{street}, {city}, {state} {zipcode or ''}".strip()
        else:
            full_address = data.get('streetAddress') or address or ''
        
        if not full_address:
            current_app.logger.warning("[PROPERTY] No address found, skipping persistence")
            return
        
        # Find existing record
        existing = find_existing_record(user_id, full_address)
        
        # Build update fields
        update_fields = build_update_fields(
            data=data,
            params=params,
            full_address=full_address,
            primary_image=primary_image,
            zillow_api_images=zillow_api_images,
            features=features,
            property_analysis=property_analysis,
            commute_data=commute_data
        )
        
        # Update or create record
        if existing:
            # Preserve like state
            for k, v in update_fields.items():
                setattr(existing, k, v)
            # Mark as current when updating
            existing.current = True
        else:
            record = HomeUniversal(user_id=str(user_id), current=True, **update_fields)
            db.session.add(record)
        
        db.session.commit()
        
    except Exception as persist_err:
        current_app.logger.error(
            f"[PROPERTY] ⚠️ Failed to persist property details to HomeUniversal: {persist_err}",
            exc_info=True
        )
