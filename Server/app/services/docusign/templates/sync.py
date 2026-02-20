"""
DocuSign template sync service
"""

import uuid
from datetime import datetime, timezone

from app import db
from app.models import DocusignTemplate
from logger import LOG_CATEGORIES, get_logger

from ..core.client import DocusignClient

logger = get_logger()


class TemplateSyncService:
    """Sync templates from DocuSign"""

    @staticmethod
    def sync_all_templates():
        """Sync all templates from DocuSign"""
        logger.info(LOG_CATEGORIES["DOCUSIGN"], "Starting DocuSign template sync")

        client = DocusignClient(auth_type="jwt")
        templates = client.list_templates()

        logger.debug(
            LOG_CATEGORIES["DOCUSIGN"],
            "Templates fetched from DocuSign",
            {"template_count": len(templates)},
        )

        synced_count = 0
        updated_count = 0
        created_count = 0

        for tmpl in templates:
            try:
                # Check if exists
                existing = DocusignTemplate.query.filter_by(
                    docusign_template_id=tmpl["templateId"]
                ).first()

                if existing:
                    # Update
                    logger.debug(
                        LOG_CATEGORIES["DOCUSIGN"],
                        "Updating existing template",
                        {"template_id": tmpl["templateId"], "name": tmpl["name"]},
                    )
                    existing.name = tmpl["name"]
                    existing.description = tmpl.get("description")
                    existing.synced_at = datetime.now(timezone.utc)
                    updated_count += 1
                else:
                    # Create
                    logger.debug(
                        LOG_CATEGORIES["DOCUSIGN"],
                        "Creating new template",
                        {"template_id": tmpl["templateId"], "name": tmpl["name"]},
                    )
                    new_template = DocusignTemplate(
                        id=str(uuid.uuid4()),
                        docusign_template_id=tmpl["templateId"],
                        name=tmpl["name"],
                        description=tmpl.get("description"),
                    )
                    db.session.add(new_template)
                    created_count += 1

                synced_count += 1

            except Exception as e:
                logger.error(
                    LOG_CATEGORIES["ERRORS"],
                    "Failed to sync template",
                    {"template_id": tmpl.get("templateId"), "error": str(e)},
                )

        db.session.commit()

        logger.info(
            LOG_CATEGORIES["DOCUSIGN"],
            "Template sync completed successfully",
            {
                "total_synced": synced_count,
                "created": created_count,
                "updated": updated_count,
                "total_templates": len(templates),
            },
        )

        return synced_count
