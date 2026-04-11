"""
Image fetching utilities for property research endpoints.
Handles fetching images from Slipstream property API.
"""

from typing import Any

from flask import current_app

from app.services.search.data import get_property_images as _slipstream_get_images


def fetch_zillow_images(zpid: str, rapidapi_key: str | None = None) -> list[str]:
    """
    Fetch property images from Slipstream API.

    Args:
        zpid: Property / MLS listing ID
        rapidapi_key: Unused (kept for backward compat signature)

    Returns:
        List of image URLs
    """
    if not zpid:
        return []

    try:
        return _slipstream_get_images(str(zpid))
    except Exception as e:
        current_app.logger.warning(f"🖼️ [PROPERTY] Failed to fetch images from API: {e}")
        return []


def extract_primary_image(zillow_api_images: list[str], data: dict[str, Any] | None) -> str | None:
    """
    Extract primary image URL from images list or property data.

    Args:
        zillow_api_images: List of image URLs from property API
        data: Property data dict

    Returns:
        Primary image URL if found, None otherwise
    """
    if zillow_api_images:
        return zillow_api_images[0]

    if data and isinstance(data, dict):
        imgs = data.get("images")
        if isinstance(imgs, list) and imgs:
            return imgs[0]
        for key in ["imgSrc", "image", "image_url", "imageUrl"]:
            if data.get(key):
                return data.get(key)

    return None
