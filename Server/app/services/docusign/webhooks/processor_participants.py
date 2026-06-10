"""DocuSign webhook participant update logic."""

from datetime import datetime
from typing import Any

from app.models import Agreement, AgreementParticipant
from logger import log


def update_participants(agreement: Agreement, recipients: dict[str, Any]):
    """Update participant statuses from recipient data."""

    log.debug(
        "DOCUSIGN",
        "Updating participant statuses",
        {
            "agreement_id": agreement.id,
            "signer_count": len(recipients.get("signers", [])),
            "cc_count": len(recipients.get("carbonCopies", [])),
        },
    )

    for signer in recipients.get("signers", []):
        participant = find_participant(agreement, signer.get("recipientId"), signer.get("email"))

        if participant:
            update_participant_status(participant, signer)
        else:
            log.warn(
                "DOCUSIGN",
                "Participant not found for signer",
                {
                    "agreement_id": agreement.id,
                    "recipient_id": signer.get("recipientId"),
                    "email": signer.get("email"),
                },
            )

    for cc in recipients.get("carbonCopies", []):
        participant = find_participant(agreement, cc.get("recipientId"), cc.get("email"))

        if participant:
            update_participant_status(participant, cc)
        else:
            log.warn(
                "DOCUSIGN",
                "Participant not found for CC",
                {
                    "agreement_id": agreement.id,
                    "recipient_id": cc.get("recipientId"),
                    "email": cc.get("email"),
                },
            )


def find_participant(
    agreement: Agreement, recipient_id: str | None, email: str | None
) -> AgreementParticipant | None:
    """Find participant by recipient ID or email."""

    # RelationshipProperty resolves to collection at runtime; Pyright does not treat it as Iterable
    for participant in list(agreement.participants):  # pyright: ignore[reportArgumentType]
        if recipient_id and str(participant.id) == recipient_id:
            return participant
        if email and participant.email == email:
            return participant
    return None


def update_participant_status(participant: AgreementParticipant, recipient_data: dict[str, Any]):
    """Update participant status from recipient data."""

    old_status = participant.recipient_status
    status = recipient_data.get("status")

    if status:
        participant.recipient_status = status

        if old_status != status:
            log.info(
                "DOCUSIGN",
                "Participant status changed",
                {
                    "participant_id": participant.id,
                    "email": participant.email,
                    "old_status": old_status,
                    "new_status": status,
                },
            )

    if recipient_data.get("sentDateTime") and not participant.sent_at:
        try:
            participant.sent_at = datetime.fromisoformat(
                recipient_data["sentDateTime"].replace("Z", "+00:00")
            )
        except (ValueError, TypeError) as e:
            log.warn(
                "API",
                "Failed to parse recipient sentDateTime",
                {
                    "participant_id": participant.id,
                    "sentDateTime": recipient_data.get("sentDateTime"),
                    "error": str(e),
                },
            )

    if recipient_data.get("deliveredDateTime") and not participant.delivered_at:
        try:
            participant.delivered_at = datetime.fromisoformat(
                recipient_data["deliveredDateTime"].replace("Z", "+00:00")
            )
        except (ValueError, TypeError) as e:
            log.warn(
                "DOCUSIGN",
                "Failed to parse recipient deliveredDateTime",
                {
                    "participant_id": participant.id,
                    "deliveredDateTime": recipient_data.get("deliveredDateTime"),
                    "error": str(e),
                },
            )

    if recipient_data.get("signedDateTime") and not participant.signed_at:
        try:
            participant.signed_at = datetime.fromisoformat(
                recipient_data["signedDateTime"].replace("Z", "+00:00")
            )
        except (ValueError, TypeError) as e:
            log.warn(
                "DOCUSIGN",
                "Failed to parse recipient signedDateTime",
                {
                    "participant_id": participant.id,
                    "signedDateTime": recipient_data.get("signedDateTime"),
                    "error": str(e),
                },
            )

    if recipient_data.get("declinedDateTime") and not participant.declined_at:
        try:
            participant.declined_at = datetime.fromisoformat(
                recipient_data["declinedDateTime"].replace("Z", "+00:00")
            )
        except (ValueError, TypeError) as e:
            log.warn(
                "DOCUSIGN",
                "Failed to parse recipient declinedDateTime",
                {
                    "participant_id": participant.id,
                    "declinedDateTime": recipient_data.get("declinedDateTime"),
                    "error": str(e),
                },
            )
