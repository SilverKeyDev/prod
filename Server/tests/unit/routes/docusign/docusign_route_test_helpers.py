"""Shared helpers for DocuSign route unit tests."""

from contextlib import contextmanager
from unittest.mock import Mock, patch

from app.models import Transaction, User, UserRole
from app.services.brokerage.constants import DEFAULT_BROKERAGE_ORG_ID

DOCUSIGN_FIXTURE_TRANSACTION_ID = "tx-docusign-fixture"


@contextmanager
def patch_docusign_get_current_user(user: Mock):
    with patch("app.services.auth.get_current_user", return_value=user):
        yield


def mock_docusign_user(user_id: str, *, is_agent: bool = False, email: str | None = None) -> Mock:
    u = Mock()
    u.id = user_id
    u.is_agent = is_agent
    u.email = email or f"{user_id}@example.com"
    return u


def seed_agent_buyer(db_session) -> tuple[User, User]:
    agent = User(
        id="agent-456",
        cognito_id="cognito-agent-ds",
        email="agent-ds@example.com",
        name="DocuSign Agent",
        is_active=True,
    )
    buyer = User(
        id="buyer-789",
        cognito_id="cognito-buyer-ds",
        email="buyer-ds@example.com",
        name="DocuSign Buyer",
        is_active=True,
    )
    db_session.session.add(agent)
    db_session.session.add(buyer)
    db_session.session.add(UserRole(user_id="agent-456", role="agent"))
    db_session.session.add(UserRole(user_id="buyer-789", role="buyer"))
    if Transaction.query.filter_by(id=DOCUSIGN_FIXTURE_TRANSACTION_ID).first() is None:
        db_session.session.add(
            Transaction(
                id=DOCUSIGN_FIXTURE_TRANSACTION_ID,
                buyer_id="buyer-789",
                primary_agent_id="agent-456",
                brokerage_org_id=DEFAULT_BROKERAGE_ORG_ID,
            )
        )
    db_session.session.commit()
    return agent, buyer
