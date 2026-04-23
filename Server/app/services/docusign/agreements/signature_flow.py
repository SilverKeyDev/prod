"""
Agreement signature flow operations: send for signature and void.
"""

from datetime import datetime, timezone

from app import db
from app.models import AgreementEvent
from app.utils.database import transactional
from logger import LOG_CATEGORIES, get_logger

from ..core.client import DocusignClient
from ..errors import AgreementStateError, DocusignAuthError
from .agent_counter_signer import ensure_agent_counter_signer
from .agreement_crud import get_agreement
from .agreement_library_cleanup import delete_agreement_library_item
from .participant_operations import sync_signer_participant
from .send_envelope_validation import (
    validate_send_envelope_options,
    validate_template_agreement_send,
)

logger = get_logger()


def _autofill_single_role_template_map_if_needed(agreement, opts: dict) -> None:
    """When DocuSign template has exactly one signer role and one signer participant, build the map."""
    if not agreement.docusign_source_template_id or opts.get("template_role_map"):
        return
    try:
        client = DocusignClient(auth_type="jwt")
        role_names = client.get_template_role_name_set(str(agreement.docusign_source_template_id))
    except Exception:  # noqa: S110 — optional convenience; strict validation follows
        return
    if len(role_names) != 1:
        return
    signers = [
        p
        for p in list(agreement.participants)  # pyright: ignore[reportArgumentType]
        if p.role == "signer"
    ]
    if len(signers) != 1:
        return
    opts["template_role_map"] = [
        {"participant_id": str(signers[0].id), "role_name": next(iter(role_names))}
    ]


@transactional
def send_for_signature(
    agreement_id: str,
    signing_method: str,
    actor_id: str,
    participant_user_id: str | None = None,
    envelope_options: dict | None = None,
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
        envelope_options: Optional DocuSign send extras (notification, tab_prefill, envelope_prefill_tabs)
    """
    opts = envelope_options or {}
    logger.debug(
        LOG_CATEGORIES["DOCUSIGN"],
        "Preparing to send agreement for signature",
        {
            "agreement_id": agreement_id,
            "signing_method": signing_method,
            "actor_id": actor_id,
            "participant_user_id": participant_user_id,
            "has_envelope_options": bool(opts),
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

    is_template_send = bool(agreement.docusign_source_template_id)
    if not is_template_send and not agreement.current_revision_id:
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

    # Template-based agreements use explicit multi-signer participants only (no legacy single-signer sync).
    if not is_template_send and selected_participant_user_id:
        sync_signer_participant(
            agreement=agreement,
            participant_user_id=selected_participant_user_id,
            actor_id=actor_id,
        )
        db.session.flush()
        db.session.expire(agreement, ["participants"])

    # Add agent as counter-signer (routing_order=2) for sequential signing (PDF agreements only)
    if not is_template_send:
        ensure_agent_counter_signer(agreement, actor_id)
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
    # before the agent counter-signer (routing_order=2), for PDF-based envelopes only.
    if not is_template_send:
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

    _autofill_single_role_template_map_if_needed(agreement, opts)
    validate_template_agreement_send(agreement, opts)
    validate_send_envelope_options(agreement, opts)

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
            "template_send": is_template_send,
        },
    )

    # Ensure JWT + account resolve in this process before we commit participants or enqueue.
    # Otherwise the API returns 202 while the worker fails with auth errors and leaves a misleading draft.
    try:
        DocusignClient(auth_type="jwt")
    except DocusignAuthError:
        logger.error(
            LOG_CATEGORIES["DOCUSIGN"],
            "DocuSign JWT preflight failed; send aborted (transaction will roll back)",
            {"agreement_id": agreement_id, "actor_id": actor_id},
        )
        raise

    # Import here to avoid circular dependency
    from app.celery.tasks.docusign import send_envelope_task

    task = send_envelope_task.delay(agreement_id, signing_method, actor_id, opts)  # type: ignore[union-attr]

    logger.info(
        LOG_CATEGORIES["DOCUSIGN"],
        "Send agreement task enqueued successfully",
        {"agreement_id": agreement_id, "task_id": task.id},
    )

    # Transaction commits automatically on success, rolls back on exception
    return task.id


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
        # Void in DocuSign (only Sent/Delivered are voidable; voided is idempotent)
        logger.debug(
            LOG_CATEGORIES["DOCUSIGN"],
            "Voiding agreement in DocuSign",
            {"agreement_id": agreement_id, "envelope_id": agreement.docusign_envelope_id},
        )
        client = DocusignClient(auth_type="jwt")
        envelope_id = agreement.docusign_envelope_id
        env_info = client.get_envelope(envelope_id)
        ds_status = (env_info.get("status") or "").strip().lower()

        if ds_status == "voided":
            logger.info(
                LOG_CATEGORIES["DOCUSIGN"],
                "Envelope already voided in DocuSign; syncing local state only",
                {"agreement_id": agreement_id, "envelope_id": envelope_id},
            )
        elif ds_status == "completed":
            raise AgreementStateError(
                "This agreement is already completed in DocuSign and cannot be voided."
            )
        elif ds_status and ds_status not in ("sent", "delivered"):
            raise AgreementStateError(
                "This agreement cannot be voided in DocuSign right now. "
                f"The envelope is in state '{ds_status}'; only Sent or Delivered "
                "envelopes can be voided."
            )
        else:
            client.void_envelope(envelope_id, reason)

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

    delete_agreement_library_item(agreement)

    logger.info(
        LOG_CATEGORIES["DOCUSIGN"],
        "Agreement voided successfully",
        {"agreement_id": agreement_id, "had_envelope": has_envelope, "reason": reason},
    )

    # Transaction commits automatically on success, rolls back on exception


@transactional
def strip_agreement_from_saved_library(agreement_id: str, actor_id: str, description: str) -> None:
    """
    Remove the agreement from Saved (library row only). Listing agent only.
    Does not call DocuSign void — used for completed/voided envelopes or when void is impossible.
    """
    agreement = get_agreement(agreement_id)
    if str(agreement.agent_id) != str(actor_id):
        logger.warn(
            LOG_CATEGORIES["DOCUSIGN"],
            "strip_agreement_from_saved_library denied",
            {"agreement_id": agreement_id, "actor_id": actor_id},
        )
        raise AgreementStateError("Only the listing agent can remove this agreement from Saved")

    delete_agreement_library_item(agreement)
    db.session.add(
        AgreementEvent(
            agreement_id=agreement_id,
            event_type="removed_from_saved",
            description=description,
            actor_id=actor_id,
        )
    )
    logger.info(
        LOG_CATEGORIES["DOCUSIGN"],
        "Agreement stripped from Saved library",
        {"agreement_id": agreement_id, "actor_id": actor_id},
    )


def discard_agreement_as_agent(agreement_id: str, reason: str, actor_id: str) -> None:
    """
    Agent discards from Saved: voids in DocuSign when allowed, otherwise only removes the
    shared library row (buyer + agent lists).
    """
    agreement = get_agreement(agreement_id)
    if str(agreement.agent_id) != str(actor_id):
        logger.warn(
            LOG_CATEGORIES["DOCUSIGN"],
            "discard_agreement_as_agent denied",
            {"agreement_id": agreement_id, "actor_id": actor_id},
        )
        raise AgreementStateError("Only the listing agent can discard this agreement")

    st = (agreement.status or "").lower()
    if st in ("completed", "voided"):
        strip_agreement_from_saved_library(agreement_id, actor_id, f"Removed from Saved: {reason}")
        return

    try:
        void_agreement(agreement_id, reason, actor_id)
    except AgreementStateError:
        strip_agreement_from_saved_library(
            agreement_id,
            actor_id,
            f"Removed from Saved (envelope could not be voided in DocuSign): {reason}",
        )
