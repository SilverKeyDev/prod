"""
Contract tests: HTTP JSON bodies must validate against OpenAPI-generated Pydantic models.

Catches schema drift before client/server type regeneration diverges from runtime behavior.
"""

from __future__ import annotations

from unittest.mock import Mock, patch

import pytest
from flask.testing import FlaskClient

from app.schemas.generated import (
    AgentSearchResult,
    AgreementStatus,
    AuthResponse,
    ErrorResponse,
    FavoriteHomesResponse,
    LoginData,
    SavedHome,
    SearchAgentsResponse,
    UserResponse,
)
from app.schemas.generated import (
    User as UserOpenApi,
)


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
                is_agent=True,
                cognito_id="agent-contract-cognito",
            )
            db.session.add(agent)
            db.session.commit()
            aid = agent.id
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
            mock_user.is_agent = False
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

    def test_profile_unauthorized_matches_error_schema(self, client: FlaskClient) -> None:
        response = client.get("/api/v1/user/profile")
        assert response.status_code == 401
        ErrorResponse.model_validate(response.get_json())

    def test_search_agents_unauthorized_matches_error_schema(self, client: FlaskClient) -> None:
        response = client.get("/api/v1/agent/search-agents?q=ab")
        assert response.status_code == 401
        ErrorResponse.model_validate(response.get_json())

    def test_required_user_fields_on_profile(self, authenticated_client: FlaskClient) -> None:
        response = authenticated_client.get("/api/v1/user/profile")
        assert response.status_code == 200
        data = response.get_json()
        inner = data.get("data") or data.get("user")
        assert inner is not None
        required_fields = list(UserOpenApi.model_json_schema().get("required", []))
        assert required_fields
        for field in required_fields:
            assert field in inner, f"required OpenAPI User field {field!r} missing from profile"

    def test_agreement_status_enum_covers_db_values(self, app) -> None:
        from sqlalchemy import select

        from app import db
        from app.models.documents.agreement import Agreement

        allowed = {m.value for m in AgreementStatus}
        with app.app_context():
            rows = db.session.execute(select(Agreement.status).distinct()).all()
        for (status,) in rows:
            assert status in allowed, (
                f"DB agreements.status={status!r} is not in OpenAPI AgreementStatus enum"
            )


@pytest.mark.api
@pytest.mark.contract
def test_user_dto_to_response_matches_openapi_user(app, contract_user) -> None:
    from app import db
    from app.dtos.user import UserDTO
    from app.models import User

    with app.app_context():
        fresh = db.session.get(User, contract_user.id)
        assert fresh is not None
        payload = UserDTO.to_response(fresh, include_roles=True, presign_profile_pic=False)
    UserOpenApi.model_validate(payload)


@pytest.mark.api
@pytest.mark.contract
def test_property_dto_to_saved_home_matches_openapi(app, contract_user) -> None:
    from app import db
    from app.dtos.property import PropertyDTO
    from app.models import HomeUniversal

    with app.app_context():
        home = HomeUniversal(
            user_id=contract_user.id,
            is_liked=True,
            current=True,
            address="123 Contract Test St",
        )
        db.session.add(home)
        db.session.commit()
        fresh = db.session.get(HomeUniversal, home.id)
        assert fresh is not None
        payload = PropertyDTO.to_saved_home(fresh)
        db.session.delete(fresh)
        db.session.commit()

    SavedHome.model_validate(payload)
