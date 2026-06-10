"""Shared helpers for DocuSign route unit tests."""

from contextlib import ExitStack, contextmanager
from unittest.mock import Mock, patch

from sqlalchemy import select

from app import db
from app.models import Transaction, User, UserRole
from app.services.auth.user_role_helpers import user_is_agent
from app.services.brokerage.constants import DEFAULT_BROKERAGE_ORG_ID

DOCUSIGN_FIXTURE_TRANSACTION_ID = "tx-docusign-fixture"

_USER_IS_AGENT_PATCH_TARGETS = (
    "app.services.auth.user_role_helpers.user_is_agent",
    "app.routes.documents.docusign.handlers.templates.user_is_agent",
    "app.routes.documents.docusign.handlers.oauth.user_is_agent",
    "app.routes.documents.docusign.handlers.agreement_routes.crud.user_is_agent",
    "app.routes.documents.docusign.handlers.agreement_routes.participants.user_is_agent",
)


@contextmanager
def patch_docusign_get_current_user(user: Mock | User, *, has_agent_role: bool | None = None):
    if has_agent_role is not None:
        role = has_agent_role
    elif hasattr(user, "_test_has_agent_role"):
        role = bool(user._test_has_agent_role)
    elif isinstance(user, User):
        role = user_is_agent(user)
    else:
        role = False
    with ExitStack() as stack:
        stack.enter_context(patch("app.services.auth.get_current_user", return_value=user))
        for target in _USER_IS_AGENT_PATCH_TARGETS:
            stack.enter_context(patch(target, return_value=role))
        yield


def mock_docusign_user(
    user_id: str, *, has_agent_role: bool = False, email: str | None = None
) -> Mock:
    u = Mock()
    u.id = user_id
    u._test_has_agent_role = has_agent_role
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
    if (
        db.session.scalar(
            select(Transaction).where(Transaction.id == DOCUSIGN_FIXTURE_TRANSACTION_ID)
        )
        is None
    ):
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
