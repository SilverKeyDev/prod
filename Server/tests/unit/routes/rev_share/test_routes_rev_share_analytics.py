"""Tests for GET /api/v1/admin/rev-share/analytics."""

from types import SimpleNamespace
from unittest.mock import patch

from .conftest import assert_resource_not_found

_ADMIN = SimpleNamespace(
    id="admin-1",
    user_roles=[SimpleNamespace(role="admin")],
)


def test_rev_share_analytics_unknown_partner_returns_resource_not_found(client, app):
    with patch("app.services.auth.get_current_user", return_value=_ADMIN):
        response = client.get(
            "/api/v1/admin/rev-share/analytics?partner_id=00000000-0000-0000-0000-000000000000",
            headers={"Authorization": "Bearer mock"},
        )

    assert_resource_not_found(response)
