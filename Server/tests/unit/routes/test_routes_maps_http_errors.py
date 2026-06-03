"""Maps script route HTTP error semantics."""

import os
from unittest.mock import patch


def test_maps_script_unset_api_key_returns_503(client, monkeypatch):
    monkeypatch.delenv("GOOGLE_MAPS_API_KEY", raising=False)
    response = client.get("/api/maps/script")

    assert response.status_code == 503
    body = response.get_json()
    assert body["success"] is False
    assert body["error"] == "configuration_error"
    assert "error_id" in body
    assert "Google Maps API key" not in body.get("message", "")


def test_maps_script_empty_api_key_returns_503(client, monkeypatch):
    monkeypatch.setenv("GOOGLE_MAPS_API_KEY", "")
    response = client.get("/api/maps/script")

    assert response.status_code == 503
    body = response.get_json()
    assert body["error"] == "configuration_error"


def test_maps_script_configured_returns_script_url(client):
    with patch.dict(os.environ, {"GOOGLE_MAPS_API_KEY": "test-maps-key"}):
        response = client.get("/api/maps/script")

    assert response.status_code == 200
    body = response.get_json()
    assert body["success"] is True
    assert "script_url" in body
    assert "test-maps-key" in body["script_url"]
