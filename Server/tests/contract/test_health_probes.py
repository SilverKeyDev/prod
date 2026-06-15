"""Contract-style checks for infrastructure health routes."""

from __future__ import annotations

from app.schemas.generated import HealthResponse, LivezResponse


def test_livez_returns_ok(client):
    res = client.get("/livez")
    assert res.status_code == 200
    assert res.get_json() == {"status": "ok"}
    LivezResponse.model_validate(res.get_json())


def test_healthz_returns_db_shape(client):
    health = client.get("/healthz")
    assert health.status_code == 200
    HealthResponse.model_validate(health.get_json())
    body = health.get_json()
    assert body["status"] == "ok"
    assert body["database"] == "connected"


def test_readyz_includes_redis_status(client):
    ready = client.get("/readyz")
    assert ready.status_code == 200
    body = ready.get_json()
    assert body["status"] == "ok"
    assert body["database"] == "connected"
    assert body["redis"] in ("connected", "not_configured")


def test_health_probes_support_head(client):
    assert client.head("/livez").status_code == 200
    assert client.head("/healthz").status_code == 200
    assert client.head("/readyz").status_code == 200
