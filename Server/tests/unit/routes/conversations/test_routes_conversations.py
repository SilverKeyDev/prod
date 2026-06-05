"""Route tests for workspace conversations API."""

from unittest.mock import patch

import jwt as pyjwt

from app.models import User
from tests.jwt_test_secret import TEST_JWT_HMAC_SECRET

MOCK_JWT_TOKEN = pyjwt.encode(
    {"sub": "test-user", "email": "test@example.com"}, TEST_JWT_HMAC_SECRET, algorithm="HS256"
)


class TestWorkspaceConversationsRoutes:
    def test_post_group_returns_501(self, client, db_session):
        user = User(
            id="user-grp",
            cognito_id="cognito-grp",
            email="grp@test.com",
            name="Group User",
        )
        db_session.session.add(user)
        db_session.session.commit()

        with patch("app.services.auth.get_current_user") as mock_get_user:
            mock_get_user.return_value = user
            response = client.post(
                "/api/v1/conversations",
                json={"kind": "group", "title": "Team"},
                headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
            )
            assert response.status_code == 501

    def test_get_eligible_contacts_success(self, client, db_session):
        user = User(
            id="user-elig",
            cognito_id="cognito-elig",
            email="elig@test.com",
            name="Eligible User",
        )
        db_session.session.add(user)
        db_session.session.commit()

        with patch("app.services.auth.get_current_user") as mock_get_user:
            mock_get_user.return_value = user
            with patch(
                "app.routes.conversations.handlers.conversations.list_eligible_contacts"
            ) as mock_list:
                mock_list.return_value = [
                    {
                        "contact_id": "agent-1",
                        "contact_type": "agent",
                        "display_name": "Agent",
                        "kind": "brokerage_agent",
                        "metadata": {},
                    }
                ]
                response = client.get(
                    "/api/v1/conversations/eligible-contacts?kinds=brokerage_agent",
                    headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
                )
                assert response.status_code == 200
                data = response.get_json()
                assert data["success"] is True
                assert len(data["contacts"]) == 1

    def test_admin_scope_forbidden_for_non_super_admin(self, client, db_session):
        user = User(
            id="user-noadmin",
            cognito_id="cognito-noadmin",
            email="noadmin@test.com",
            name="Regular User",
        )
        db_session.session.add(user)
        db_session.session.commit()

        with patch("app.services.auth.get_current_user") as mock_get_user:
            mock_get_user.return_value = user
            with patch(
                "app.routes.conversations.handlers.conversations.user_has_super_admin_role",
                return_value=False,
            ):
                response = client.get(
                    "/api/v1/conversations?scope=admin",
                    headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
                )
                assert response.status_code == 403
