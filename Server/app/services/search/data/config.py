"""Search upstream API configuration.

Listing/search/detail/comps: RapidAPI (SIL-324).
Area suggestions + boundaries: Slipstream (HomeJunction) — intentionally retained.
"""

from __future__ import annotations

import os

# ---- RapidAPI (listing / search / detail / comps) ----
RAPIDAPI_HOST = "us-housing-market-data1.p.rapidapi.com"
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
RAPIDAPI_BASE = f"https://{RAPIDAPI_HOST}"

# ---- Slipstream (HomeJunction) — area suggestions / boundaries only ----
SLIPSTREAM_BASE = "https://slipstream.homejunction.com"
SLIPSTREAM_PRIVATE = os.getenv("SLIPSTREAM_PRIVATE")
SLIPSTREAM_PUBLIC = os.getenv("SLIPSTREAM_PUBLIC")
SLIPSTREAM_LIC_KEY = os.getenv("SLIPSTREAM_LIC_KEY")
SLIPSTREAM_MARKET = "GAMLS"
