"""
Agreement CRUD operations: create and get.
"""

import uuid

from app import db
from app.models import Agreement, AgreementEvent
from app.utils.db.orm_lookup import get_model
from logger import LOG_CATEGORIES, get_logger

from ..errors import AgreementNotFoundError

logger = get_logger()


def create_agreement(
    agent_id: str, buyer_id: str, title: str, agreement_type: str, **kwargs
) -> Agreement:
    """
    Create new agreement.

    Args:
        agent_id: Agent user ID
        buyer_id: Buyer user ID
        title: Agreement title
        agreement_type: Type (e.g., 'offer', 'inspection')
        **kwargs: Additional fields

    Returns:
        Created Agreement
    """
    # Validate required IDs are not empty
    if not agent_id or not agent_id.strip():
        raise ValueError("agent_id cannot be empty")
    if not buyer_id or not buyer_id.strip():
        raise ValueError("buyer_id cannot be empty")

    logger.debug(
        LOG_CATEGORIES["DOCUSIGN"],
        "Creating agreement",
        {
            "agent_id": agent_id,
            "buyer_id": buyer_id,
            "title": title,
            "agreement_type": agreement_type,
            "property_address": kwargs.get("property_address"),
        },
    )

    agreement = Agreement(
        id=str(uuid.uuid4()),
        agent_id=agent_id,
        buyer_id=buyer_id,
        title=title,
        agreement_type=agreement_type,
        status="draft",
        description=kwargs.get("description"),
        property_address=kwargs.get("property_address"),
        docusign_source_template_id=kwargs.get("docusign_source_template_id"),
    )

    db.session.add(agreement)

    # Create initial event
    event = AgreementEvent(
        agreement_id=agreement.id,
        event_type="created",
        description="Agreement created",
        actor_id=agent_id,
    )
    db.session.add(event)

    from app.services.documents.document_library_items import attach_library_item_to_agreement

    attach_library_item_to_agreement(agreement)

    db.session.commit()

    logger.info(
        LOG_CATEGORIES["DOCUSIGN"],
        "Agreement created successfully",
        {
            "agreement_id": agreement.id,
            "agent_id": agent_id,
            "buyer_id": buyer_id,
            "agreement_type": agreement_type,
        },
    )

    return agreement


def get_agreement(agreement_id: str) -> Agreement:
    """Get agreement by ID"""
    logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Fetching agreement", {"agreement_id": agreement_id})

    agreement = get_model(Agreement, agreement_id)
    if not agreement:
        logger.warn(
            LOG_CATEGORIES["DOCUSIGN"], "Agreement not found", {"agreement_id": agreement_id}
        )
        raise AgreementNotFoundError(f"Agreement {agreement_id} not found")

    logger.debug(
        LOG_CATEGORIES["DOCUSIGN"],
        "Agreement fetched successfully",
        {"agreement_id": agreement_id, "status": agreement.status},
    )

    return agreement
