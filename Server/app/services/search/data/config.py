"""Search upstream API configuration.

RapidAPI (Zillow-shaped housing data) is the listing/search provider target for SIL-324.
Slipstream constants remain for area-boundary routes until that decision is finalized.
"""

from __future__ import annotations

import os

# ---- RapidAPI (listing / search / detail / comps) ----
RAPIDAPI_HOST = "us-housing-market-data1.p.rapidapi.com"
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
RAPIDAPI_BASE = f"https://{RAPIDAPI_HOST}"

# ---- Slipstream (HomeJunction) — keep for area suggestions/boundaries for now ----
SLIPSTREAM_BASE = "https://slipstream.homejunction.com"
SLIPSTREAM_PRIVATE = os.getenv("SLIPSTREAM_PRIVATE")
SLIPSTREAM_PUBLIC = os.getenv("SLIPSTREAM_PUBLIC")
SLIPSTREAM_LIC_KEY = os.getenv("SLIPSTREAM_LIC_KEY")
SLIPSTREAM_MARKET = "GAMLS"
