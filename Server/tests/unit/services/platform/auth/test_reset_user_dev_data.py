"""Unit tests for scoped dev user data reset service."""

from __future__ import annotations

import uuid
from unittest.mock import patch

import pytest
from sqlalchemy import func, select

from app import db
from app.models import (
    AgentConnectionRequest,
    AgentConnections,
    BuyerStepView,
    ChatHistory,
    ChecklistItemDispatchSetting,
    Document,
    DocumentLibraryItem,
    Todo,
    Transaction,
    TransactionAddress,
    TransactionTask,
    User,
)
from app.services.auth.user.reset_user_dev_data import reset_user_dev_data
from app.services.brokerage.constants import DEFAULT_BROKERAGE_ORG_ID
from app.services.transactions.ensure import ensure_transaction


def _create_user(*, email: str, cognito_id: str) -> User:
    user = User(
        cognito_id=cognito_id,
        email=email,
        name="Reset Test User",
        is_active=True,
    )
    db.session.add(user)
    db.session.commit()
    return user


@pytest.mark.unit
class TestResetUserDevData:
    def test_user_not_found(self, app, db_session) -> None:
        with app.app_context():
            assert reset_user_dev_data(str(uuid.uuid4()), {"profile"}) is None

    def test_invalid_scope_raises(self, app, db_session) -> None:
        with app.app_context():
            user = _create_user(email="invalid@example.com", cognito_id="reset-invalid")
            with pytest.raises(ValueError, match="Invalid scopes"):
                reset_user_dev_data(user.id, {"not_a_scope"})

    def test_transaction_steps_clears_progress_but_keeps_transaction(self, app, db_session) -> None:
        with app.app_context():
            buyer = _create_user(email="buyer-steps@example.com", cognito_id="reset-buyer-steps")
            agent = _create_user(email="agent-steps@example.com", cognito_id="reset-agent-steps")
            tx_id = str(uuid.uuid4())
            db.session.add(
                Transaction(
                    id=tx_id,
                    buyer_id=buyer.id,
                    primary_agent_id=agent.id,
                    brokerage_org_id=DEFAULT_BROKERAGE_ORG_ID,
                )
            )
            db.session.add(
                TransactionTask(
                    transaction_id=tx_id,
                    user_id=buyer.id,
                    category="search",
                    title="Step 1",
                    status="done",
                    order_index=1,
                )
            )
            db.session.add(
                TransactionAddress(
                    transaction_id=tx_id,
                    user_id=buyer.id,
                    address="123 Main St",
                    city="Atlanta",
                    state="GA",
                    postal_code="30301",
                )
            )
            db.session.add(
                BuyerStepView(
                    buyer_id=buyer.id,
                    step_id="search:1",
                    transaction_id=tx_id,
                )
            )
            db.session.commit()

            cleared = reset_user_dev_data(buyer.id, {"transaction_steps"})
            assert cleared == {"transaction_steps": True}
            assert (
                db.session.scalar(
                    select(func.count())
                    .select_from(TransactionTask)
                    .where(TransactionTask.user_id == buyer.id)
                )
                == 0
            )
            assert (
                db.session.scalar(
                    select(func.count())
                    .select_from(TransactionAddress)
                    .where(TransactionAddress.user_id == buyer.id)
                )
                == 0
            )
            assert (
                db.session.scalar(
                    select(func.count())
                    .select_from(BuyerStepView)
                    .where(BuyerStepView.buyer_id == buyer.id)
                )
                == 0
            )
            assert (
                db.session.scalar(
                    select(func.count()).select_from(Transaction).where(Transaction.id == tx_id)
                )
                == 1
            )

    def test_s3_scope_deletes_documents_and_calls_s3(self, app, db_session) -> None:
        with app.app_context():
            user = _create_user(email="s3@example.com", cognito_id="reset-s3")
            user.profile_picture = "profile_pictures/s3-user/avatar.jpg"
            tx = ensure_transaction(buyer_id=str(user.id))
            li = DocumentLibraryItem(
                user_id=user.id,
                kind="upload",
                title="Report",
                display_status="uploaded",
            )
            db.session.add(li)
            db.session.flush()
            doc = Document(
                id=str(uuid.uuid4()),
                user_id=user.id,
                transaction_id=tx.id,
                library_item_id=li.id,
                filename="report.pdf",
                file_path=f"documents/{user.id}/report.pdf",
            )
            db.session.add(doc)
            db.session.add(user)
            db.session.commit()

            with patch(
                "app.services.auth.user.reset_user_dev_data.delete_user_scoped_s3_objects",
                return_value={"prefix_deleted": 2, "keys_deleted": 1},
            ) as mock_s3:
                cleared = reset_user_dev_data(user.id, {"s3"})

            assert cleared == {"s3": True}
            assert (
                db.session.scalar(
                    select(func.count()).select_from(Document).where(Document.user_id == user.id)
                )
                == 0
            )
            assert (
                db.session.scalar(
                    select(func.count())
                    .select_from(DocumentLibraryItem)
                    .where(DocumentLibraryItem.id == li.id)
                )
                == 0
            )
            mock_s3.assert_called_once()
            call_args = mock_s3.call_args
            assert call_args[0][0] == user.id
            extra_keys = call_args[1]["extra_s3_keys"]
            assert "profile_pictures/s3-user/avatar.jpg" in extra_keys
            assert f"documents/{user.id}/report.pdf" in extra_keys

    def test_connections_scope_clears_links(self, app, db_session) -> None:
        with app.app_context():
            agent = _create_user(email="agent-conn@example.com", cognito_id="reset-agent-conn")
            from app.services.auth.user_role_helpers import ensure_user_role

            ensure_user_role(str(agent.id), "agent")
            client = _create_user(email="client-conn@example.com", cognito_id="reset-client-conn")
            db.session.add(agent)
            db.session.add(client)
            db.session.flush()

            conv = AgentConnections(agent_id=agent.id, client_id=client.id)
            db.session.add(conv)
            db.session.flush()
            db.session.add(
                AgentConnectionRequest(
                    agent_id=agent.id,
                    client_id=client.id,
                    status="accepted",
                )
            )
            db.session.add(
                ChatHistory(
                    user_id=client.id,
                    conversation_id=conv.id,
                    sender_id=agent.id,
                    role="agent",
                    message="Hello",
                )
            )
            db.session.add(
                Todo(agent_id=agent.id, client_id=client.id, title="Follow up", type="manual")
            )
            db.session.add(
                ChecklistItemDispatchSetting(
                    agent_user_id=agent.id,
                    client_user_id=client.id,
                    category="escrow",
                    item_id=1,
                )
            )
            db.session.commit()

            cleared = reset_user_dev_data(client.id, {"connections"})
            assert cleared == {"connections": True}
            assert db.session.scalar(select(func.count()).select_from(AgentConnectionRequest)) == 0
            assert db.session.scalar(select(func.count()).select_from(AgentConnections)) == 0
            assert db.session.scalar(select(func.count()).select_from(ChatHistory)) == 0
            assert db.session.scalar(select(func.count()).select_from(Todo)) == 0
            assert (
                db.session.scalar(select(func.count()).select_from(ChecklistItemDispatchSetting))
                == 0
            )

    def test_profile_deletes_profile_picture_s3_key(self, app, db_session) -> None:
        with app.app_context():
            user = _create_user(email="profile@example.com", cognito_id="reset-profile")
            user.profile_picture = "profile_pictures/user/avatar.png"
            db.session.add(user)
            db.session.commit()

            with patch(
                "app.services.auth.user.reset_user_dev_data.delete_profile_picture_s3_key"
            ) as mock_delete_pic:
                cleared = reset_user_dev_data(user.id, {"profile"})

            assert cleared == {"profile": True}
            mock_delete_pic.assert_called_once_with("profile_pictures/user/avatar.png")
            db.session.refresh(user)
            assert user.profile_picture is None

    def test_combined_scopes(self, app, db_session) -> None:
        with app.app_context():
            user = _create_user(email="combo@example.com", cognito_id="reset-combo")
            user.has_preferences = True
            tx = ensure_transaction(buyer_id=str(user.id))
            db.session.add(
                TransactionTask(
                    transaction_id=tx.id,
                    user_id=user.id,
                    category="offer",
                    title="Offer step",
                    status="done",
                )
            )
            db.session.add(user)
            db.session.commit()

            with patch(
                "app.services.auth.user.reset_user_dev_data.delete_user_scoped_s3_objects",
                return_value={"prefix_deleted": 0, "keys_deleted": 0},
            ):
                cleared = reset_user_dev_data(
                    user.id,
                    {"preferences", "transaction_steps"},
                )

            assert cleared == {"preferences": True, "transaction_steps": True}
            assert (
                db.session.scalar(
                    select(func.count())
                    .select_from(TransactionTask)
                    .where(TransactionTask.user_id == user.id)
                )
                == 0
            )
            db.session.refresh(user)
            assert user.has_preferences is False
