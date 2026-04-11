"""
Agreement participant operations: add, remove, update, and sync participants.
"""

from app import db
from app.models import Agreement, AgreementParticipant, User
from logger import LOG_CATEGORIES, get_logger

from ..errors import AgreementStateError

logger = get_logger()


def sync_signer_participant(agreement: Agreement, participant_user_id: str, actor_id: str) -> bool:
    """
    Ensure selected user is the active signer participant (legacy single-signer method).

    Note: For new code, use add_participant() for multi-signer support.
    This method is kept for backward compatibility.

    Returns:
        True when participant rows were changed, else False.
    """
    if participant_user_id == actor_id:
        raise AgreementStateError("Signer must be different from the sending agent")

    participant_user = User.query.get(participant_user_id)
    if not participant_user:
        raise AgreementStateError(f"Selected participant {participant_user_id} not found")

    # RelationshipProperty resolves to collection at runtime; Pyright does not treat it as Iterable
    participants_list = list(agreement.participants)  # pyright: ignore[reportArgumentType]
    has_changes = False
    selected_signer: AgreementParticipant | None = None

    for participant in participants_list:
        if participant.user_id == participant_user_id:
            selected_signer = participant
            continue
        if participant.role == "signer":
            db.session.delete(participant)
            has_changes = True

    if selected_signer:
        if selected_signer.email != participant_user.email:
            selected_signer.email = participant_user.email
            has_changes = True
        if selected_signer.name != participant_user.name:
            selected_signer.name = participant_user.name
            has_changes = True
        if selected_signer.role != "signer":
            selected_signer.role = "signer"
            has_changes = True
        if selected_signer.routing_order != 1:
            selected_signer.routing_order = 1
            has_changes = True
    else:
        db.session.add(
            AgreementParticipant(
                agreement_id=agreement.id,
                user_id=participant_user.id,
                email=participant_user.email,
                name=participant_user.name,
                role="signer",
                routing_order=1,
            )
        )
        has_changes = True

    return has_changes


def add_participant(
    agreement_id: str,
    user_id: str,
    role: str = "signer",
    routing_order: int | None = None,
    actor_id: str | None = None,
) -> AgreementParticipant:
    """
    Add a participant to an agreement.

    Supports multiple signers with sequential routing. Each signer can have a
    different routing order, enabling workflows where signer 2 only receives the
    envelope after signer 1 completes.

    Args:
        agreement_id: Agreement ID
        user_id: User ID of participant
        role: Participant role ('signer', 'carbon_copy', 'agent', etc.)
        routing_order: Signing order (1 = first, 2 = second, etc.). Auto-assigned if None.
        actor_id: User adding the participant (optional, for validation)

    Returns:
        Created AgreementParticipant

    Raises:
        AgreementStateError: If agreement not in draft status or user not found
    """
    from .agreement_crud import get_agreement

    logger.debug(
        LOG_CATEGORIES["DOCUSIGN"],
        "Adding participant to agreement",
        {
            "agreement_id": agreement_id,
            "user_id": user_id,
            "role": role,
            "routing_order": routing_order,
        },
    )

    agreement = get_agreement(agreement_id)

    if agreement.status != "draft":
        raise AgreementStateError(
            f"Cannot add participants to agreement with status: {agreement.status}"
        )

    participant_user = User.query.get(user_id)
    if not participant_user:
        raise AgreementStateError(f"User {user_id} not found")

    # Validate actor can't be a signer
    if actor_id and user_id == actor_id and role == "signer":
        raise AgreementStateError("Agent cannot be a signer on their own agreement")

    # Auto-assign routing order if not specified
    if routing_order is None:
        # RelationshipProperty resolves to collection at runtime
        participants_list = list(agreement.participants)  # pyright: ignore[reportArgumentType]
        existing_orders = [p.routing_order for p in participants_list if p.role == role]
        routing_order = max(existing_orders, default=0) + 1

    # Check for duplicate
    participants_list = list(agreement.participants)  # pyright: ignore[reportArgumentType]
    existing = next(
        (
            p
            for p in participants_list
            if p.user_id == user_id and p.role == role and p.routing_order == routing_order
        ),
        None,
    )
    if existing:
        raise AgreementStateError(
            f"User {user_id} already exists as {role} with routing order {routing_order}"
        )

    participant = AgreementParticipant(
        agreement_id=agreement_id,
        user_id=user_id,
        email=participant_user.email,
        name=participant_user.name,
        role=role,
        routing_order=routing_order,
    )

    db.session.add(participant)
    db.session.commit()

    logger.info(
        LOG_CATEGORIES["DOCUSIGN"],
        "Participant added successfully",
        {
            "agreement_id": agreement_id,
            "participant_id": participant.id,
            "user_id": user_id,
            "role": role,
            "routing_order": routing_order,
        },
    )

    return participant


def remove_participant(agreement_id: str, participant_id: str) -> None:
    """
    Remove a participant from an agreement.

    Can only remove participants from draft agreements.

    Args:
        agreement_id: Agreement ID
        participant_id: Participant ID to remove

    Raises:
        AgreementStateError: If agreement not in draft status or participant not found
    """
    from .agreement_crud import get_agreement

    logger.debug(
        LOG_CATEGORIES["DOCUSIGN"],
        "Removing participant from agreement",
        {"agreement_id": agreement_id, "participant_id": participant_id},
    )

    agreement = get_agreement(agreement_id)

    if agreement.status != "draft":
        raise AgreementStateError(
            f"Cannot remove participants from agreement with status: {agreement.status}"
        )

    participant = AgreementParticipant.query.get(participant_id)
    if not participant or participant.agreement_id != agreement_id:
        raise AgreementStateError(f"Participant {participant_id} not found in agreement")

    db.session.delete(participant)
    db.session.commit()

    logger.info(
        LOG_CATEGORIES["DOCUSIGN"],
        "Participant removed successfully",
        {"agreement_id": agreement_id, "participant_id": participant_id},
    )


def update_participant_routing_order(
    agreement_id: str, participant_id: str, new_routing_order: int
) -> AgreementParticipant:
    """
    Update the routing order of a participant.

    Changes the signing sequence for multi-signer workflows.
    Can only update participants in draft agreements.

    Args:
        agreement_id: Agreement ID
        participant_id: Participant ID
        new_routing_order: New routing order (1 = first, 2 = second, etc.)

    Returns:
        Updated AgreementParticipant

    Raises:
        AgreementStateError: If agreement not in draft or participant not found
    """
    from .agreement_crud import get_agreement

    logger.debug(
        LOG_CATEGORIES["DOCUSIGN"],
        "Updating participant routing order",
        {
            "agreement_id": agreement_id,
            "participant_id": participant_id,
            "new_routing_order": new_routing_order,
        },
    )

    agreement = get_agreement(agreement_id)

    if agreement.status != "draft":
        raise AgreementStateError(
            f"Cannot update participants in agreement with status: {agreement.status}"
        )

    participant = AgreementParticipant.query.get(participant_id)
    if not participant or participant.agreement_id != agreement_id:
        raise AgreementStateError(f"Participant {participant_id} not found in agreement")

    old_routing_order = participant.routing_order
    participant.routing_order = new_routing_order

    db.session.commit()

    logger.info(
        LOG_CATEGORIES["DOCUSIGN"],
        "Participant routing order updated",
        {
            "agreement_id": agreement_id,
            "participant_id": participant_id,
            "old_routing_order": old_routing_order,
            "new_routing_order": new_routing_order,
        },
    )

    return participant
