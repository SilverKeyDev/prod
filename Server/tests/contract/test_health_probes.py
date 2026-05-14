"""Contract-style checks for infrastructure health routes."""

from __future__ import annotations

from app.schemas.generated import HealthResponse, LivezResponse


def test_livez_returns_ok(client):
    res = client.get("/livez")
    assert res.status_code == 200
    assert res.get_json() == {"status": "ok"}
    LivezResponse.model_validate(res.get_json())


def test_healthz_and_readyz_return_same_shape(client):
    health = client.get("/healthz")
    ready = client.get("/readyz")
    assert health.status_code == ready.status_code
    assert health.get_json() == ready.get_json()
    HealthResponse.model_validate(health.get_json())
    HealthResponse.model_validate(ready.get_json())


def test_health_probes_support_head(client):
    assert client.head("/livez").status_code == 200
    assert client.head("/healthz").status_code == 200
    assert client.head("/readyz").status_code == 200
