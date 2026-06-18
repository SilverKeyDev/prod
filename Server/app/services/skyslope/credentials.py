"""Per-brokerage SkySlope credential storage and retrieval."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select

from app import db
from app.models.brokerage import (
    CREDENTIAL_STATUS_ACTIVE,
    CREDENTIAL_STATUS_INVALID,
    CREDENTIAL_STATUS_PENDING,
    SKYSLOPE_PROVIDER,
    BrokerageIntegrationCredential,
    BrokerageOrg,
)
from app.services.skyslope.encryption import (
    CredentialEncryptionError,
    decrypt_credential,
    encrypt_credential,
)

_ALLOWED_STATUSES = {
    CREDENTIAL_STATUS_ACTIVE,
    CREDENTIAL_STATUS_INVALID,
    CREDENTIAL_STATUS_PENDING,
}


def _key_last4(api_key: str) -> str | None:
    trimmed = api_key.strip()
    if len(trimmed) < 4:
        return None
    return trimmed[-4:]


def credential_to_metadata(row: BrokerageIntegrationCredential) -> dict[str, Any]:
    return {
        "brokerage_id": row.brokerage_id,
        "provider": row.provider,
        "key_last4": row.key_last4,
        "skyslope_org_id": row.skyslope_org_id,
        "status": row.status,
        "last_verified_at": row.last_verified_at.isoformat() if row.last_verified_at else None,
        "created_at": row.created_at.isoformat(),
        "updated_at": row.updated_at.isoformat(),
    }


def _get_brokerage_org(brokerage_id: str) -> BrokerageOrg | None:
    return db.session.scalar(select(BrokerageOrg).where(BrokerageOrg.id == brokerage_id))


def get_credential_row(
    brokerage_id: str,
    *,
    provider: str = SKYSLOPE_PROVIDER,
) -> BrokerageIntegrationCredential | None:
    return db.session.scalar(
        select(BrokerageIntegrationCredential).where(
            BrokerageIntegrationCredential.brokerage_id == brokerage_id,
            BrokerageIntegrationCredential.provider == provider,
        )
    )


def get_credential_metadata(
    brokerage_id: str,
    *,
    provider: str = SKYSLOPE_PROVIDER,
) -> dict[str, Any] | None:
    row = get_credential_row(brokerage_id, provider=provider)
    if not row:
        return None
    return credential_to_metadata(row)


def create_skyslope_credential(
    brokerage_id: str,
    *,
    api_key: str,
    skyslope_org_id: str | None = None,
) -> tuple[dict[str, Any] | None, str | None]:
    if not _get_brokerage_org(brokerage_id):
        return None, "not_found"
    if get_credential_row(brokerage_id):
        return None, "already_exists"
    trimmed_key = api_key.strip()
    if not trimmed_key:
        return None, "api_key_required"

    try:
        encrypted = encrypt_credential(trimmed_key)
    except CredentialEncryptionError:
        return None, "encryption_unavailable"

    row = BrokerageIntegrationCredential(
        brokerage_id=brokerage_id,
        provider=SKYSLOPE_PROVIDER,
        encrypted_payload=encrypted,
        key_last4=_key_last4(trimmed_key),
        skyslope_org_id=(skyslope_org_id or "").strip() or None,
        status=CREDENTIAL_STATUS_ACTIVE,
    )
    db.session.add(row)
    db.session.commit()
    return credential_to_metadata(row), None


def update_skyslope_credential(
    brokerage_id: str,
    *,
    api_key: str | None = None,
    skyslope_org_id: str | None = None,
    status: str | None = None,
) -> tuple[dict[str, Any] | None, str | None]:
    row = get_credential_row(brokerage_id)
    if not row:
        return None, "not_found"

    if api_key is not None:
        trimmed_key = api_key.strip()
        if not trimmed_key:
            return None, "api_key_required"
        try:
            row.encrypted_payload = encrypt_credential(trimmed_key)
        except CredentialEncryptionError:
            return None, "encryption_unavailable"
        row.key_last4 = _key_last4(trimmed_key)

    if skyslope_org_id is not None:
        row.skyslope_org_id = skyslope_org_id.strip() or None

    if status is not None:
        if status not in _ALLOWED_STATUSES:
            return None, "invalid_status"
        row.status = status

    row.updated_at = datetime.now(timezone.utc)
    db.session.commit()
    return credential_to_metadata(row), None


def delete_skyslope_credential(brokerage_id: str) -> bool:
    row = get_credential_row(brokerage_id)
    if not row:
        return False
    db.session.delete(row)
    db.session.commit()
    return True


def get_decrypted_skyslope_api_key(brokerage_id: str) -> str:
    """Internal: decrypt stored API key for sync service (SIL-273)."""
    row = get_credential_row(brokerage_id)
    if not row:
        raise CredentialEncryptionError("SkySlope credentials not configured for brokerage")
    return decrypt_credential(row.encrypted_payload)


def test_skyslope_credential(brokerage_id: str) -> tuple[bool, str]:
    """Verify credentials exist and decrypt locally (no SkySlope HTTP call in SIL-270)."""
    row = get_credential_row(brokerage_id)
    if not row:
        return False, "SkySlope credentials are not configured for this brokerage."
    try:
        decrypt_credential(row.encrypted_payload)
    except CredentialEncryptionError:
        return False, "Stored credentials could not be decrypted."
    row.last_verified_at = datetime.now(timezone.utc)
    row.status = CREDENTIAL_STATUS_ACTIVE
    db.session.commit()
    return True, "Stored credentials decrypt successfully."
