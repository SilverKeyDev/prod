"""
Tests for DocuSign template synchronization (TemplateSyncService).
"""

import pytest
from flask import Flask
from sqlalchemy import select

from app import db
from app.services.docusign.templates.sync import TemplateSyncService


class TestTemplateSyncService:
    """Test DocuSign template sync against ``TemplateSyncService.sync_all_templates``."""

    def test_sync_templates_from_docusign(self, app: Flask, db_session, mock_docusign_client):
        """sync_all_templates returns count of templates processed from DocuSign list."""
        with app.app_context():
            mock_docusign_client.return_value.list_templates.return_value = [
                {
                    "templateId": "template-123",
                    "name": "Purchase Agreement",
                    "description": "Standard purchase agreement",
                },
                {
                    "templateId": "template-456",
                    "name": "Inspection Addendum",
                    "description": "Inspection contingency addendum",
                },
            ]

            synced = TemplateSyncService.sync_all_templates()

            assert synced == 2
            mock_docusign_client.return_value.list_templates.assert_called_once()

    def test_sync_templates_stores_in_database(self, app: Flask, db_session, mock_docusign_client):
        """New DocuSign templates are persisted as ``DocusignTemplate`` rows."""
        from app.models import DocusignTemplate

        with app.app_context():
            mock_docusign_client.return_value.list_templates.return_value = [
                {
                    "templateId": "template-789",
                    "name": "Listing Agreement",
                    "description": "Exclusive listing agreement",
                }
            ]

            TemplateSyncService.sync_all_templates()

            template = db.session.scalar(
                select(DocusignTemplate).where(
                    DocusignTemplate.docusign_template_id == "template-789"
                )
            )
            assert template is not None
            assert template.name == "Listing Agreement"
            assert template.description == "Exclusive listing agreement"

    def test_sync_templates_updates_existing(self, app: Flask, db_session, mock_docusign_client):
        """Existing rows are updated when DocuSign returns the same template id."""
        from app.models import DocusignTemplate

        with app.app_context():
            existing = DocusignTemplate(
                docusign_template_id="template-123",
                name="Old Name",
                description="Old description",
            )
            db_session.session.add(existing)
            db_session.session.commit()

            mock_docusign_client.return_value.list_templates.return_value = [
                {
                    "templateId": "template-123",
                    "name": "Updated Name",
                    "description": "Updated description",
                }
            ]

            TemplateSyncService.sync_all_templates()

            updated = db.session.scalar(
                select(DocusignTemplate).where(
                    DocusignTemplate.docusign_template_id == "template-123"
                )
            )
            assert updated is not None
            assert updated.name == "Updated Name"
            assert updated.description == "Updated description"

    def test_sync_templates_propagates_list_api_errors(
        self, app: Flask, db_session, mock_docusign_client
    ):
        """Failures from list_templates propagate (no silent success dict)."""
        with app.app_context():
            mock_docusign_client.return_value.list_templates.side_effect = RuntimeError(
                "DocuSign API error"
            )

            with pytest.raises(RuntimeError, match="DocuSign API error"):
                TemplateSyncService.sync_all_templates()
