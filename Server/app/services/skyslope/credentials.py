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
from app.services.skyslope.credential_payload import (
    parse_brokerage_credentials,
    serialize_brokerage_credentials,
)
from app.services.skyslope.encryption import (
    CredentialEncryptionError,
    decrypt_credential,
    encrypt_credential,
)
from app.services.skyslope.errors import SkySlopeAuthError, SkySlopeError, public_error_message

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


def get_brokerage_access_credentials(brokerage_id: str) -> tuple[str, str]:
    row = get_credential_row(brokerage_id)
    if not row:
        raise CredentialEncryptionError("SkySlope credentials not configured for brokerage")
    access_key, access_secret = parse_brokerage_credentials(
        decrypt_credential(row.encrypted_payload)
    )
    if not access_key:
        raise CredentialEncryptionError("SkySlope access key missing for brokerage")
    return access_key, access_secret


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
    access_secret: str | None = None,
    skyslope_org_id: str | None = None,
) -> tuple[dict[str, Any] | None, str | None]:
    if not _get_brokerage_org(brokerage_id):
        return None, "not_found"
    if get_credential_row(brokerage_id):
        return None, "already_exists"
    trimmed_key = api_key.strip()
    if not trimmed_key:
        return None, "api_key_required"

    payload_plaintext = (
        serialize_brokerage_credentials(
            access_key=trimmed_key,
            access_secret=(access_secret or "").strip(),
        )
        if access_secret is not None
        else trimmed_key
    )

    try:
        encrypted = encrypt_credential(payload_plaintext)
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
    access_secret: str | None = None,
    skyslope_org_id: str | None = None,
    status: str | None = None,
) -> tuple[dict[str, Any] | None, str | None]:
    row = get_credential_row(brokerage_id)
    if not row:
        return None, "not_found"

    if api_key is not None or access_secret is not None:
        current_key, current_secret = parse_brokerage_credentials(
            decrypt_credential(row.encrypted_payload)
        )
        next_key = api_key.strip() if api_key is not None else current_key
        next_secret = access_secret.strip() if access_secret is not None else current_secret
        if not next_key:
            return None, "api_key_required"
        try:
            row.encrypted_payload = encrypt_credential(
                serialize_brokerage_credentials(
                    access_key=next_key,
                    access_secret=next_secret,
                )
            )
        except CredentialEncryptionError:
            return None, "encryption_unavailable"
        row.key_last4 = _key_last4(next_key)

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
    """Backward-compatible accessor returning the brokerage AccessKey only."""
    access_key, _ = get_brokerage_access_credentials(brokerage_id)
    return access_key


def test_skyslope_credential(brokerage_id: str) -> tuple[bool, str]:
    """Verify credentials against SkySlope GET /api/healthcheck."""
    from app.services.skyslope.client import SkySlopeClient

    row = get_credential_row(brokerage_id)
    if not row:
        return False, "SkySlope credentials are not configured for this brokerage."
    try:
        access_key, access_secret = get_brokerage_access_credentials(brokerage_id)
    except CredentialEncryptionError:
        return False, "Stored credentials could not be decrypted."
    if not access_secret:
        return False, "SkySlope AccessSecret is required. Update credentials with both keys."
    try:
        SkySlopeClient(
            access_key=access_key,
            access_secret=access_secret,
            skyslope_org_id=row.skyslope_org_id,
        ).test_connection()
    except SkySlopeAuthError:
        row.status = CREDENTIAL_STATUS_INVALID
        row.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        return False, "Invalid SkySlope credentials or unauthorized access."
    except SkySlopeError as exc:
        return False, public_error_message(exc)
    row.last_verified_at = datetime.now(timezone.utc)
    row.status = CREDENTIAL_STATUS_ACTIVE
    db.session.commit()
    return True, "SkySlope connection successful."
