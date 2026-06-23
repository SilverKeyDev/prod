"""Unit tests for SkySlope credential encryption (SIL-270)."""

from __future__ import annotations

import pytest

from app.services.skyslope.encryption import (
    CredentialEncryptionError,
    decrypt_credential,
    encrypt_credential,
)


@pytest.fixture(autouse=True)
def _clear_encryption_env(monkeypatch):
    monkeypatch.delenv("CREDENTIAL_ENCRYPTION_KEY", raising=False)
    monkeypatch.delenv("JWT_SIGNING_SECRET", raising=False)


def test_encrypt_decrypt_with_explicit_key(monkeypatch):
    monkeypatch.setenv("CREDENTIAL_ENCRYPTION_KEY", "test-dedicated-encryption-key")
    plaintext = "sk-brokerage-api-key-9999"
    ciphertext = encrypt_credential(plaintext)
    assert ciphertext != plaintext
    assert decrypt_credential(ciphertext) == plaintext


def test_encrypt_decrypt_falls_back_to_jwt_signing_secret(monkeypatch):
    monkeypatch.setenv("JWT_SIGNING_SECRET", "test-jwt-signing-secret-from-make-secrets")
    plaintext = "sk-brokerage-api-key-abcd"
    ciphertext = encrypt_credential(plaintext)
    assert decrypt_credential(ciphertext) == plaintext


def test_explicit_key_takes_priority_over_jwt_fallback(monkeypatch):
    monkeypatch.setenv("CREDENTIAL_ENCRYPTION_KEY", "primary-key")
    monkeypatch.setenv("JWT_SIGNING_SECRET", "fallback-key")
    ciphertext = encrypt_credential("same-plaintext")
    monkeypatch.setenv("CREDENTIAL_ENCRYPTION_KEY", "")
    monkeypatch.setenv("JWT_SIGNING_SECRET", "fallback-key")
    with pytest.raises(CredentialEncryptionError):
        decrypt_credential(ciphertext)


def test_missing_encryption_config_raises(monkeypatch):
    with pytest.raises(CredentialEncryptionError, match="not configured"):
        encrypt_credential("sk-should-fail")
