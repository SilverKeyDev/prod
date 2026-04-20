"""
Tests for DocuSign recipient tabs (signatures, dates, text fields) and envelope custom fields.
"""

from unittest.mock import MagicMock, patch

from docusign_esign import Notification


def _participant(**kwargs):
    from app.models import AgreementParticipant

    return AgreementParticipant(**kwargs)


class TestRecipientTabs:
    """Tests for build_tabs_for_recipient (prefill-only; PDF fields via transform)."""

    def test_signer_with_no_prefill_has_no_tabs(self):
        from app.services.docusign.utils.recipients import build_tabs_for_recipient

        participant = _participant(
            agreement_id="agr-1",
            email="signer@example.com",
            name="Pat Signer",
            role="signer",
            routing_order=1,
        )
        participant.id = "part-signer-1"

        tabs = build_tabs_for_recipient(participant)

        assert tabs == {}

    def test_signer_merges_extra_text_tabs_with_document_and_recipient_ids(self):
        from app.services.docusign.utils.recipients import build_tabs_for_recipient

        participant = _participant(
            agreement_id="agr-1",
            email="signer@example.com",
            name="Pat Signer",
            role="signer",
            routing_order=1,
        )
        participant.id = "part-signer-1"

        tabs = build_tabs_for_recipient(
            participant,
            document_id="1",
            extra_text_tabs=[
                {"tabLabel": "custom_a", "pageNumber": "1", "xPosition": "10", "yPosition": "20"}
            ],
        )

        assert "textTabs" in tabs
        assert len(tabs["textTabs"]) == 1
        text_tab = tabs["textTabs"][0]
        assert text_tab["tabLabel"] == "custom_a"
        assert text_tab["documentId"] == "1"
        assert text_tab["recipientId"] == "part-signer-1"

    def test_carbon_copy_has_no_tabs(self):
        from app.services.docusign.utils.recipients import build_tabs_for_recipient

        participant = _participant(
            agreement_id="agr-1",
            email="cc@example.com",
            name="CC User",
            role="carbon_copy",
            routing_order=1,
        )
        participant.id = "part-cc-1"

        tabs = build_tabs_for_recipient(participant)

        assert tabs == {}


class TestEnvelopeBuilderCustomFields:
    """Envelope-level text custom fields on EnvelopeDefinition."""

    def test_build_custom_fields_maps_agreement_ids(self):
        """_build_custom_fields attaches agreement_id, buyer_id, agent_id for DocuSign search."""
        from app.services.docusign.envelopes.builder import EnvelopeBuilder

        agreement = MagicMock()
        agreement.id = "agreement-123"
        agreement.buyer_id = "buyer-789"
        agreement.agent_id = "agent-456"

        builder = EnvelopeBuilder.__new__(EnvelopeBuilder)
        builder.agreement = agreement
        cf = EnvelopeBuilder._build_custom_fields(builder)

        assert cf.text_custom_fields is not None
        by_name = {f.name: f.value for f in cf.text_custom_fields}
        assert by_name["agreement_id"] == "agreement-123"
        assert by_name["buyer_id"] == "buyer-789"
        assert by_name["agent_id"] == "agent-456"

    def test_build_includes_custom_fields_on_envelope(self):
        """Full build() attaches custom_fields to the EnvelopeDefinition (no Flask app / DB)."""
        from app.services.docusign.envelopes.builder import EnvelopeBuilder

        signer = MagicMock()
        signer.id = "participant-1"
        signer.role = "signer"
        signer.email = "signer@example.com"
        signer.name = "Signer"
        signer.routing_order = 1

        revision = MagicMock()
        revision.file_path = "s3/key/doc.pdf"
        revision.filename = "doc.pdf"
        revision.mime_type = "application/pdf"

        agreement = MagicMock()
        agreement.id = "agreement-123"
        agreement.title = "Test envelope"
        agreement.agent_id = "agent-456"
        agreement.buyer_id = "buyer-789"
        agreement.current_revision = revision
        agreement.participants = [signer]

        fake_pdf = b"%PDF-1.4 test bytes for envelope"
        with (
            patch(
                "app.services.docusign.envelopes.builder.s3_service.get_pdf",
                return_value=fake_pdf,
            ),
            patch(
                "app.services.docusign.envelopes.builder.build_notification_for_envelope_create",
                return_value=Notification(use_account_defaults="true"),
            ),
        ):
            envelope = EnvelopeBuilder(agreement, signing_method="embedded").build()

        doc = envelope.documents[0]
        assert doc.transform_pdf_fields == "true"
        assert doc.assign_tabs_to_recipient_id == "participant-1"

        assert envelope.custom_fields is not None

    def test_assign_tabs_targets_lowest_routing_signer(self):
        """PDF transform assigns transformed fields to the first routing-order signer."""
        from app.services.docusign.envelopes.builder import EnvelopeBuilder

        signer_late = MagicMock()
        signer_late.id = "participant-late"
        signer_late.role = "signer"
        signer_late.email = "second@example.com"
        signer_late.name = "Second"
        signer_late.routing_order = 2

        signer_first = MagicMock()
        signer_first.id = "participant-first"
        signer_first.role = "signer"
        signer_first.email = "first@example.com"
        signer_first.name = "First"
        signer_first.routing_order = 1

        revision = MagicMock()
        revision.file_path = "s3/key/doc.pdf"
        revision.filename = "doc.pdf"
        revision.mime_type = "application/pdf"

        agreement = MagicMock()
        agreement.id = "agreement-123"
        agreement.title = "Test envelope"
        agreement.agent_id = "agent-456"
        agreement.buyer_id = "buyer-789"
        agreement.current_revision = revision
        agreement.participants = [signer_late, signer_first]

        fake_pdf = b"%PDF-1.4 test bytes for envelope"
        with (
            patch(
                "app.services.docusign.envelopes.builder.s3_service.get_pdf",
                return_value=fake_pdf,
            ),
            patch(
                "app.services.docusign.envelopes.builder.build_notification_for_envelope_create",
                return_value=Notification(use_account_defaults="true"),
            ),
        ):
            envelope = EnvelopeBuilder(agreement, signing_method="embedded").build()

        assert envelope.documents[0].assign_tabs_to_recipient_id == "participant-first"
        text_fields = envelope.custom_fields.text_custom_fields
        assert text_fields is not None
        by_name = {f.name: f.value for f in text_fields}
        assert by_name["agreement_id"] == agreement.id
        assert by_name["buyer_id"] == agreement.buyer_id
        assert by_name["agent_id"] == agreement.agent_id
