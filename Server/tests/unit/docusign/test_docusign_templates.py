"""
Tests for DocuSign template synchronization
"""

from unittest.mock import Mock, patch

import pytest
from flask import Flask


class TestTemplateSync:
    """Test DocuSign template synchronization"""

    def test_sync_templates_from_docusign(
        self, app: Flask, db_session, mock_docusign_client
    ):
        """Test syncing templates from DocuSign"""
        from app.services.docusign.templates.sync import TemplateSync

        with app.app_context():
            mock_docusign_client.return_value.list_templates.return_value = {
                "templates": [
                    {
                        "templateId": "template-123",
                        "name": "Purchase Agreement",
                        "description": "Standard purchase agreement",
                        "shared": "false",
                        "created": "2024-01-01T10:00:00Z",
                    },
                    {
                        "templateId": "template-456",
                        "name": "Inspection Addendum",
                        "description": "Inspection contingency addendum",
                        "shared": "false",
                        "created": "2024-01-02T10:00:00Z",
                    },
                ]
            }

            result = TemplateSync.sync_templates()

            assert result["success"] is True
            assert result["synced_count"] >= 2
            mock_docusign_client.return_value.list_templates.assert_called_once()

    def test_sync_templates_stores_in_database(
        self, app: Flask, db_session, mock_docusign_client
    ):
        """Test template sync stores templates in database"""
        from app.models import DocusignTemplate
        from app.services.docusign.templates.sync import TemplateSync

        with app.app_context():
            mock_docusign_client.return_value.list_templates.return_value = {
                "templates": [
                    {
                        "templateId": "template-789",
                        "name": "Listing Agreement",
                        "description": "Exclusive listing agreement",
                        "shared": "false",
                        "created": "2024-01-03T10:00:00Z",
                    }
                ]
            }

            TemplateSync.sync_templates()

            # Verify template stored in database
            template = DocusignTemplate.query.filter_by(
                docusign_template_id="template-789"
            ).first()
            assert template is not None
            assert template.name == "Listing Agreement"
            assert template.description == "Exclusive listing agreement"

    def test_sync_templates_updates_existing(
        self, app: Flask, db_session, mock_docusign_client
    ):
        """Test template sync updates existing templates"""
        from app.models import DocusignTemplate
        from app.services.docusign.templates.sync import TemplateSync

        with app.app_context():
            # Create existing template
            existing = DocusignTemplate(
                docusign_template_id="template-123",
                name="Old Name",
                description="Old description",
            )
            db_session.add(existing)
            db_session.commit()

            mock_docusign_client.return_value.list_templates.return_value = {
                "templates": [
                    {
                        "templateId": "template-123",
                        "name": "Updated Name",
                        "description": "Updated description",
                        "shared": "false",
                        "created": "2024-01-01T10:00:00Z",
                    }
                ]
            }

            TemplateSync.sync_templates()

            # Verify template updated
            updated = DocusignTemplate.query.filter_by(
                docusign_template_id="template-123"
            ).first()
            assert updated.name == "Updated Name"
            assert updated.description == "Updated description"

    def test_get_template_by_id(self, app: Flask, db_session, mock_docusign_client):
        """Test retrieving template by DocuSign template ID"""
        from app.services.docusign.templates.sync import TemplateSync

        with app.app_context():
            mock_docusign_client.return_value.get_template.return_value = {
                "templateId": "template-123",
                "name": "Purchase Agreement",
                "documents": [{"documentId": "1", "name": "Agreement.pdf"}],
                "recipients": {"signers": []},
            }

            template = TemplateSync.get_template("template-123")

            assert template is not None
            assert template["name"] == "Purchase Agreement"
            assert "documents" in template
            mock_docusign_client.return_value.get_template.assert_called_once()

    def test_list_available_templates(self, app: Flask, db_session):
        """Test listing available templates from database"""
        from app.models import DocusignTemplate
        from app.services.docusign.templates.sync import TemplateSync

        with app.app_context():
            # Create test templates
            templates = [
                DocusignTemplate(
                    docusign_template_id="template-1",
                    name="Template 1",
                    is_active=True,
                ),
                DocusignTemplate(
                    docusign_template_id="template-2",
                    name="Template 2",
                    is_active=True,
                ),
                DocusignTemplate(
                    docusign_template_id="template-3",
                    name="Inactive Template",
                    is_active=False,
                ),
            ]
            for template in templates:
                db_session.add(template)
            db_session.commit()

            result = TemplateSync.list_available_templates()

            assert len(result) == 2  # Only active templates
            assert all(t["is_active"] for t in result)

    def test_sync_templates_handles_errors(
        self, app: Flask, db_session, mock_docusign_client
    ):
        """Test template sync handles DocuSign API errors gracefully"""
        from app.services.docusign.templates.sync import TemplateSync

        with app.app_context():
            mock_docusign_client.return_value.list_templates.side_effect = Exception(
                "DocuSign API error"
            )

            result = TemplateSync.sync_templates()

            assert result["success"] is False
            assert "error" in result

    def test_delete_template(self, app: Flask, db_session):
        """Test marking template as inactive"""
        from app.models import DocusignTemplate
        from app.services.docusign.templates.sync import TemplateSync

        with app.app_context():
            template = DocusignTemplate(
                docusign_template_id="template-999",
                name="To Delete",
                is_active=True,
            )
            db_session.add(template)
            db_session.commit()

            TemplateSync.delete_template("template-999")

            # Verify template marked inactive
            deleted = DocusignTemplate.query.filter_by(
                docusign_template_id="template-999"
            ).first()
            assert deleted.is_active is False
