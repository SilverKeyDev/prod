"""SkySlope partnership-level credentials (from AWS Secrets Manager / make secrets)."""

import os

SKYSLOPE_ACCESS_KEY = (os.getenv("SKYSLOPE_ACCESS_KEY") or "").strip() or None
SKYSLOPE_SECRET = (os.getenv("SKYSLOPE_SECRET") or "").strip() or None


def _env_value(name: str) -> str | None:
    return (os.getenv(name) or "").strip() or None


def skyslope_partnership_configured() -> bool:
    """True when partnership API credentials are present (needed for SIL-273 client)."""
    return bool(_env_value("SKYSLOPE_ACCESS_KEY") and _env_value("SKYSLOPE_SECRET"))


__all__ = ["SKYSLOPE_ACCESS_KEY", "SKYSLOPE_SECRET", "skyslope_partnership_configured"]
