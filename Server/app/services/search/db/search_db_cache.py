"""Cache operations for search results (HomeUniversal current results)."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from flask import current_app

from app import db
from app.models import HomeUniversal
from app.services.aggregation import get_preferences_updated_at


def get_cached_search_results(user_id: str) -> list[dict[str, Any]]:
    """
    Retrieve cached search results from HomeUniversal table.

    Args:
        user_id: User ID to get cached results for

    Returns:
        List of property dictionaries in API response format
    """
    try:
        homes = (
            HomeUniversal.query.filter(
                HomeUniversal.user_id == str(user_id), HomeUniversal.current is True
            )
            .order_by(HomeUniversal.ranking.asc())
            .all()
        )

        results = []
        for home in homes:
            property_dict: dict[str, Any] = {}

            if home.zpid:
                property_dict["zpid"] = str(home.zpid)
            if home.mls_home_id:
                property_dict["mls_home_id"] = home.mls_home_id
            if home.address:
                property_dict["address"] = home.address

            if home.price:
                try:
                    price_str = str(home.price).replace(",", "").replace("$", "").strip()
                    property_dict["price"] = int(float(price_str))
                except (ValueError, TypeError):
                    property_dict["price"] = None

            if home.beds:
                try:
                    property_dict["bedrooms"] = int(float(str(home.beds)))
                except (ValueError, TypeError):
                    property_dict["bedrooms"] = None
            if home.baths:
                try:
                    property_dict["bathrooms"] = int(float(str(home.baths)))
                except (ValueError, TypeError):
                    property_dict["bathrooms"] = None

            if home.sqft or home.living_area:
                sqft_value = home.sqft or home.living_area
                try:
                    sqft_str = str(sqft_value).replace(",", "").strip()
                    property_dict["livingArea"] = int(float(sqft_str))
                except (ValueError, TypeError):
                    property_dict["livingArea"] = None

            if home.latitude is not None:
                property_dict["latitude"] = float(home.latitude)
            if home.longitude is not None:
                property_dict["longitude"] = float(home.longitude)

            if home.lot_area_value:
                try:
                    lot_value_str = str(home.lot_area_value).replace(",", "").strip()
                    property_dict["lotAreaValue"] = float(lot_value_str)
                except (ValueError, TypeError):
                    property_dict["lotAreaValue"] = None
            if home.lot_area_unit:
                property_dict["lotAreaUnit"] = str(home.lot_area_unit)

            if home.property_type:
                property_dict["propertyType"] = home.property_type
            if home.listing_status:
                property_dict["listingStatus"] = home.listing_status
            if home.image_url:
                property_dict["imgSrc"] = home.image_url

            if home.score is not None:
                property_dict["_score"] = float(home.score)
            else:
                property_dict["_score"] = 0.0

            if home.raw_data and isinstance(home.raw_data, dict):
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
            f"[CACHE] ❌ Error retrieving cached results for user {user_id}: {e}", exc_info=True
        )
        return []


def get_cached_results_with_age(user_id: str) -> tuple[list[dict[str, Any]], int | None]:
    """
    Retrieve cached search results with cache age information.

    Returns:
        Tuple of (results, cache_age_days). cache_age_days is None if no results.
    """
    results = get_cached_search_results(user_id)
    if not results:
        return [], None

    most_recent_home = (
        HomeUniversal.query.filter(
            HomeUniversal.user_id == str(user_id), HomeUniversal.current is True
        )
        .order_by(HomeUniversal.updated_at.desc())
        .first()
    )

    cache_age_days = None
    if most_recent_home and most_recent_home.updated_at:
        age_delta = datetime.utcnow() - most_recent_home.updated_at
        cache_age_days = age_delta.days

    return results, cache_age_days


def is_search_cache_valid(user_id: str) -> tuple[bool, list[dict[str, Any]] | None]:
    """
    Check if search results cache is valid for a user.
    Cache is valid if user has current results and preferences updated within 7 days.
    """
    try:
        seven_days_ago = datetime.utcnow() - timedelta(days=7)

        current_homes = (
            HomeUniversal.query.filter(
                HomeUniversal.user_id == str(user_id), HomeUniversal.current is True
            )
            .order_by(HomeUniversal.ranking.asc())
            .all()
        )

        if not current_homes:
            current_app.logger.debug(f"[CACHE] No current search results found for user {user_id}")
            return False, None

        prefs_updated_at = get_preferences_updated_at(str(user_id))
        if not prefs_updated_at:
            current_app.logger.debug(f"[CACHE] No user preferences found for user {user_id}")
            return False, None
        if prefs_updated_at < seven_days_ago:
            current_app.logger.debug(
                f"[CACHE] User preferences too old for user {user_id}. "
                f"Updated: {prefs_updated_at}, threshold: {seven_days_ago}"
            )
            return False, None

        cached_results = get_cached_search_results(user_id)
        return True, cached_results

    except Exception as e:
        current_app.logger.error(
            f"[CACHE] ❌ Error checking cache validity for user {user_id}: {e}", exc_info=True
        )
        return False, None


def get_cached_results_for_only_cached(
    user_id: str,
) -> tuple[list[dict[str, Any]] | None, int | None]:
    """
    Get cached results with age when onlyCached=true, even if cache is invalid.
    """
    results, cache_age_days = get_cached_results_with_age(user_id)
    return (results if results else None, cache_age_days)


def mark_past_search_results_as_not_current(user_id: str) -> int:
    """
    Mark all past search results for a user as not current (current=False).
    Returns number of records updated.
    """
    try:
        current_homes = HomeUniversal.query.filter(
            HomeUniversal.user_id == str(user_id), HomeUniversal.current is True
        ).all()

        count = len(current_homes)
        if count > 0:
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
            exc_info=True,
        )
        db.session.rollback()
        return 0
