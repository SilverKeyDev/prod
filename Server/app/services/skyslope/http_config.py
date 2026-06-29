"""HTTP settings for SkySlope Transaction Management API."""

from __future__ import annotations

import os

SKYSLOPE_API_BASE_URL = (os.getenv("SKYSLOPE_API_BASE_URL") or "https://api/skyslope.com").rstrip(
    "/"
)

SKYSLOPE_REQUEST_TIMEOUT_SEC = 30
SKYSLOPE_PAGE_SIZE = 10  # SkySlope list endpoints return 10 items per page

SKYSLOPE_AUTH_LOGIN_PATH = "/auth/login"
SKYSLOPE_HEALTHCHECK_PATH = "/api/healthcheck"
SKYSLOPE_FILES_PATH = "/api/files"

SKYSLOPE_BULK_OBJECT_TYPE = "sale"  # summary | sale | listing
