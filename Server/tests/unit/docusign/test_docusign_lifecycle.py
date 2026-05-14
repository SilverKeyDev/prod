"""
Tests for DocuSign agreement lifecycle
"""

import uuid
from unittest.mock import patch

import pytest
from flask import Flask


class TestAgreementLifecycle:
    """Test agreement lifecycle operations"""

    def test_create_agreement(self, app: Flask, db_session):
        """Test creating new agreement"""
        from app.services.docusign.agreements.lifecycle import (
            AgreementLifecycleService,
        )

        with app.app_context():
            with patch(
                "app.services.documents.document_library_items.attach_library_item_to_agreement"
            ):
                agreement = AgreementLifecycleService.create_agreement(
                    agent_id="agent-123",
                    buyer_id="buyer-456",
                    title="Test Purchase Agreement",
                    agreement_type="offer",
                    property_address="123 Main St",
                    description="Standard purchase agreement",
                )

                assert agreement is not None
                assert agreement.agent_id == "agent-123"
                assert agreement.buyer_id == "buyer-456"
                assert agreement.title == "Test Purchase Agreement"
                assert agreement.status == "draft"
                assert agreement.property_address == "123 Main St"

    def test_get_agreement(self, app: Flask, db_session, sample_agreement):
        """Test retrieving agreement by ID"""
        from app.models import Agreement
        from app.services.docusign.agreements.lifecycle import (
            AgreementLifecycleService,
        )

        with app.app_context():
            # Create agreement in database
            agreement = Agreement(**sample_agreement)
            db_session.session.add(agreement)
            db_session.session.commit()

            retrieved = AgreementLifecycleService.get_agreement(agreement.id)
            assert retrieved.id == agreement.id
            assert retrieved.title == sample_agreement["title"]

    def test_get_nonexistent_agreement_raises_error(self, app: Flask, db_session):
        """Test get_agreement raises error for non-existent ID"""
        from app.services.docusign.agreements.lifecycle import (
            AgreementLifecycleService,
        )
        from app.services.docusign.errors import AgreementNotFoundError

        with app.app_context():
            with pytest.raises(AgreementNotFoundError):
                AgreementLifecycleService.get_agreement("nonexistent-id")

    def test_add_participant(self, app: Flask, db_session, sample_agreement):
        """Test adding participant to agreement"""
        from app.models import Agreement, User
        from app.services.docusign.agreements.lifecycle import (
            AgreementLifecycleService,
        )

        with app.app_context():
            # Create test data
            agreement = Agreement(**sample_agreement)
            db_session.session.add(agreement)

            signer = User(
                id="signer-123",
                cognito_id="cognito-signer",
                email="signer@example.com",
                name="Signer User",
            )
            db_session.session.add(signer)
            db_session.session.commit()

            participant = AgreementLifecycleService.add_participant(
                agreement_id=agreement.id,
                user_id="signer-123",
                role="signer",
                routing_order=1,
            )

            assert participant is not None
            assert participant.user_id == "signer-123"
            assert participant.role == "signer"
            assert participant.routing_order == 1
            assert participant.email == "signer@example.com"

    def test_add_participant_invalid_status(self, app: Flask, db_session, sample_agreement):
        """Test cannot add participant to non-draft agreement"""
        from app.models import Agreement
        from app.services.docusign.agreements.lifecycle import (
            AgreementLifecycleService,
        )
        from app.services.docusign.errors import AgreementStateError

        with app.app_context():
            sample_agreement["status"] = "sent"
            agreement = Agreement(**sample_agreement)
            db_session.session.add(agreement)
            db_session.session.commit()

            with pytest.raises(AgreementStateError):
                AgreementLifecycleService.add_participant(
                    agreement_id=agreement.id,
                    user_id="signer-123",
                    role="signer",
                )

    def test_add_participant_agent_as_signer_error(self, app: Flask, db_session, sample_agreement):
        """Test agent cannot be signer on their own agreement"""
        from app.models import Agreement, User
        from app.services.docusign.agreements.lifecycle import (
            AgreementLifecycleService,
        )
        from app.services.docusign.errors import AgreementStateError

        with app.app_context():
            agreement = Agreement(**sample_agreement)
            db_session.session.add(agreement)

            agent = User(
                id=sample_agreement["agent_id"],
                cognito_id="cognito-agent",
                email="agent@example.com",
                name="Agent User",
            )
            db_session.session.add(agent)
            db_session.session.commit()

            with pytest.raises(AgreementStateError):
                AgreementLifecycleService.add_participant(
                    agreement_id=agreement.id,
                    user_id=sample_agreement["agent_id"],
                    role="signer",
                    actor_id=sample_agreement["agent_id"],
                )

    def test_remove_participant(self, app: Flask, db_session, sample_agreement):
        """Test removing participant from agreement"""
        from app.models import Agreement, AgreementParticipant, User
        from app.services.docusign.agreements.lifecycle import (
            AgreementLifecycleService,
        )

        with app.app_context():
            agreement = Agreement(**sample_agreement)
            db_session.session.add(agreement)

            signer = User(
                id="signer-123",
                cognito_id="cognito-signer",
                email="signer@example.com",
                name="Signer User",
            )
            db_session.session.add(signer)

            participant = AgreementParticipant(
                agreement_id=agreement.id,
                user_id="signer-123",
                email="signer@example.com",
                name="Signer User",
                role="signer",
                routing_order=1,
            )
            db_session.session.add(participant)
            db_session.session.commit()

            participant_id = participant.id
            AgreementLifecycleService.remove_participant(agreement.id, participant_id)

            # Verify participant removed
            removed = AgreementParticipant.query.get(participant_id)
            assert removed is None

    def test_update_participant_routing_order(self, app: Flask, db_session, sample_agreement):
        """Test updating participant routing order"""
        from app.models import Agreement, AgreementParticipant
        from app.services.docusign.agreements.lifecycle import (
            AgreementLifecycleService,
        )

        with app.app_context():
            agreement = Agreement(**sample_agreement)
            db_session.session.add(agreement)

            participant = AgreementParticipant(
                agreement_id=agreement.id,
                user_id="signer-123",
                email="signer@example.com",
                name="Signer User",
                role="signer",
                routing_order=1,
            )
            db_session.session.add(participant)
            db_session.session.commit()

            updated = AgreementLifecycleService.update_participant_routing_order(
                agreement.id, participant.id, 2
            )

            assert updated.routing_order == 2

    def test_void_agreement_without_envelope(self, app: Flask, db_session, sample_agreement):
        """Test voiding agreement that hasn't been sent"""
        from app.models import Agreement
        from app.services.docusign.agreements.lifecycle import (
            AgreementLifecycleService,
        )

        with app.app_context():
            with patch("app.services.documents.document_library_items.sync_agreement_library_item"):
                agreement = Agreement(**sample_agreement)
                agreement.docusign_envelope_id = None
                db_session.session.add(agreement)
                db_session.session.commit()

                AgreementLifecycleService.void_agreement(agreement.id, "Testing void", "agent-123")

                voided = Agreement.query.get(agreement.id)
                assert voided.status == "voided"
                assert voided.voided_at is not None

    def test_void_agreement_with_envelope(
        self, app: Flask, db_session, sample_agreement, mock_docusign_client
    ):
        """Test voiding agreement with DocuSign envelope"""
        from app.models import Agreement
        from app.services.docusign.agreements.lifecycle import (
            AgreementLifecycleService,
        )

        with app.app_context():
            with patch("app.services.documents.document_library_items.sync_agreement_library_item"):
                agreement = Agreement(**sample_agreement)
                agreement.docusign_envelope_id = "envelope-123"
                agreement.status = "sent"
                db_session.session.add(agreement)
                db_session.session.commit()

                AgreementLifecycleService.void_agreement(agreement.id, "Testing void", "agent-123")

                voided = Agreement.query.get(agreement.id)
                assert voided.status == "voided"
                # Verify DocuSign void was called
                mock_docusign_client.return_value.void_envelope.assert_called_once()

    def test_get_signing_url(self, app: Flask, db_session, sample_agreement):
        """Test getting signing URL for participant"""
        from app.models import Agreement, AgreementParticipant
        from app.services.docusign.agreements.lifecycle import (
            AgreementLifecycleService,
        )

        with app.app_context():
            with patch(
                "app.services.docusign.envelopes.signing.SigningService.get_signing_url"
            ) as mock_get_url:
                mock_get_url.return_value = (
                    "https://demo.docusign.net/Signing/StartInSession.aspx?..."
                )

                agreement = Agreement(**sample_agreement)
                db_session.session.add(agreement)

                participant = AgreementParticipant(
                    agreement_id=agreement.id,
                    user_id="signer-123",
                    email="signer@example.com",
                    name="Signer User",
                    role="signer",
                    routing_order=1,
                )
                db_session.session.add(participant)
                db_session.session.commit()

                url = AgreementLifecycleService.get_signing_url(agreement.id, participant.id)

                assert url.startswith("https://")
                assert "docusign.net" in url
                mock_get_url.assert_called_once()

    def test_discard_completed_strips_library_only(self, app: Flask, db_session, sample_agreement):
        """Completed agreements: discard removes shared library row only (no void)."""
        from app.models import Agreement, DocumentLibraryItem, User
        from app.services.docusign.agreements.lifecycle import (
            AgreementLifecycleService,
        )

        with app.app_context():
            db_session.session.add(
                User(
                    id=sample_agreement["agent_id"],
                    cognito_id="c-agent-discard",
                    email="agent-discard@example.com",
                    name="Agent",
                    is_agent=True,
                )
            )
            db_session.session.add(
                User(
                    id=sample_agreement["buyer_id"],
                    cognito_id="c-buyer-discard",
                    email="buyer-discard@example.com",
                    name="Buyer",
                    is_agent=False,
                )
            )
            lib_id = str(uuid.uuid4())
            db_session.session.add(
                DocumentLibraryItem(
                    id=lib_id,
                    user_id=sample_agreement["buyer_id"],
                    kind="agreement",
                    title="Agreement",
                    display_status="completed",
                )
            )
            agreement = Agreement(**sample_agreement)
            agreement.status = "completed"
            agreement.library_item_id = lib_id
            db_session.session.add(agreement)
            db_session.session.commit()

            AgreementLifecycleService.discard_agreement_as_agent(
                agreement.id, "cleanup", sample_agreement["agent_id"]
            )

            assert DocumentLibraryItem.query.get(lib_id) is None
            refreshed = Agreement.query.get(agreement.id)
            assert refreshed is not None
            assert refreshed.library_item_id is None
            assert refreshed.status == "completed"

    def test_discard_draft_calls_void_agreement(self, app: Flask, db_session, sample_agreement):
        """Non-terminal agreements delegate to void_agreement (DocuSign + library)."""
        from app.models import Agreement, User
        from app.services.docusign.agreements.lifecycle import (
            AgreementLifecycleService,
        )

        with app.app_context():
            db_session.session.add(
                User(
                    id=sample_agreement["agent_id"],
                    cognito_id="c-agent-draft",
                    email="agent-draft@example.com",
                    name="Agent",
                    is_agent=True,
                )
            )
            db_session.session.add(
                User(
                    id=sample_agreement["buyer_id"],
                    cognito_id="c-buyer-draft",
                    email="buyer-draft@example.com",
                    name="Buyer",
                    is_agent=False,
                )
            )
            with patch("app.services.documents.document_library_items.sync_agreement_library_item"):
                agreement = Agreement(**sample_agreement)
                db_session.session.add(agreement)
                db_session.session.commit()

            with patch(
                "app.services.docusign.agreements.signature_flow.void_agreement"
            ) as mock_void:
                AgreementLifecycleService.discard_agreement_as_agent(
                    agreement.id, "discard-reason", sample_agreement["agent_id"]
                )
                mock_void.assert_called_once_with(
                    agreement.id, "discard-reason", sample_agreement["agent_id"]
                )
