"""Hash client IPs for rev-share click storage (no raw IP at rest)."""

from __future__ import annotations

import hashlib
import hmac
import os


def hash_client_ip(ip_address: str | None) -> str | None:
    if not ip_address or not str(ip_address).strip():
        return None
    secret = os.getenv("REV_SHARE_IP_HASH_SECRET") or os.getenv("SECRET_KEY") or "dev-rev-share-ip"
    normalized = str(ip_address).strip()
    digest = hmac.new(secret.encode("utf-8"), normalized.encode("utf-8"), hashlib.sha256)
    return digest.hexdigest()
