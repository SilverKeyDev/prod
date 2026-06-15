"""Tests for public agent profile JSON API."""

from unittest.mock import patch

from tests.unit.routes.rev_share.conftest import assert_resource_not_found


def test_public_agent_profile_by_user_id_not_found(client):
    with patch(
        "app.routes.public.agent_profile.build_public_agent_profile",
        return_value=None,
    ):
        response = client.get("/api/v1/public/agent-profile/missing-user-id")

    assert_resource_not_found(response)


def test_public_agent_profile_by_slug_not_found(client):
    with patch(
        "app.routes.public.agent_profile.lookup_agent_user_id_by_public_slug",
        return_value=None,
    ):
        response = client.get("/api/v1/public/agent-profile/slug/unknown-slug")

    assert_resource_not_found(response)


def test_public_agent_profile_by_slug_unknown_agent(client):
    with (
        patch(
            "app.routes.public.agent_profile.lookup_agent_user_id_by_public_slug",
            return_value="user-1",
        ),
        patch(
            "app.routes.public.agent_profile.build_public_agent_profile",
            return_value=None,
        ),
    ):
        response = client.get("/api/v1/public/agent-profile/slug/agent-slug")

    assert_resource_not_found(response)
