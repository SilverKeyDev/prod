"""Unit tests for client user_roles sync from preferences demographics."""

from __future__ import annotations

import pytest
from sqlalchemy import select

from app import db
from app.models import User, UserRole
from app.services.auth.user_roles_sync import (
    desired_client_roles_from_why_join,
    sync_client_roles_from_preferences,
)


@pytest.mark.unit
class TestDesiredClientRolesFromWhyJoin:
    def test_buyer_only(self) -> None:
        assert desired_client_roles_from_why_join(["buying_house"], grant_agent_role=False) == {
            "buyer",
        }

    def test_seller_includes_buyer_and_seller_tags(self) -> None:
        assert desired_client_roles_from_why_join(
            ["buying_house", "selling_house"], grant_agent_role=False
        ) == {"buyer", "seller"}

    def test_investor(self) -> None:
        assert desired_client_roles_from_why_join(["investor"], grant_agent_role=False) == {
            "investor",
        }

    def test_renter_only(self) -> None:
        assert desired_client_roles_from_why_join(["renting_house"], grant_agent_role=False) == {
            "renter",
        }

    def test_agent_adds_agent_role(self) -> None:
        assert desired_client_roles_from_why_join([], grant_agent_role=True) == {"agent"}


@pytest.mark.unit
class TestSyncClientRolesFromPreferences:
    def test_buyer_only_creates_role(self, app, db_session) -> None:
        with app.app_context():
            user = User(
                cognito_id="sync-buyer",
                email="buyer@example.com",
                name="Buyer",
                is_active=True,
            )
            db.session.add(user)
            db.session.commit()
            uid = user.id

            roles = sync_client_roles_from_preferences(
                uid, ["buying_house"], grant_agent_role=False
            )
            db.session.commit()

            assert "buyer" in roles
            rows = db.session.scalars(select(UserRole).where(UserRole.user_id == uid)).all()
            assert {r.role for r in rows} == {"buyer"}

    def test_seller_dual_tags(self, app, db_session) -> None:
        with app.app_context():
            user = User(
                cognito_id="sync-seller",
                email="seller@example.com",
                name="Seller",
                is_active=True,
            )
            db.session.add(user)
            db.session.commit()
            uid = user.id

            sync_client_roles_from_preferences(
                uid, ["buying_house", "selling_house"], grant_agent_role=False
            )
            db.session.commit()

            rows = {
                r.role
                for r in db.session.scalars(select(UserRole).where(UserRole.user_id == uid)).all()
            }
            assert rows == {"buyer", "seller"}

    def test_idempotent_resave_removes_stale_client_role(self, app, db_session) -> None:
        with app.app_context():
            user = User(
                cognito_id="sync-idem",
                email="idem@example.com",
                name="Idem",
                is_active=True,
            )
            db.session.add(user)
            db.session.commit()
            uid = user.id

            sync_client_roles_from_preferences(
                uid, ["buying_house", "selling_house"], grant_agent_role=False
            )
            db.session.commit()
            sync_client_roles_from_preferences(uid, ["buying_house"], grant_agent_role=False)
            db.session.commit()

            rows = {
                r.role
                for r in db.session.scalars(select(UserRole).where(UserRole.user_id == uid)).all()
            }
            assert rows == {"buyer"}

    def test_preserves_gate_roles(self, app, db_session) -> None:
        with app.app_context():
            user = User(
                cognito_id="sync-gate",
                email="gate@example.com",
                name="Gate",
                is_active=True,
            )
            db.session.add(user)
            db.session.add(UserRole(user_id=user.id, role="admin"))
            db.session.commit()
            uid = user.id

            sync_client_roles_from_preferences(uid, ["selling_house"], grant_agent_role=False)
            db.session.commit()

            rows = {
                r.role
                for r in db.session.scalars(select(UserRole).where(UserRole.user_id == uid)).all()
            }
            assert "admin" in rows
            assert "seller" in rows
