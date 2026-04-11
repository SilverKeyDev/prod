"""Shared Perplexity API URL and request headers."""

from __future__ import annotations

import os

PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")
PERPLEXITY_URL = "https://api.perplexity.ai/chat/completions"
PERPLEXITY_HEADERS: dict[str, str] = (
    {
        "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
        "Content-Type": "application/json",
    }
    if PERPLEXITY_API_KEY
    else {}
)
