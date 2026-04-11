"""Service layer for checklist forms management."""

from datetime import date, timedelta

from app.models import ChecklistForm
from app.services.transactions.retrieval import get_checklist_definition
from app.utils.security.app_logging import get_logger

from .s3_service import s3_service

logger = get_logger()


class FormsService:
    """Manage checklist forms - download, send via DocuSign, send via messaging."""

    @staticmethod
    def get_forms_for_step(
        section: str, item_id: int, transaction_start_date: date | None = None
    ) -> list[dict]:
        """
        Get forms defined for a checklist step.

        Args:
            section: Checklist section (e.g. "escrow", "financing")
            item_id: Step ID within the section
            transaction_start_date: Optional transaction start date for deadline calculation

        Returns:
            List of form metadata dicts with presigned download URLs
        """
        # Get step definition from checklist
        items = get_checklist_definition(section)
        step = next((item for item in items if item.get("id") == item_id), None)

        if not step:
            logger.warning(f"Step not found: {section}.{item_id}")
            return []

        # Get suggested_form_ids from step
        suggested_form_ids = step.get("suggested_form_ids", [])
        if not suggested_form_ids:
            return []

        # Query ChecklistForm records
        forms = ChecklistForm.query.filter(ChecklistForm.form_key.in_(suggested_form_ids)).all()

        if not forms:
            logger.info(
                f"No forms found in database for step {section}.{item_id} "
                f"(suggested: {suggested_form_ids})"
            )
            return []

        # Build response with presigned URLs
        result = []
        for form in forms:
            form_dict = form.to_dict()

            # Generate presigned download URL
            download_url = s3_service.generate_presigned_url(form.s3_template_path)
            if download_url:
                form_dict["download_url"] = download_url
            else:
                logger.warning(f"Failed to generate presigned URL for form {form.form_key}")
                form_dict["download_url"] = None

            # Calculate deadline if transaction start date provided
            if transaction_start_date:
                deadline = FormsService.calculate_deadline(section, item_id, transaction_start_date)
                form_dict["deadline"] = deadline.isoformat() if deadline else None
            else:
                form_dict["deadline"] = None

            result.append(form_dict)

        return result

    @staticmethod
    def send_form_via_docusign(
        form_id: str, agreement_data: dict, transaction_id: str, section: str, item_id: int
    ) -> dict:
        """
        Create DocuSign agreement from form template and send to client.

        Args:
            form_id: ChecklistForm ID
            agreement_data: Dict with buyer_id, agent_id, participants, etc.
            transaction_id: Transaction ID to link agreement to
            section: Checklist section
            item_id: Checklist item ID

        Returns:
            Dict with agreement_id and status

        Raises:
            NotImplementedError: Phase 2 implementation
        """
        raise NotImplementedError(
            "DocuSign sending not yet implemented. "
            "Use docusignApi.createAgreement() + link to checklist in Phase 2."
        )

    @staticmethod
    def send_form_via_messaging(
        form_id: str, conversation_id: str, message: str, sender_id: str
    ) -> dict:
        """
        Share form via agent-client messaging.

        Args:
            form_id: ChecklistForm ID
            conversation_id: Messaging conversation ID
            message: Message text to send with form
            sender_id: ID of agent sending the form

        Returns:
            Dict with message_id and status

        Raises:
            NotImplementedError: Phase 2 implementation
        """
        raise NotImplementedError(
            "Messaging sending not yet implemented. "
            "Use send_message() with shared_document_id in Phase 2."
        )

    @staticmethod
    def calculate_deadline(section: str, item_id: int, base_date: date) -> date | None:
        """
        Calculate form deadline from step calendar config.

        Args:
            section: Checklist section
            item_id: Step ID
            base_date: Transaction start date

        Returns:
            Calculated deadline date, or None if no calendar config
        """
        items = get_checklist_definition(section)
        step = next((item for item in items if item.get("id") == item_id), None)

        if not step or "calendar" not in step:
            return None

        calendar = step["calendar"]

        # If hasDates is True, deadline is user-specified (not calculated)
        if calendar.get("hasDates"):
            return None

        # Calculate deadline from days offset
        days = calendar.get("days", 0)
        if days <= 0:
            return None

        return base_date + timedelta(days=days)
