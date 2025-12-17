"""
API client helper for RapidAPI requests with retry logic and session management.
"""
from __future__ import annotations

import os
from typing import Dict, Any
from urllib3.util.retry import Retry
from requests.adapters import HTTPAdapter
import requests


RAPI_HOST = "us-housing-market-data1.p.rapidapi.com"
RAPI_KEY = os.getenv('RAPIDAPI_KEY')
API_BASE = f"https://{RAPI_HOST}"


def build_session() -> requests.Session:
    """Build pooled session with retry/backoff."""
    s = requests.Session()
    retry = Retry(
        total=5,
        backoff_factor=0.5,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=frozenset(["GET"]),
        raise_on_status=False,
    )
    s.mount("https://", HTTPAdapter(max_retries=retry))
    s.mount("http://", HTTPAdapter(max_retries=retry))
    return s


def get_rapidapi_headers() -> Dict[str, str]:
    """Get standard RapidAPI headers."""
    return {
        "x-rapidapi-host": RAPI_HOST,
        "x-rapidapi-key": RAPI_KEY,
        "Accept": "application/json"
    }
