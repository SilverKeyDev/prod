"""
Build DocuSign EnvelopeDefinition from an Agreement that uses a DocuSign template (no PDF revision).
"""

from typing import Any

from docusign_esign import (
    CustomFields,
    EnvelopeDefinition,
    TemplateRole,
    TextCustomField,
)

from app.models import Agreement, AgreementParticipant
from app.schemas.generated import DocuSignEnvelopeNotificationInput, DocusignTemplateRoleMapEntry
from logger import log

from ..errors import AgreementStateError
from ..utils.recipients import validate_participants
from .notification_settings import build_notification_for_envelope_create
from .tab_prefill import build_prefill_tabs_model, prefill_tabs_nonempty


class TemplateEnvelopeBuilder:
    """Build EnvelopeDefinition from template_id + participant role mapping."""

    def __init__(
        self,
        agreement: Agreement,
        signing_method: str = "embedded",
        envelope_options: dict[str, Any] | None = None,
    ):
        self.agreement = agreement
        self.signing_method = signing_method
        self.envelope_options = envelope_options or {}
        override_raw = self.envelope_options.get("envelope_notification")
        override = (
            DocuSignEnvelopeNotificationInput.model_validate(override_raw) if override_raw else None
        )
        self._notification = build_notification_for_envelope_create(override)
        self._prefill_tabs = build_prefill_tabs_model(
            self.envelope_options.get("envelope_prefill_tabs")
        )
        self._validate()

    def _validate(self) -> None:
        if not self.agreement.docusign_source_template_id:
            raise AgreementStateError("Agreement is missing docusign_source_template_id")
        participants_list = list(self.agreement.participants)  # pyright: ignore[reportArgumentType]
        if not participants_list:
            raise AgreementStateError("Agreement has no participants")
        is_valid, error = validate_participants(participants_list)
        if not is_valid:
            raise AgreementStateError(error or "Invalid participants")
        raw_map = self.envelope_options.get("template_role_map")
        if not raw_map:
            raise AgreementStateError("template_role_map is required for template-based send")
        rows: list[DocusignTemplateRoleMapEntry] = []
        for r in raw_map:
            rows.append(DocusignTemplateRoleMapEntry.model_validate(r))
        by_pid: dict[str, AgreementParticipant] = {str(p.id): p for p in participants_list}
        seen_roles: set[str] = set()
        for row in rows:
            if row.role_name in seen_roles:
                raise AgreementStateError(f"Duplicate template role in map: {row.role_name}")
            seen_roles.add(row.role_name)
            if str(row.participant_id) not in by_pid:
                raise AgreementStateError(
                    f"template_role_map participant_id {row.participant_id} is not on this agreement"
                )

    def build(self) -> EnvelopeDefinition:
        participants_list = list(self.agreement.participants)  # pyright: ignore[reportArgumentType]
        by_pid = {str(p.id): p for p in participants_list}
        raw_map = self.envelope_options.get("template_role_map") or []
        template_roles: list[TemplateRole] = []
        for r in raw_map:
            row = DocusignTemplateRoleMapEntry.model_validate(r)
            p = by_pid[str(row.participant_id)]
            tr = TemplateRole(
                role_name=row.role_name.strip(),
                name=(p.name or p.email or "").strip() or None,
                email=p.email,
                routing_order=str(p.routing_order or 1),
            )
            if self.signing_method == "embedded":
                tr.client_user_id = str(p.id)
            template_roles.append(tr)

        log.info(
            "DOCUSIGN",
            "Built template envelope definition",
            {
                "agreement_id": self.agreement.id,
                "template_id": self.agreement.docusign_source_template_id,
                "role_count": len(template_roles),
            },
        )
        return EnvelopeDefinition(
            template_id=self.agreement.docusign_source_template_id,
            template_roles=template_roles,
            email_subject=self.agreement.title,
            status="sent",
            custom_fields=self._build_custom_fields(),
            notification=self._notification,
        )

    def _build_custom_fields(self) -> CustomFields:
        agreement = self.agreement
        return CustomFields(
            text_custom_fields=[
                TextCustomField(
                    name="agreement_id",
                    value=str(agreement.id),
                    show="true",
                    required="false",
                ),
                TextCustomField(
                    name="buyer_id",
                    value=str(agreement.buyer_id),
                    show="true",
                    required="false",
                ),
                TextCustomField(
                    name="agent_id",
                    value=str(agreement.agent_id),
                    show="true",
                    required="false",
                ),
            ]
        )

    @property
    def prefill_tabs(self):
        from docusign_esign import PrefillTabs

        pt: PrefillTabs | None = self._prefill_tabs
        return pt if prefill_tabs_nonempty(pt) else None
