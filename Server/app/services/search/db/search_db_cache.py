"""Cache operations for search results (UserPropertyLink + PropertyCache)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from flask import current_app
from sqlalchemy.orm import joinedload

from app import db
from app.models import PropertyCache, UserPropertyLink


def get_cached_search_results(user_id: str) -> list[dict[str, Any]]:
    """Retrieve cached search results from PropertyCache + UserPropertyLink."""
    try:
        links = (
            UserPropertyLink.query.options(joinedload(UserPropertyLink.property))
            .filter(
                UserPropertyLink.user_id == str(user_id),
                UserPropertyLink.current.is_(True),
            )
            .order_by(UserPropertyLink.ranking.asc())
            .all()
        )

        results = []
        for link in links:
            prop = link.property
            if not prop or not isinstance(prop, PropertyCache):
                continue
            property_dict: dict[str, Any] = {}

            if prop.zpid:
                property_dict["zpid"] = str(prop.zpid)
            if prop.mls_home_id:
                property_dict["mls_home_id"] = prop.mls_home_id
            if prop.address:
                property_dict["address"] = prop.address

            if prop.price:
                try:
                    price_str = str(prop.price).replace(",", "").replace("$", "").strip()
                    property_dict["price"] = int(float(price_str))
                except (ValueError, TypeError):
                    property_dict["price"] = None

            if prop.beds:
                try:
                    property_dict["bedrooms"] = int(float(str(prop.beds)))
                except (ValueError, TypeError):
                    property_dict["bedrooms"] = None
            if prop.baths:
                try:
                    property_dict["bathrooms"] = int(float(str(prop.baths)))
                except (ValueError, TypeError):
                    property_dict["bathrooms"] = None

            sqft_value = prop.sqft or prop.living_area
            if sqft_value:
                try:
                    sqft_str = str(sqft_value).replace(",", "").strip()
                    property_dict["livingArea"] = int(float(sqft_str))
                except (ValueError, TypeError):
                    property_dict["livingArea"] = None

            if prop.latitude is not None:
                property_dict["latitude"] = float(prop.latitude)
            if prop.longitude is not None:
                property_dict["longitude"] = float(prop.longitude)

            if prop.lot_area_value:
                try:
                    lot_str = str(prop.lot_area_value).replace(",", "").strip()
                    property_dict["lotAreaValue"] = float(lot_str)
                except (ValueError, TypeError):
                    property_dict["lotAreaValue"] = None
            if prop.lot_area_unit:
                property_dict["lotAreaUnit"] = str(prop.lot_area_unit)

            if prop.property_type:
                property_dict["propertyType"] = prop.property_type
            if prop.home_type:
                property_dict["homeType"] = prop.home_type
            if prop.listing_status:
                property_dict["listingStatus"] = prop.listing_status
            if prop.primary_image_url:
                property_dict["imgSrc"] = prop.primary_image_url

            if prop.year_built:
                try:
                    property_dict["yearBuilt"] = int(float(str(prop.year_built)))
                except (ValueError, TypeError):
                    property_dict["yearBuilt"] = prop.year_built

            if prop.city:
                property_dict["city"] = prop.city
            if prop.state:
                property_dict["state"] = prop.state
            if prop.zipcode:
                property_dict["zipcode"] = prop.zipcode

            if prop.living_area:
                try:
                    la_str = str(prop.living_area).replace(",", "").strip()
                    property_dict["sqft"] = int(float(la_str))
                except (ValueError, TypeError):
                    pass

            if prop.images and isinstance(prop.images, list):
                property_dict["images"] = prop.images

            if link.score is not None:
                property_dict["_score"] = float(link.score)
            else:
                hydrated_score: float | None = None
                if prop.raw_data and isinstance(prop.raw_data, dict):
                    for score_key in ("_score", "score"):
                        raw_val = prop.raw_data.get(score_key)
                        if isinstance(raw_val, int | float):
                            hydrated_score = float(raw_val)
                            break
                property_dict["_score"] = hydrated_score if hydrated_score is not None else 0.0

            if prop.raw_data and isinstance(prop.raw_data, dict):
                for key, value in prop.raw_data.items():
                    if key not in property_dict:
                        property_dict[key] = value

            results.append(property_dict)

        current_app.logger.debug(
            "[CACHE] Retrieved %d cached results for user %s", len(results), user_id
        )
        return results

    except Exception as e:
        current_app.logger.error(
            "[CACHE] Error retrieving cached results for user %s: %s", user_id, e, exc_info=True
        )
        return []


def get_cached_results_with_age(user_id: str) -> tuple[list[dict[str, Any]], int | None]:
    """Retrieve cached search results with cache age information."""
    results = get_cached_search_results(user_id)
    if not results:
        return [], None

    most_recent_link = (
        UserPropertyLink.query.filter(
            UserPropertyLink.user_id == str(user_id),
            UserPropertyLink.current.is_(True),
        )
        .order_by(UserPropertyLink.updated_at.desc())
        .first()
    )

    cache_age_days = None
    if most_recent_link and most_recent_link.updated_at:
        updated_at = most_recent_link.updated_at
        if updated_at.tzinfo is None:
            updated_at = updated_at.replace(tzinfo=timezone.utc)
        age_delta = datetime.now(timezone.utc) - updated_at
        cache_age_days = age_delta.days

    return results, cache_age_days


def mark_past_search_results_as_not_current(user_id: str) -> int:
    """Mark all past search results for a user as not current."""
    try:
        current_links = UserPropertyLink.query.filter(
            UserPropertyLink.user_id == str(user_id),
            UserPropertyLink.current.is_(True),
        ).all()

        count = len(current_links)
        if count > 0:
            for link in current_links:
                link.current = False
            db.session.commit()
            current_app.logger.debug(
                "[CACHE] Marked %d past results as not current for user %s", count, user_id
            )
        return count

    except Exception as e:
        current_app.logger.error(
            "[CACHE] Error marking past results as not current for user %s: %s",
            user_id,
            e,
            exc_info=True,
        )
        db.session.rollback()
        return 0
