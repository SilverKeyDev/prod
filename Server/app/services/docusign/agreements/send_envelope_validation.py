"""Validation for optional DocuSign send envelope options."""

from app.models import Agreement

from ..errors import AgreementStateError


def validate_template_agreement_send(agreement: Agreement, envelope_options: dict) -> None:
    """Ensure template_role_map matches DocuSign template roles exactly."""
    tid = agreement.docusign_source_template_id
    if not tid:
        return
    trm = envelope_options.get("template_role_map")
    if not trm:
        raise AgreementStateError(
            "template_role_map is required when sending an agreement created from a DocuSign template"
        )
    participants_list = list(agreement.participants)  # pyright: ignore[reportArgumentType]
    pids = {str(p.id) for p in participants_list}
    mapped_roles: set[str] = set()
    for row in trm:
        if not isinstance(row, dict):
            raise AgreementStateError("template_role_map entries must be objects")
        pid = str(row.get("participant_id") or "")
        if pid not in pids:
            raise AgreementStateError(
                f"template_role_map participant_id {pid} is not a participant on this agreement"
            )
        rn = str(row.get("role_name") or "").strip()
        if rn:
            mapped_roles.add(rn)
    from ..core.client import DocusignClient

    client = DocusignClient(auth_type="jwt")
    canonical = client.get_template_role_name_set(str(tid))
    if canonical != mapped_roles:
        raise AgreementStateError(
            "template_role_map must list each DocuSign template role exactly once. "
            f"Expected roles: {sorted(canonical)}"
        )


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
