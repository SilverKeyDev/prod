"""
DocuSign recipient construction helpers

Build recipient objects for DocuSign envelopes.
"""

from typing import Any

from app.models import AgreementParticipant


def build_tabs_for_recipient(
    participant: AgreementParticipant, document_id: str = "1"
) -> dict[str, Any]:
    """
    Build signature tabs using coordinate-based positioning on page 1.

    Agent-uploaded PDFs typically lack anchor strings (e.g. "SIGN HERE"), so we use
    absolute positions. Routing order stacks signers vertically so multiple signers
    do not overlap.

    DocuSign measures from the top-left; y=700 is near the bottom of a US Letter
    page (~792pt tall). Adjust if PDFs differ.

    Args:
        participant: AgreementParticipant model
        document_id: Document ID in the envelope (default "1")

    Returns:
        Dictionary of tabs for this recipient
    """
    # Routing order determines vertical stacking so multiple signers don't overlap
    # Page bottom ~700pt, each signer offset up by 60px per routing slot
    slot = (participant.routing_order or 1) - 1
    y_position = str(700 - (slot * 60))

    tabs = {
        "signHereTabs": [
            {
                "documentId": document_id,
                "recipientId": str(participant.id),
                "pageNumber": "1",
                "xPosition": "100",
                "yPosition": y_position,
            }
        ],
        "dateSignedTabs": [
            {
                "documentId": document_id,
                "recipientId": str(participant.id),
                "pageNumber": "1",
                "xPosition": "300",
                "yPosition": y_position,
                "fontSize": "size9",
            }
        ],
    }

    return tabs


def build_tabs_coordinate_fallback(
    participant: AgreementParticipant,
    document_id: str = "1",
    page_number: int = 1,
    x_position: int = 100,
    y_position: int = 400,
) -> dict[str, Any]:
    """
    Build signature tabs using coordinate-based positioning (fallback method).

    Use this when PDFs don't have anchor text. Coordinates are in pixels from
    top-left corner of the page.

    Note: Coordinate-based tabs are fragile if PDF layout changes; use explicit
    x/y when you need placement different from build_tabs_for_recipient.

    Args:
        participant: AgreementParticipant model
        document_id: Document ID in the envelope (default "1")
        page_number: Page number for signature (default 1)
        x_position: X coordinate in pixels from left (default 100)
        y_position: Y coordinate in pixels from top (default 400)

    Returns:
        Dictionary of tabs for this recipient
    """
    tabs = {
        "signHereTabs": [
            {
                "documentId": document_id,
                "recipientId": str(participant.id),
                "pageNumber": str(page_number),
                "xPosition": str(x_position),
                "yPosition": str(y_position),
            }
        ],
        "dateSignedTabs": [
            {
                "documentId": document_id,
                "recipientId": str(participant.id),
                "pageNumber": str(page_number),
                "xPosition": str(x_position + 200),
                "yPosition": str(y_position),
                "fontSize": "size9",
            }
        ],
    }

    return tabs


def build_recipient_from_participant(participant: AgreementParticipant) -> dict[str, Any]:
    """
    Build a DocuSign recipient object from an AgreementParticipant.

    Includes signature tabs using coordinate-based positioning (see build_tabs_for_recipient).

    Args:
        participant: AgreementParticipant model

    Returns:
        DocuSign recipient dictionary with tabs
    """
    recipient = {
        "email": participant.email,
        "name": participant.name,
        "recipientId": str(participant.id),  # Use our participant ID
        "routingOrder": str(participant.routing_order),
        "tabs": build_tabs_for_recipient(participant),
    }

    return recipient


def build_signers(participants: list[AgreementParticipant]) -> list[dict[str, Any]]:
    """
    Build list of DocuSign signers from participants.

    Args:
        participants: List of AgreementParticipant models

    Returns:
        List of DocuSign signer dictionaries
    """
    signers = []

    for participant in participants:
        if participant.role == "signer":
            signer = build_recipient_from_participant(participant)
            signers.append(signer)

    return signers


def build_carbon_copies(participants: list[AgreementParticipant]) -> list[dict[str, Any]]:
    """
    Build list of DocuSign carbon copies from participants.

    Args:
        participants: List of AgreementParticipant models

    Returns:
        List of DocuSign carbon copy dictionaries
    """
    carbon_copies = []

    for participant in participants:
        if participant.role == "carbon_copy":
            cc = build_recipient_from_participant(participant)
            carbon_copies.append(cc)

    return carbon_copies


def build_recipients_from_participants(participants: list[AgreementParticipant]) -> dict[str, Any]:
    """
    Build complete recipients object from participants.

    Args:
        participants: List of AgreementParticipant models

    Returns:
        DocuSign recipients dictionary
    """
    recipients = {}

    signers = build_signers(participants)
    if signers:
        recipients["signers"] = signers

    carbon_copies = build_carbon_copies(participants)
    if carbon_copies:
        recipients["carbonCopies"] = carbon_copies

    return recipients


def validate_participants(participants: list[AgreementParticipant]) -> tuple[bool, str]:
    """
    Validate participants for DocuSign envelope creation.

    Args:
        participants: List of AgreementParticipant models

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not participants:
        return False, "At least one participant is required"

    # Must have at least one signer
    signers = [p for p in participants if p.role == "signer"]
    if not signers:
        return False, "At least one signer is required"

    # Check for duplicate emails in the same routing order
    routing_groups = {}
    for p in participants:
        key = (p.email, p.routing_order)
        if key in routing_groups:
            return False, f"Duplicate email {p.email} in routing order {p.routing_order}"
        routing_groups[key] = p

    return True, ""
