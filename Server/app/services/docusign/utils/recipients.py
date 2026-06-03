"""
DocuSign recipient construction helpers

Build recipient objects for DocuSign envelopes.
"""

from typing import Any

from app.models import AgreementParticipant

from .docusign_serialize import docusign_sanitize


def build_tabs_for_recipient(
    participant: AgreementParticipant,
    document_id: str = "1",
    extra_text_tabs: list[dict[str, Any]] | None = None,
    extra_checkbox_tabs: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """
    Build optional recipient tabs merged with PDF form-field transformation.

    Signature and standard PDF AcroForm fields come from ``transformPdfFields`` on
    the envelope document (see ``EnvelopeBuilder._build_document``). We no longer
    add fallback Sign Here / date / printed-name coordinates at the bottom of page 1.

    Signers may still receive extra ``textTabs`` / ``checkboxTabs`` from the send API
    (``tab_prefill``), e.g. anchor-based or coordinate tabs defined by the client.

    Args:
        participant: AgreementParticipant model
        document_id: Document ID in the envelope (default "1"); attached to prefill tabs
        extra_text_tabs: Additional text tabs for this signer (optional)
        extra_checkbox_tabs: Additional checkbox tabs for this signer (optional)

    Returns:
        Dictionary of tabs for this recipient (may be empty)
    """
    if participant.role != "signer":
        return {}

    rid = str(participant.id)
    tabs: dict[str, Any] = {}

    if extra_text_tabs:
        text_tabs: list[dict[str, Any]] = []
        for t in extra_text_tabs:
            row = dict(t)
            row.setdefault("documentId", document_id)
            row.setdefault("recipientId", rid)
            text_tabs.append(row)
        tabs["textTabs"] = text_tabs
    if extra_checkbox_tabs:
        checkbox_tabs: list[dict[str, Any]] = []
        for t in extra_checkbox_tabs:
            row = dict(t)
            row.setdefault("documentId", document_id)
            row.setdefault("recipientId", rid)
            checkbox_tabs.append(row)
        tabs["checkboxTabs"] = checkbox_tabs

    return tabs


def build_recipient_from_participant(
    participant: AgreementParticipant,
    *,
    tab_bucket: dict[str, list[Any]] | None = None,
) -> dict[str, Any]:
    """
    Build a DocuSign recipient object from an AgreementParticipant.

    Tabs are limited to send-time prefill (``tab_prefill``); PDF fields and signatures
    are created via document ``transformPdfFields`` where applicable.

    Args:
        participant: AgreementParticipant model
        tab_bucket: Optional prefill from send request (``text`` / ``checkbox`` SDK tab lists).

    Returns:
        DocuSign recipient dictionary (``tabs`` omitted when empty)
    """
    extra_text: list[dict[str, Any]] | None = None
    extra_cb: list[dict[str, Any]] | None = None
    if tab_bucket and participant.role == "signer":
        if tab_bucket.get("text"):
            extra_text = [docusign_sanitize(t) for t in tab_bucket["text"]]
        if tab_bucket.get("checkbox"):
            extra_cb = [docusign_sanitize(t) for t in tab_bucket["checkbox"]]

    recipient: dict[str, Any] = {
        "email": participant.email,
        "name": participant.name,
        "recipientId": str(participant.id),  # Use our participant ID
        "routingOrder": str(participant.routing_order),
    }
    # Let signers add fields (text, date, signature, etc.) during the signing ceremony,
    # not only complete pre-placed tags. DocuSign string booleans per API.
    if participant.role == "signer":
        recipient["recipientSuppliesTabs"] = "true"
    tabs = build_tabs_for_recipient(
        participant,
        extra_text_tabs=extra_text,
        extra_checkbox_tabs=extra_cb,
    )
    if tabs:
        recipient["tabs"] = tabs

    return recipient


def build_signers(
    participants: list[AgreementParticipant],
    tab_prefill_by_pid: dict[str, dict[str, list[Any]]] | None = None,
) -> list[dict[str, Any]]:
    """
    Build list of DocuSign signers from participants.

    Args:
        participants: List of AgreementParticipant models
        tab_prefill_by_pid: Optional map participant_id -> tab lists for API prefill.

    Returns:
        List of DocuSign signer dictionaries
    """
    signers = []
    by_pid = tab_prefill_by_pid or {}

    for participant in participants:
        if participant.role == "signer":
            bucket = by_pid.get(participant.id)
            signer = build_recipient_from_participant(participant, tab_bucket=bucket)
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


def build_recipients_from_participants(
    participants: list[AgreementParticipant],
    tab_prefill_by_pid: dict[str, dict[str, list[Any]]] | None = None,
) -> dict[str, Any]:
    """
    Build complete recipients object from participants.

    Args:
        participants: List of AgreementParticipant models
        tab_prefill_by_pid: Optional per-signer tab prefill for create envelope.

    Returns:
        DocuSign recipients dictionary
    """
    recipients = {}

    signers = build_signers(participants, tab_prefill_by_pid=tab_prefill_by_pid)
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
