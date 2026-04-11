"""
Agreement signature flow operations: send for signature and void.
"""

from datetime import datetime, timezone

from app import db
from app.models import AgreementEvent, AgreementParticipant, User
from app.utils.database import transactional
from logger import LOG_CATEGORIES, get_logger

from ..errors import AgreementStateError
from .agreement_crud import get_agreement
from .participant_operations import sync_signer_participant

logger = get_logger()


@transactional
def send_for_signature(
    agreement_id: str,
    signing_method: str,
    actor_id: str,
    participant_user_id: str | None = None,
):
    """
    Enqueue task to send agreement for signature.

    All database operations wrapped in transaction.
    Commits only if task enqueue succeeds.

    Args:
        agreement_id: Agreement ID
        signing_method: 'embedded' or 'email'
        actor_id: User initiating send
        participant_user_id: Optional selected signer user ID
    """
    logger.debug(
        LOG_CATEGORIES["DOCUSIGN"],
        "Preparing to send agreement for signature",
        {
            "agreement_id": agreement_id,
            "signing_method": signing_method,
            "actor_id": actor_id,
            "participant_user_id": participant_user_id,
        },
    )

    agreement = get_agreement(agreement_id)

    # Validate can send
    if agreement.status != "draft":
        logger.warn(
            LOG_CATEGORIES["DOCUSIGN"],
            "Cannot send agreement - invalid status",
            {"agreement_id": agreement_id, "current_status": agreement.status},
        )
        raise AgreementStateError(f"Cannot send agreement with status: {agreement.status}")

    if not agreement.current_revision_id:
        logger.warn(
            LOG_CATEGORIES["DOCUSIGN"],
            "Cannot send agreement - no revision",
            {"agreement_id": agreement_id},
        )
        raise AgreementStateError("Agreement has no current revision")

    selected_participant_user_id = participant_user_id or agreement.buyer_id

    # Defensive logging to diagnose missing participants
    logger.debug(
        LOG_CATEGORIES["DOCUSIGN"],
        "Participant selection for send",
        {
            "agreement_id": agreement_id,
            "participant_user_id": participant_user_id,
            "agreement_buyer_id": agreement.buyer_id,
            "selected_participant_user_id": selected_participant_user_id,
        },
    )

    if selected_participant_user_id:
        sync_signer_participant(
            agreement=agreement,
            participant_user_id=selected_participant_user_id,
            actor_id=actor_id,
        )
        db.session.flush()
        db.session.expire(agreement, ["participants"])

    # Add agent as counter-signer (routing_order=2) for sequential signing
    _ensure_agent_counter_signer(agreement, actor_id)
    db.session.flush()
    db.session.expire(agreement, ["participants"])

    if not agreement.participants:
        logger.warn(
            LOG_CATEGORIES["DOCUSIGN"],
            "Cannot send agreement - no participants",
            {
                "agreement_id": agreement_id,
                "agent_id": agreement.agent_id,
                "buyer_id": agreement.buyer_id,
                "selected_participant_user_id": selected_participant_user_id,
                "participant_user_id_was": participant_user_id,
            },
        )
        raise AgreementStateError(
            f"Agreement has no participants. buyer_id='{agreement.buyer_id}', "
            f"participant_user_id='{participant_user_id}'. "
            "At least one must be provided to add a signer."
        )

    # Validate sequential signing requires a primary signer (routing_order=1)
    # before the agent counter-signer (routing_order=2)
    first_order_signers = [
        p
        for p in list(agreement.participants)  # pyright: ignore[reportArgumentType]
        if p.role == "signer" and p.routing_order == 1
    ]
    if not first_order_signers:
        raise AgreementStateError(
            "Agreement must have at least one primary signer (routing_order=1). "
            "Provide a participant_user_id or ensure a buyer is assigned."
        )

    # RelationshipProperty resolves to collection at runtime; Pyright does not treat it as Iterable
    participants_list = list(agreement.participants)  # pyright: ignore[reportArgumentType]
    logger.debug(
        LOG_CATEGORIES["DOCUSIGN"],
        "Enqueueing send agreement task",
        {
            "agreement_id": agreement_id,
            "signing_method": signing_method,
            "participant_count": len(participants_list),
            "revision_id": agreement.current_revision_id,
        },
    )

    # Import here to avoid circular dependency
    from app.celery.tasks.docusign import send_envelope_task

    task = send_envelope_task.delay(agreement_id, signing_method, actor_id)  # type: ignore[union-attr]

    logger.info(
        LOG_CATEGORIES["DOCUSIGN"],
        "Send agreement task enqueued successfully",
        {"agreement_id": agreement_id, "task_id": task.id},
    )

    # Transaction commits automatically on success, rolls back on exception
    return task.id


def _ensure_agent_counter_signer(agreement, actor_id: str):
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

    agent_user = User.query.get(agreement.agent_id)
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


@transactional
def void_agreement(agreement_id: str, reason: str, actor_id: str):
    """
    Void an agreement.

    All database operations wrapped in transaction.

    Args:
        agreement_id: Agreement ID
        reason: Void reason
        actor_id: User voiding
    """
    logger.debug(
        LOG_CATEGORIES["DOCUSIGN"],
        "Voiding agreement",
        {"agreement_id": agreement_id, "reason": reason, "actor_id": actor_id},
    )

    agreement = get_agreement(agreement_id)

    if agreement.status in ["completed", "voided"]:
        logger.warn(
            LOG_CATEGORIES["DOCUSIGN"],
            "Cannot void agreement - invalid status",
            {"agreement_id": agreement_id, "current_status": agreement.status},
        )
        raise AgreementStateError(f"Cannot void agreement with status: {agreement.status}")

    has_envelope = bool(agreement.docusign_envelope_id)

    if not agreement.docusign_envelope_id:
        # Just mark as voided locally
        logger.debug(
            LOG_CATEGORIES["DOCUSIGN"],
            "Voiding agreement locally (no envelope)",
            {"agreement_id": agreement_id},
        )
        agreement.status = "voided"
        agreement.voided_at = datetime.now(timezone.utc)
    else:
        # Void in DocuSign
        logger.debug(
            LOG_CATEGORIES["DOCUSIGN"],
            "Voiding agreement in DocuSign",
            {"agreement_id": agreement_id, "envelope_id": agreement.docusign_envelope_id},
        )
        from ..core.client import DocusignClient

        client = DocusignClient(auth_type="jwt")
        client.void_envelope(agreement.docusign_envelope_id, reason)

        agreement.status = "voided"
        agreement.voided_at = datetime.now(timezone.utc)

    # Create event
    event = AgreementEvent(
        agreement_id=agreement_id,
        event_type="voided",
        description=f"Agreement voided: {reason}",
        actor_id=actor_id,
    )
    db.session.add(event)

    from app.services.documents.document_library_items import sync_agreement_library_item

    sync_agreement_library_item(agreement)

    logger.info(
        LOG_CATEGORIES["DOCUSIGN"],
        "Agreement voided successfully",
        {"agreement_id": agreement_id, "had_envelope": has_envelope, "reason": reason},
    )

    # Transaction commits automatically on success, rolls back on exception
