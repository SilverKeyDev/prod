"""
Image fetching utilities for property research endpoints.
Handles fetching images from Zillow API.
"""
from typing import List, Optional, Dict, Any
import requests
from flask import current_app

RAPI_HOST = "us-housing-market-data1.p.rapidapi.com"


def fetch_zillow_images(
    zpid: str,
    rapidapi_key: str
) -> List[str]:
    """
    Fetch property images from Zillow images API.
    
    Args:
        zpid: ZPID of the property
        rapidapi_key: RapidAPI key
        
    Returns:
        List of image URLs
    """
    zillow_api_images = []
    
    if not zpid:
        return zillow_api_images
    
    try:
        images_url = f"https://{RAPI_HOST}/images"
        images_params = {"zpid": zpid}
        images_headers = {
            "X-RapidAPI-Key": rapidapi_key,
            "X-RapidAPI-Host": RAPI_HOST
        }
        
        images_response = requests.get(
            images_url,
            headers=images_headers,
            params=images_params,
            timeout=300
        )
        
        if images_response.status_code == 200:
            images_data = images_response.json()
            
            # Extract image URLs from the response
            if isinstance(images_data, dict):
                # Look for images in various possible fields
                for key in ['images', 'photos', 'imageList', 'data']:
                    if key in images_data and isinstance(images_data[key], list):
                        for img_item in images_data[key]:
                            if isinstance(img_item, str):
                                zillow_api_images.append(img_item)
                            elif isinstance(img_item, dict):
                                # Look for URL fields
                                for url_key in ['url', 'src', 'href', 'link']:
                                    if url_key in img_item and isinstance(img_item[url_key], str):
                                        zillow_api_images.append(img_item[url_key])
                                        break
        
    except Exception as e:
        current_app.logger.warning(f"🖼️ [PROPERTY] Failed to fetch images from Zillow API: {e}")
    
    return zillow_api_images


def extract_primary_image(
    zillow_api_images: List[str],
    data: Optional[Dict[str, Any]]
) -> Optional[str]:
    """
    Extract primary image URL from images list or property data.
    
    Args:
        zillow_api_images: List of image URLs from Zillow API
        data: Property data dict
        
    Returns:
        Primary image URL if found, None otherwise
    """
    # Try images from API first
    if zillow_api_images:
        return zillow_api_images[0]
    
    # Fallback to data fields
    if data and isinstance(data, dict):
        for key in ['imgSrc', 'image', 'image_url', 'imageUrl']:
            if data.get(key):
                return data.get(key)
    
    return None
