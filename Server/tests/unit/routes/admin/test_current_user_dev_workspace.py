"""Admin current-user-dev-workspace route tests."""

from types import SimpleNamespace
from unittest.mock import patch

import pytest

from app.schemas.generated import DevWorkspacePersona

_ADMIN_USER = SimpleNamespace(
    id="admin-1",
    user_roles=[SimpleNamespace(role="admin")],
)
_NON_ADMIN_USER = SimpleNamespace(
    id="user-1",
    user_roles=[SimpleNamespace(role="manager")],
)

_URL = "/api/v1/admin/current-user-dev-workspace"
_BODY = {"workspace": "buyer"}


@pytest.fixture
def mock_apply():
    with patch(
        "app.routes.admin.handlers.current_user_dev_workspace.apply_dev_workspace_persona"
    ) as mock_fn:
        mock_fn.return_value = SimpleNamespace(
            id="admin-1",
            cognito_id="c1",
            google_id=None,
            email="admin@example.com",
            name="Admin",
            phone=None,
            profile_picture=None,
            mls_id=None,
            brokerage=None,
            created_at=None,
            updated_at=None,
            last_logged_in=None,
            is_active=True,
            has_preferences=False,
            preferences_version=None,
            is_agent=False,
            client_ids=None,
            agent_id=None,
            user_roles=[SimpleNamespace(role="admin"), SimpleNamespace(role="buyer")],
        )
        yield mock_fn


def test_admin_sets_dev_workspace(client, mock_apply) -> None:
    with patch("app.services.auth.get_current_user", return_value=_ADMIN_USER):
        response = client.post(
            _URL,
            headers={"Authorization": "Bearer mock_token"},
            json=_BODY,
        )

    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert data["user"]["email"] == "admin@example.com"
    mock_apply.assert_called_once()
    assert mock_apply.call_args[0][1] == DevWorkspacePersona.buyer


def test_non_admin_forbidden(client, mock_apply) -> None:
    with patch("app.services.auth.get_current_user", return_value=_NON_ADMIN_USER):
        response = client.post(
            _URL,
            headers={"Authorization": "Bearer mock_token"},
            json=_BODY,
        )

    assert response.status_code == 403
    mock_apply.assert_not_called()


def test_missing_workspace_bad_request(client, mock_apply) -> None:
    with patch("app.services.auth.get_current_user", return_value=_ADMIN_USER):
        response = client.post(
            _URL,
            headers={"Authorization": "Bearer mock_token"},
            json={},
        )

    assert response.status_code == 400
    mock_apply.assert_not_called()
