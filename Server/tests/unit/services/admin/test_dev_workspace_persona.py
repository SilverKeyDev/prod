"""Unit tests for dev workspace persona service."""

from __future__ import annotations

import json

import pytest
from sqlalchemy import select

from app import db
from app.models import User, UserDemographics, UserRole
from app.schemas.generated import DevWorkspacePersona
from app.services.auth.dev_workspace_persona import apply_dev_workspace_persona
from app.services.auth.user_role_helpers import user_is_agent


def _create_user(*, email: str, cognito_id: str) -> User:
    user = User(
        cognito_id=cognito_id,
        email=email,
        name="Dev Persona",
        is_active=True,
    )
    db.session.add(user)
    db.session.commit()
    return user


@pytest.mark.unit
class TestApplyDevWorkspacePersona:
    @pytest.mark.parametrize(
        ("workspace", "expected_has_agent_role", "expected_roles"),
        [
            (DevWorkspacePersona.buyer, False, {"buyer"}),
            (DevWorkspacePersona.seller, False, {"seller"}),
            (DevWorkspacePersona.renter, False, {"renter"}),
            (DevWorkspacePersona.agent, True, {"agent"}),
            (DevWorkspacePersona.brokerage, False, {"brokerage_admin"}),
            (DevWorkspacePersona.integration_partner, False, {"integration_partner"}),
        ],
    )
    def test_sets_exclusive_persona(
        self, app, db_session, workspace, expected_has_agent_role, expected_roles
    ) -> None:
        with app.app_context():
            user = _create_user(email="persona@example.com", cognito_id="persona-1")
            db.session.add(UserRole(user_id=user.id, role="buyer"))
            db.session.add(UserRole(user_id=user.id, role="seller"))
            db.session.commit()

            apply_dev_workspace_persona(user, workspace)
            db.session.refresh(user)

            assert user_is_agent(user) is expected_has_agent_role
            rows = {
                r.role
                for r in db.session.scalars(
                    select(UserRole).where(UserRole.user_id == user.id)
                ).all()
            }
            assert rows == expected_roles

    def test_preserves_gate_roles(self, app, db_session) -> None:
        with app.app_context():
            user = _create_user(email="gate@example.com", cognito_id="persona-gate")
            db.session.add(UserRole(user_id=user.id, role="admin"))
            db.session.add(UserRole(user_id=user.id, role="super_admin"))
            db.session.commit()

            apply_dev_workspace_persona(user, DevWorkspacePersona.seller)
            db.session.refresh(user)

            rows = {
                r.role
                for r in db.session.scalars(
                    select(UserRole).where(UserRole.user_id == user.id)
                ).all()
            }
            assert rows == {"admin", "super_admin", "seller"}

    def test_syncs_buyer_demographics(self, app, db_session) -> None:
        with app.app_context():
            user = _create_user(email="demo-buyer@example.com", cognito_id="persona-demo-b")
            apply_dev_workspace_persona(user, DevWorkspacePersona.buyer)

            demo = db.session.scalar(
                select(UserDemographics).where(UserDemographics.user_id == user.id)
            )
            assert json.loads(demo.why_joining_silverkey or "[]") == ["buying_house"]

    def test_syncs_seller_demographics(self, app, db_session) -> None:
        with app.app_context():
            user = _create_user(email="demo-seller@example.com", cognito_id="persona-demo-s")
            apply_dev_workspace_persona(user, DevWorkspacePersona.seller)

            demo = db.session.scalar(
                select(UserDemographics).where(UserDemographics.user_id == user.id)
            )
            assert json.loads(demo.why_joining_silverkey or "[]") == ["selling_house"]

    def test_clears_demographics_for_agent(self, app, db_session) -> None:
        with app.app_context():
            user = _create_user(email="demo-agent@example.com", cognito_id="persona-demo-a")
            db.session.add(
                UserDemographics(
                    user_id=user.id,
                    why_joining_silverkey=json.dumps(["buying_house"]),
                )
            )
            db.session.commit()

            apply_dev_workspace_persona(user, DevWorkspacePersona.agent)

            demo = db.session.scalar(
                select(UserDemographics).where(UserDemographics.user_id == user.id)
            )
            assert demo.why_joining_silverkey == "[]"
