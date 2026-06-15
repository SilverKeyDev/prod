"""DocuSign webhook processor helper functions."""

from typing import Any

from logger import log


def map_event_type(docusign_event: str) -> str:
    """Map DocuSign event type to our event type."""

    mapping = {
        "envelope-sent": "sent",
        "envelope-delivered": "delivered",
        "envelope-completed": "completed",
        "envelope-declined": "declined",
        "envelope-voided": "voided",
        "recipient-sent": "recipient_sent",
        "recipient-delivered": "recipient_delivered",
        "recipient-signed": "recipient_signed",
        "recipient-declined": "recipient_declined",
    }
    return mapping.get(docusign_event, "other")


def extract_recipients_for_webhook(
    envelope_data: dict[str, Any], payload: dict[str, Any]
) -> dict[str, Any]:
    """
    Return DocuSign Connect recipients object (signers / carbonCopies).

    Connect payloads vary slightly by configuration; try envelope summary paths
    before falling back to an empty dict.
    """

    def _usable(rec: Any) -> bool:
        return isinstance(rec, dict) and bool(rec.get("signers") or rec.get("carbonCopies"))

    for get_recipients in (
        lambda: envelope_data.get("recipients"),
        lambda: (payload.get("envelopeStatus") or {}).get("recipients"),
        lambda: (payload.get("data") or {}).get("envelopeSummary", {}).get("recipients"),
        lambda: payload.get("recipients"),
    ):
        rec = get_recipients()
        if _usable(rec):
            return rec

    fallback = envelope_data.get("recipients")
    return fallback if isinstance(fallback, dict) else {}


def build_event_description(
    event_type: str, old_status: str, new_status: str, envelope_data: dict[str, Any]
) -> str:
    """Build human-readable event description."""

    if new_status != old_status:
        status_descriptions = {
            "sent": "Agreement sent for signature",
            "delivered": "Agreement delivered to recipients",
            "signed": "All signers completed; envelope finalizing",
            "completed": "Agreement signed by all parties",
            "declined": "Agreement declined",
            "voided": "Agreement voided",
        }
        return status_descriptions.get(new_status, f"Agreement status changed to {new_status}")
    if "recipient" in event_type:
        return f"Recipient event: {event_type}"
    return f"DocuSign event: {event_type}"


def enqueue_fetch_documents(agreement_id: str):
    """Enqueue task to fetch completed documents."""
    try:
        log.debug(
            "DOCUSIGN",
            "Enqueueing fetch documents task",
            {"agreement_id": agreement_id},
        )

        from app.celery.tasks.docusign import fetch_completed_documents_task

        task = fetch_completed_documents_task.delay(agreement_id)  # type: ignore[union-attr]

        log.info(
            "DOCUSIGN",
            "Fetch documents task enqueued successfully",
            {"agreement_id": agreement_id, "task_id": task.id},
        )

    except Exception as e:
        log.error(
            "ERRORS",
            "Failed to enqueue fetch documents task",
            {"agreement_id": agreement_id, "error": str(e)},
        )
