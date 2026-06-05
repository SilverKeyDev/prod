"""IDOR tests for workspace conversation routes."""

from unittest.mock import patch

import jwt as pyjwt

from tests.jwt_test_secret import TEST_JWT_HMAC_SECRET

MOCK_JWT_TOKEN = pyjwt.encode(
    {"sub": "test-user", "email": "test@example.com"}, TEST_JWT_HMAC_SECRET, algorithm="HS256"
)


class TestWorkspaceConversationsIdor:
    def test_history_forbidden_for_non_participant(self, client, db_session):
        from app.models import User

        user = User(
            id="user-1",
            cognito_id="cognito-1",
            email="u1@example.com",
            name="User One",
        )
        db_session.session.add(user)
        db_session.session.commit()

        with patch("app.services.auth.get_current_user") as mock_get_user:
            mock_get_user.return_value = user

            with patch(
                "app.routes.conversations.handlers.conversations.get_conversation"
            ) as mock_get_conv:
                mock_get_conv.return_value = type(
                    "Conv",
                    (),
                    {"id": "conv-1", "kind": "brokerage_agent"},
                )()

                with patch(
                    "app.routes.conversations.handlers.conversations.user_may_access_workspace_conversation",
                    return_value=False,
                ):
                    response = client.get(
                        "/api/v1/conversations/conv-1/history",
                        headers={"Authorization": f"Bearer {MOCK_JWT_TOKEN}"},
                    )
                    assert response.status_code == 403
