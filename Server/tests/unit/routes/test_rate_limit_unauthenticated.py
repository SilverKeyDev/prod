"""Rate limits on unauthenticated API surfaces."""

import os
from unittest.mock import patch

import pytest

from app.schemas.generated import PublicAgentProfile
from app.utils.security.rate_limit_backend import rate_limit_storage, storage_lock


@pytest.fixture(autouse=True)
def _clear_rate_limit_storage():
    with storage_lock:
        rate_limit_storage.clear()
    yield
    with storage_lock:
        rate_limit_storage.clear()


class TestUnauthenticatedRateLimits:
    def test_maps_script_returns_429_after_limit(self, client):
        with patch.dict(os.environ, {"GOOGLE_MAPS_API_KEY": "test-maps-key"}):
            for _ in range(60):
                response = client.get("/api/maps/script")
                assert response.status_code == 200

            blocked = client.get("/api/maps/script")
            assert blocked.status_code == 429
            body = blocked.get_json()
            assert body["error"] == "RATE_LIMIT_EXCEEDED"
            assert body.get("retry_after") == 60

    def test_public_agent_profile_returns_429_after_limit(self, client):
        stub = PublicAgentProfile(
            id="agent-1",
            name="Test Agent",
            email="agent@example.com",
            phone=None,
            mls_id=None,
            brokerage=None,
            public_profile_slug="test-agent",
            profile_picture_url=None,
            agent_bio=None,
            brokerage_name=None,
            brokerage_bic_name=None,
            brokerage_address=None,
            brokerage_email=None,
            brokerage_phone=None,
            professional_headshot_url=None,
            primary_service_zips=None,
            specialties=None,
            licensed_states=None,
            license_types=None,
            license_numbers=None,
            license_expiration_dates=None,
            mls_affiliations=None,
            social_links=None,
        )
        with patch(
            "app.routes.public.agent_profile.build_public_agent_profile",
            return_value=stub,
        ):
            for _ in range(100):
                response = client.get("/api/v1/public/agent-profile/agent-1")
                assert response.status_code == 200

            blocked = client.get("/api/v1/public/agent-profile/agent-1")
            assert blocked.status_code == 429
            assert blocked.get_json()["error"] == "RATE_LIMIT_EXCEEDED"
