"""Shared helpers for DocuSign route unit tests."""

from contextlib import ExitStack, contextmanager
from unittest.mock import Mock, patch

from app.models import User

_DOCUSIGN_GET_CURRENT_USER_TARGETS = (
    "app.routes.documents.docusign.handlers.templates.get_current_user",
    "app.routes.documents.docusign.handlers.agreement_routes.crud.get_current_user",
    "app.routes.documents.docusign.handlers.agreement_routes.participants.get_current_user",
    "app.routes.documents.docusign.handlers.agreement_routes.signing_urls.get_current_user",
    "app.routes.documents.docusign.handlers.agreement_actions.get_current_user",
    "app.routes.documents.docusign.handlers.oauth.get_current_user",
)


@contextmanager
def patch_docusign_get_current_user(user: Mock):
    with ExitStack() as stack:
        for target in _DOCUSIGN_GET_CURRENT_USER_TARGETS:
            stack.enter_context(patch(target, return_value=user))
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
        is_agent=True,
    )
    buyer = User(
        id="buyer-789",
        cognito_id="cognito-buyer-ds",
        email="buyer-ds@example.com",
        name="DocuSign Buyer",
        is_agent=False,
    )
    db_session.session.add(agent)
    db_session.session.add(buyer)
    db_session.session.commit()
    return agent, buyer
