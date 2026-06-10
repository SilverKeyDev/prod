"""Optional GeoIP lookup for click analytics (city/zip)."""

from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class GeoIpResult:
    city: str | None
    zip_code: str | None
    region: str | None


def lookup_geo_for_ip(ip_address: str | None) -> GeoIpResult:
    """Return geo fields when GeoIP2 database path is configured; else empty."""
    if not ip_address or not str(ip_address).strip():
        return GeoIpResult(city=None, zip_code=None, region=None)

    db_path = os.getenv("GEOIP_DATABASE_PATH", "").strip()
    if not db_path:
        return GeoIpResult(city=None, zip_code=None, region=None)

    try:
        import geoip2.database  # type: ignore[import-untyped]
        import geoip2.errors  # type: ignore[import-untyped]
    except ImportError:
        return GeoIpResult(city=None, zip_code=None, region=None)

    try:
        with geoip2.database.Reader(db_path) as reader:
            record = reader.city(str(ip_address).strip())
            city = record.city.name
            zip_code = record.postal.code
            region = record.subdivisions.most_specific.iso_code if record.subdivisions else None
            return GeoIpResult(city=city, zip_code=zip_code, region=region)
    except Exception:
        return GeoIpResult(city=None, zip_code=None, region=None)
