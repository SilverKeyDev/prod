"""Application-layer encryption for stored integration credentials."""

from __future__ import annotations

import base64
import hashlib
import os

from cryptography.fernet import Fernet, InvalidToken

_ENV_KEY = "CREDENTIAL_ENCRYPTION_KEY"
_FALLBACK_ENV_KEYS = ("JWT_SIGNING_SECRET",)


class CredentialEncryptionError(RuntimeError):
    """Raised when encryption configuration or crypto operations fail."""


def _resolve_encryption_secret() -> str:
    explicit = (os.getenv(_ENV_KEY) or "").strip()
    if explicit:
        return explicit
    for fallback_key in _FALLBACK_ENV_KEYS:
        value = (os.getenv(fallback_key) or "").strip()
        if value:
            return value
    raise CredentialEncryptionError(
        f"{_ENV_KEY} is not configured and no fallback secret is available "
        f"(run make secrets; uses {_FALLBACK_ENV_KEYS[0]} when {_ENV_KEY} is unset)"
    )


def _fernet() -> Fernet:
    secret = _resolve_encryption_secret()
    digest = hashlib.sha256(secret.encode("utf-8")).digest()
    key = base64.urlsafe_b64encode(digest)
    return Fernet(key)


def encrypt_credential(plaintext: str) -> str:
    if not plaintext:
        raise CredentialEncryptionError("Cannot encrypt empty credential")
    token = _fernet().encrypt(plaintext.encode("utf-8"))
    return token.decode("utf-8")


def decrypt_credential(ciphertext: str) -> str:
    if not ciphertext:
        raise CredentialEncryptionError("Cannot decrypt empty payload")
    try:
        value = _fernet().decrypt(ciphertext.encode("utf-8"))
    except InvalidToken as exc:
        raise CredentialEncryptionError("Credential decryption failed") from exc
    return value.decode("utf-8")
