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
    AgreementStatus,
    SavedHome,
    SearchByPolygonResponse,
    TaskStatusResponse,
)
from app.schemas.generated import (
    User as UserOpenApi,
)

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
class TestOpenAPIContractsResearch:
    """Research and polygon OpenAPI contract checks."""

    def test_polygon_search_response_matches_schema(
        self, authenticated_client: FlaskClient, contract_user: User
    ) -> None:
        mock_search_result = {
            "success": True,
            "properties": [_minimal_property_search_result()],
            "count": 1,
            "cached": False,
        }
        request_data = {
            "viewport_polygon": [
                {"lat": 40.7128, "lng": -74.006},
                {"lat": 40.7158, "lng": -74.006},
                {"lat": 40.7158, "lng": -73.996},
                {"lat": 40.7128, "lng": -73.996},
            ],
        }

        with patch(MOCK_POLYGON_AUTH) as mock_auth:
            with patch(MOCK_RESOLVE_PREFS_USER_ID) as mock_resolve:
                with patch(MOCK_PARSE_RESEARCH_BODY) as mock_parse:
                    with patch(MOCK_RUN_POLYGON_SEARCH) as mock_search:
                        mock_auth.return_value = (contract_user, None)
                        mock_resolve.return_value = (str(contract_user.id), None)
                        mock_parse.return_value = {}
                        mock_search.return_value = (mock_search_result, 200)

                        response = authenticated_client.post(
                            "/api/v1/search/properties-by-polygon",
                            json=request_data,
                        )

        assert response.status_code == 200
        SearchByPolygonResponse.model_validate(response.get_json())

    def test_research_property_queued_matches_task_status_schema(
        self, authenticated_client: FlaskClient
    ) -> None:
        with patch("app.routes.search.research.research_property_task") as mock_task:
            mock_celery_result = Mock()
            mock_celery_result.id = "contract-task-123"
            mock_task.delay.return_value = mock_celery_result

            response = authenticated_client.post(
                "/api/v1/research/property",
                json={"address": "123 Main St, Austin, TX"},
            )

        assert response.status_code == 202
        TaskStatusResponse.model_validate(response.get_json())

    def test_research_property_stream_first_event_is_json_object(
        self, authenticated_client: FlaskClient
    ) -> None:
        with patch(
            "app.services.search.property.property_stream.generate_property_stream"
        ) as mock_stream:
            mock_stream.return_value = iter(
                [
                    'data: {"type": "basic", "data": {"success": true, "data": {"streetAddress": "123 Main St"}}}\n\n',
                    'data: {"type": "complete", "data": {}}\n\n',
                ]
            )

            response = authenticated_client.post(
                "/api/v1/research/property?stream=true",
                json={"address": "123 Main St, Austin, TX"},
            )

        assert response.status_code == 200
        first_line = response.get_data(as_text=True).splitlines()[0]
        assert first_line.startswith("data: ")
        payload = json.loads(first_line.removeprefix("data: ").strip())
        assert payload["type"] == "basic"
        assert isinstance(payload["data"], dict)

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
    from app.models import PropertyCache, UserPropertyLink

    with app.app_context():
        prop = PropertyCache(
            zpid="contract-test-zpid-saved-home",
            address="123 Contract Test St",
            city="Testville",
            state="TS",
            zipcode="12345",
            beds="3",
            baths="2",
            price="500000",
        )
        db.session.add(prop)
        db.session.flush()
        link = UserPropertyLink(
            user_id=contract_user.id,
            property_id=prop.id,
            is_liked=True,
            current=True,
        )
        db.session.add(link)
        db.session.commit()
        fresh = db.session.get(UserPropertyLink, link.id)
        assert fresh is not None
        payload = PropertyDTO.to_saved_home(fresh)
        db.session.delete(fresh)
        db.session.delete(prop)
        db.session.commit()

    SavedHome.model_validate(payload)
