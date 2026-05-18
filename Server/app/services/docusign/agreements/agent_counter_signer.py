"""Ensure the sending agent is added as a sequential counter-signer on agreements."""

from app import db
from app.models import Agreement, AgreementParticipant, User
from app.utils.db.orm_lookup import get_model
from logger import LOG_CATEGORIES, get_logger

logger = get_logger()


def ensure_agent_counter_signer(agreement: Agreement, actor_id: str) -> None:
    """
    Add the sending agent as a second signer (routing_order=2) so DocuSign
    delivers the envelope to the client first, then the agent for counter-signature.
    Skips if the agent is already a signer participant.
    """
    if not agreement.agent_id:
        return

    participants_list = list(agreement.participants)  # pyright: ignore[reportArgumentType]
    agent_already_signer = any(
        p.user_id == agreement.agent_id and p.role == "signer" for p in participants_list
    )
    if agent_already_signer:
        return

    agent_user = get_model(User, agreement.agent_id)
    if not agent_user:
        logger.warn(
            LOG_CATEGORIES["DOCUSIGN"],
            "Agent user not found for counter-signer",
            {"agreement_id": agreement.id, "agent_id": agreement.agent_id},
        )
        return

    counter_signer = AgreementParticipant(
        agreement_id=agreement.id,
        user_id=agent_user.id,
        email=agent_user.email,
        name=agent_user.name,
        role="signer",
        routing_order=2,
    )
    db.session.add(counter_signer)

    logger.info(
        LOG_CATEGORIES["DOCUSIGN"],
        "Added agent as counter-signer",
        {
            "agreement_id": agreement.id,
            "agent_id": agreement.agent_id,
            "routing_order": 2,
        },
    )
