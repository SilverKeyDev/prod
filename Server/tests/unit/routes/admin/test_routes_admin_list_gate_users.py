"""Admin list gate-role users route tests."""

from types import SimpleNamespace
from unittest.mock import patch

import pytest

_SUPER_ADMIN_USER = SimpleNamespace(
    id="super-1",
    user_roles=[SimpleNamespace(role="super_admin")],
)
_NON_SUPER_ADMIN_USER = SimpleNamespace(
    id="admin-1",
    user_roles=[SimpleNamespace(role="admin")],
)

_LIST_URL = "/api/v1/admin/users/gate-roles"


@pytest.fixture
def mock_gate_users():
    with patch(
        "app.routes.admin.handlers.list_admin_gate_users.db.session.execute",
    ) as mock_execute:
        yield mock_execute


def test_list_gate_users_requires_super_admin(client, mock_gate_users) -> None:
    with patch("app.services.auth.get_current_user", return_value=_NON_SUPER_ADMIN_USER):
        response = client.get(
            _LIST_URL,
            headers={"Authorization": "Bearer mock_token"},
        )

    assert response.status_code == 403
    mock_gate_users.assert_not_called()


def test_list_gate_users_returns_admins(client, mock_gate_users) -> None:
    mock_gate_users.return_value.all.return_value = [
        ("user-1", "alice@example.com", "Alice Admin", "admin"),
        ("user-2", "bob@example.com", "Bob Super", "super_admin"),
        ("user-2", "bob@example.com", "Bob Super", "admin"),
    ]

    with patch("app.services.auth.get_current_user", return_value=_SUPER_ADMIN_USER):
        response = client.get(
            _LIST_URL,
            headers={"Authorization": "Bearer mock_token"},
        )

    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert data["admins"] == [
        {
            "user_id": "user-1",
            "email": "alice@example.com",
            "name": "Alice Admin",
            "gate_roles": ["admin"],
        },
        {
            "user_id": "user-2",
            "email": "bob@example.com",
            "name": "Bob Super",
            "gate_roles": ["admin", "super_admin"],
        },
    ]
