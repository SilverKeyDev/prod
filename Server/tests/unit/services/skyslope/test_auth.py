import base64
import hashlib
import hmac

import pytest

from app.services.skyslope.auth import build_hmac_signature, clear_session_cache


@pytest.fixture(autouse=True)
def _env(monkeypatch):
    monkeypatch.setenv("SKYSLOPE_ACCESS_KEY", "client-id")
    monkeypatch.setenv("SKYSLOPE_SECRET", "client-secret")
    clear_session_cache()


def test_hmac():
    ts = "2024-01-15T12:00:00Z"
    sig = build_hmac_signature(access_secret="user-secret", timestamp=ts)
    msg = b"client-id:client-secret:2024-01-15T12:00:00Z"
    expected = base64.b64encode(hmac.new(b"user-secret", msg, hashlib.sha256).digest()).decode(
        "utf-8"
    )
    assert sig == expected
