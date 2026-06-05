"""Fetch images from SERP API for PDF (e.g. home_image_prompt, community images)."""

import os
from urllib.parse import quote_plus

import requests

from logger import log

SERP_API_KEY = os.getenv("SERP_API")
SERP_API_ENDPOINT = "https://serpapi.com/search.json"

BAD_IMAGE_DOMAINS = [
    "facebook.com",
    "lookaside.fbsbx.com",
    "instagram.com",
    "lookaside.instagram.com",
    "cdninstagram.com",
    "twitter.com",
    "twimg.com",
    "linkedin.com",
    "licdn.com",
    "pinterest.com",
    "pinimg.com",
    "tumblr.com",
    "tiktokcdn.com",
    "tiktok.com",
    "reddit.com",
    "redd.it",
    "shutterstock.com",
    "shutterstock.com/image",
    "shutterstock.com/thumb",
    "dreamstime.com",
    "istockphoto.com",
    "gettyimages.com",
    "alamy.com",
    "123rf.com",
    "depositphotos.com",
    "bigstockphoto.com",
    "adobe.com/stock",
    "canstockphoto.com",
    "fotolia.com",
    "amazon.com",
    "ebay.com",
    "etsy.com",
    "walmart.com",
    "shopify.com",
    "target.com",
    "imdb.com",
    "flickr.com",
    "slideshare.net",
    "quora.com",
    "yelp.com",
    "tripadvisor.com",
    "zillow.com",
    "realtor.com",
    "freepik.com",
    "pexels.com",
    "unsplash.com",
    "pixabay.com",
    "picclick.com",
    "publicdomainpictures.net",
    "wallpaperflare.com",
    "wallpapercave.com",
    "wallhaven.cc",
    "deviantart.net",
    "artstation.com",
    "media-amazon.com",
    "blogspot.com",
    "wordpress.com",
]


def fetch_image_from_serp(prompt: str) -> str:
    """Return first usable image URL for the given prompt, or empty string."""
    if not SERP_API_KEY:
        log.warn("API", "SERP_API_KEY not set; cannot fetch images")
        return ""
    try:
        params = {
            "engine": "google",
            "q": prompt,
            "tbm": "isch",
            "num": "5",
            "api_key": SERP_API_KEY,
        }
        query_str = "&".join(f"{k}={quote_plus(str(v))}" for k, v in params.items())
        response = requests.get(f"{SERP_API_ENDPOINT}?{query_str}", timeout=30)
        if response.status_code == 200:
            data = response.json()
            images_results = data.get("images_results", [])
            for result in images_results:
                candidate = result.get("original") or result.get("thumbnail") or ""
                if not candidate:
                    continue
                if any(domain in candidate for domain in BAD_IMAGE_DOMAINS):
                    continue
                return candidate
        log.warn("API", "SERP API returned no usable image", {"prompt": prompt})
    except Exception as e:
        log.warn("API", "SERP API error", {"prompt": prompt, "error": str(e)})
    return ""
