"""
Contract tests: HTTP JSON bodies must validate against OpenAPI-generated Pydantic models.

Catches schema drift before client/server type regeneration diverges from runtime behavior.
"""

from __future__ import annotations

import json
from unittest.mock import Mock, patch

import pytest
from flask.testing import FlaskClient

from app.models import User
from app.schemas.generated import (
    AgentConversationsResponse,
    AgentSearchResult,
    AuthResponse,
    ErrorResponse,
    FavoriteHomesResponse,
    GetPreferencesApiResponse,
    GetTodosResponse,
    LoginData,
    NotInterestedHomesResponse,
    RecommendedAgentResult,
    RecommendedAgentsResponse,
    SearchAgentsResponse,
    UserResponse,
)
from app.schemas.generated import UserModel as UserOpenApi

MOCK_POLYGON_AUTH = "app.routes.search.search.get_authenticated_user"
MOCK_RUN_POLYGON_SEARCH = "app.routes.search.search.run_polygon_search"
MOCK_RESOLVE_PREFS_USER_ID = "app.routes.search.search.resolve_preferences_user_id_for_research"
MOCK_PARSE_RESEARCH_BODY = "app.routes.search.search.parse_research_request_body"


def _minimal_property_search_result() -> dict:
    return {
        "id": "12345678",
        "essentials": {"bedrooms": 3, "bathrooms": 2.0, "livingAreaSqft": 1500},
        "location": {
            "address": "123 Main St",
            "city": "Austin",
            "state": "TX",
            "zipcode": "78701",
            "latitude": 30.27,
            "longitude": -97.74,
        },
        "financials": {"price": 450000.0},
        "score": 88.0,
    }


@pytest.mark.api
@pytest.mark.contract
class TestOpenAPIContracts:
    """Verify selected high-traffic API responses match generated schemas."""

    def test_user_profile_response_matches_schema(self, authenticated_client: FlaskClient) -> None:
        response = authenticated_client.get("/api/v1/user/profile")
        assert response.status_code == 200
        data = response.get_json()
        UserResponse.model_validate(data)
        assert data.get("success") is True
        inner = data.get("data") or data.get("user")
        assert inner is not None
        UserOpenApi.model_validate(inner)

    def test_favorite_homes_response_matches_schema(
        self, authenticated_client: FlaskClient
    ) -> None:
        response = authenticated_client.get("/api/v1/user/favorite-homes")
        assert response.status_code == 200
        FavoriteHomesResponse.model_validate(response.get_json())

    def test_not_interested_homes_response_matches_schema(
        self, authenticated_client: FlaskClient
    ) -> None:
        response = authenticated_client.get("/api/v1/user/not-interested-homes")
        assert response.status_code == 200
        NotInterestedHomesResponse.model_validate(response.get_json())

    def test_get_preferences_response_matches_schema(
        self, authenticated_client: FlaskClient
    ) -> None:
        response = authenticated_client.get("/api/v1/preferences")
        assert response.status_code == 200
        GetPreferencesApiResponse.model_validate(response.get_json())

    def test_get_agent_todos_response_matches_schema(
        self, authenticated_client: FlaskClient
    ) -> None:
        response = authenticated_client.get("/api/v1/agent/todos")
        assert response.status_code == 200
        GetTodosResponse.model_validate(response.get_json())

    def test_get_agent_chats_response_matches_schema(
        self, authenticated_client: FlaskClient
    ) -> None:
        response = authenticated_client.get("/api/v1/agent/chats")
        assert response.status_code == 200
        AgentConversationsResponse.model_validate(response.get_json())

    def test_search_agents_empty_matches_schema(self, authenticated_client: FlaskClient) -> None:
        response = authenticated_client.get("/api/v1/agent/search-agents?q=ab")
        assert response.status_code == 200
        SearchAgentsResponse.model_validate(response.get_json())

    def test_search_agents_result_row_matches_agent_search_result(
        self, app, authenticated_client: FlaskClient, contract_user
    ) -> None:
        from app import db
        from app.models import User

        with app.app_context():
            agent = User(
                email="agent-contract@example.com",
                name="Agent Contract",
                is_active=True,
                cognito_id="agent-contract-cognito",
            )
            db.session.add(agent)
            db.session.commit()
            aid = agent.id
            from tests.support.user_roles import seed_user_roles

            seed_user_roles(str(aid), "agent")
        try:
            response = authenticated_client.get("/api/v1/agent/search-agents?q=Agent%20Con")
            assert response.status_code == 200
            body = response.get_json()
            SearchAgentsResponse.model_validate(body)
            agents = body.get("agents") or []
            assert len(agents) >= 1
            AgentSearchResult.model_validate(agents[0])
        finally:
            with app.app_context():
                row = db.session.get(User, aid)
                if row is not None:
                    db.session.delete(row)
                    db.session.commit()

    def test_login_accepts_valid_login_data_shape(
        self, client: FlaskClient, mock_cognito_service, mock_jwt_decode
    ) -> None:
        payload = LoginData(
            email="login-contract@example.com",
            password="Password123!",
        ).model_dump(mode="json")

        with patch("app.services.auth.user.lookup.find_or_create_user_by_cognito") as mock_find:
            mock_user = Mock()
            mock_user.id = "login-contract-user"
            mock_user.name = "Login Contract"
            mock_user.user_roles = []
            mock_user.cognito_id = "cognito-login-contract"
            mock_user.google_id = None
            mock_user.phone = None
            mock_find.return_value = mock_user

            response = client.post("/api/v1/auth/login", json=payload)

        assert response.status_code == 200, response.get_json()
        data = response.get_json()
        AuthResponse.model_validate(data)

    def test_login_invalid_credentials_match_error_schema(
        self, client: FlaskClient, mock_cognito_service
    ) -> None:
        mock_cognito_service.sign_in.return_value = {
            "success": False,
            "error": "NotAuthorizedException",
            "message": "Incorrect username or password",
        }
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "wrong-user@example.com",
                "password": "wrong",
            },
        )
        assert response.status_code == 401
        ErrorResponse.model_validate(response.get_json())

    def test_login_missing_password_returns_field_errors_not_validation_errors(
        self, client: FlaskClient
    ) -> None:
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "missing-password@example.com"},
        )
        assert response.status_code == 400
        body = response.get_json()
        ErrorResponse.model_validate(body)
        assert isinstance(body.get("field_errors"), dict)
        assert body.get("validation_errors") is None

    def test_profile_unauthorized_matches_error_schema(self, client: FlaskClient) -> None:
        response = client.get("/api/v1/user/profile")
        assert response.status_code == 401
        ErrorResponse.model_validate(response.get_json())

    def test_search_agents_unauthorized_matches_error_schema(self, client: FlaskClient) -> None:
        response = client.get("/api/v1/agent/search-agents?q=ab")
        assert response.status_code == 401
        ErrorResponse.model_validate(response.get_json())

    def test_recommended_agents_empty_matches_schema(
        self, authenticated_client: FlaskClient
    ) -> None:
        response = authenticated_client.get("/api/v1/agent/recommended-agents")
        assert response.status_code == 200
        RecommendedAgentsResponse.model_validate(response.get_json())

    def test_recommended_agents_unauthorized_matches_error_schema(
        self, client: FlaskClient
    ) -> None:
        response = client.get("/api/v1/agent/recommended-agents")
        assert response.status_code == 401
        ErrorResponse.model_validate(response.get_json())

    def test_recommended_agents_row_matches_schema(
        self, app, authenticated_client: FlaskClient
    ) -> None:
        from app import db
        from app.models import User, UserAgentProfile

        with app.app_context():
            agent = User(
                email="rec-agent@example.com",
                name="Rec Agent",
                is_active=True,
                cognito_id="rec-agent-cognito",
            )
            db.session.add(agent)
            db.session.flush()
            prof = UserAgentProfile(
                user_id=agent.id,
                primary_service_zips=json.dumps(["90210"]),
                licensed_states=json.dumps(["CA"]),
                specialties=json.dumps(["condo"]),
                agent_bio="Works with first-time buyers",
            )
            db.session.add(prof)
            db.session.commit()
            aid = agent.id
            from tests.support.user_roles import seed_user_roles

            seed_user_roles(str(aid), "agent")
        try:
            response = authenticated_client.get(
                "/api/v1/agent/recommended-agents?zip=90210&state=CA&intent=condo%20buyer"
            )
            assert response.status_code == 200
            body = response.get_json()
            RecommendedAgentsResponse.model_validate(body)
            agents = body.get("agents") or []
            assert len(agents) >= 1
            RecommendedAgentResult.model_validate(agents[0])
        finally:
            with app.app_context():
                prof_row = db.session.get(UserAgentProfile, aid)
                if prof_row is not None:
                    db.session.delete(prof_row)
                user_row = db.session.get(User, aid)
                if user_row is not None:
                    db.session.delete(user_row)
                db.session.commit()

    def test_recommended_agents_excludes_connected_agent(
        self, app, authenticated_client: FlaskClient, contract_user: User
    ) -> None:
        from app import db
        from app.models import AgentConnections, User, UserAgentProfile

        with app.app_context():
            agent = User(
                email="connected-rec-agent@example.com",
                name="Connected Rec Agent",
                is_active=True,
                cognito_id="connected-rec-cognito",
            )
            db.session.add(agent)
            db.session.flush()
            prof = UserAgentProfile(
                user_id=agent.id,
                primary_service_zips=json.dumps(["90210"]),
                licensed_states=json.dumps(["CA"]),
                specialties=json.dumps(["condo"]),
                agent_bio="Already your agent",
            )
            db.session.add(prof)
            conn = AgentConnections(agent_id=agent.id, client_id=contract_user.id)
            db.session.add(conn)
            db.session.commit()
            aid = agent.id
            cid = conn.id
        try:
            response = authenticated_client.get(
                "/api/v1/agent/recommended-agents?zip=90210&state=CA&intent=condo%20buyer"
            )
            assert response.status_code == 200
            body = response.get_json()
            RecommendedAgentsResponse.model_validate(body)
            agents = body.get("agents") or []
            assert all(row.get("id") != aid for row in agents)
        finally:
            with app.app_context():
                conn_row = db.session.get(AgentConnections, cid)
                if conn_row is not None:
                    db.session.delete(conn_row)
                prof_row = db.session.get(UserAgentProfile, aid)
                if prof_row is not None:
                    db.session.delete(prof_row)
                user_row = db.session.get(User, aid)
                if user_row is not None:
                    db.session.delete(user_row)
                db.session.commit()
