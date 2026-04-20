"""Validation for optional DocuSign send envelope options."""

from app.models import Agreement

from ..errors import AgreementStateError


def validate_send_envelope_options(agreement: Agreement, envelope_options: dict) -> None:
    """Ensure tab_prefill targets only participants on this agreement."""
    tab_prefill = envelope_options.get("tab_prefill")
    if not tab_prefill:
        return
    if len(tab_prefill) > 20:
        raise AgreementStateError("tab_prefill cannot include more than 20 entries")
    participants_list = list(agreement.participants)  # pyright: ignore[reportArgumentType]
    participant_ids = {p.id for p in participants_list}
    for row in tab_prefill:
        if not isinstance(row, dict):
            raise AgreementStateError("tab_prefill entries must be objects")
        pid = row.get("participant_id")
        if not pid or pid not in participant_ids:
            raise AgreementStateError(
                "tab_prefill participant_id must reference a participant on this agreement"
            )
