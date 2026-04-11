"""Slipstream API configuration: base URL, auth tokens, market constant.

Sample response shape for one listing: ``slipstream_response_reference.SLIPSTREAM_LISTINGS_GET_RESPONSE_EXAMPLE``.
"""

from __future__ import annotations

import os

SLIPSTREAM_BASE = "https://slipstream.homejunction.com"
SLIPSTREAM_PRIVATE = os.getenv("SLIPSTREAM_PRIVATE")
SLIPSTREAM_PUBLIC = os.getenv("SLIPSTREAM_PUBLIC")
SLIPSTREAM_LIC_KEY = os.getenv("SLIPSTREAM_LIC_KEY")
SLIPSTREAM_MARKET = "GAMLS"
