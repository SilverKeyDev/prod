"""Service layer for checklist forms management."""

import json
from datetime import date, timedelta

from app import db
from app.models import AgreementLink, ChecklistForm
from app.services.agent.conversation_list import get_conversation
from app.services.agent.conversation_messages import send_message as send_conversation_message
from app.services.agent.conversation_service import create_conversation
from app.services.transactions.retrieval import get_checklist_definition
from app.utils.security.app_logging import get_logger

from .s3_service import s3_service

logger = get_logger()

SHARED_ATTACHMENT_PREFIX = "__SK_SHARE__"


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
        *,
        form: ChecklistForm,
        agent_user_id: str,
        buyer_user_id: str,
        section: str,
        item_id: int,
        optional_message: str | None = None,
    ) -> dict:
        """
        Create a draft agreement from the checklist PDF, attach as first revision, send for signature.

        Returns:
            Dict with agreement_id (str).

        Raises:
            ValueError: Missing PDF bytes or upload failure.
        """
        from app.services.docusign import AgreementLifecycleService
        from app.services.docusign.agreements.revisions import RevisionService

        file_content = s3_service.get_pdf(form.s3_template_path)
        if not file_content:
            raise ValueError("Failed to download form PDF from storage")

        title = f"{form.title} ({section} · step {item_id})"
        agreement = AgreementLifecycleService.create_agreement(
            str(agent_user_id),
            str(buyer_user_id),
            title,
            "checklist_form",
            description=(optional_message or None),
        )
        filename = f"{form.form_key}.pdf"
        RevisionService.create_revision(
            agreement.id,
            file_content,
            filename,
            str(agent_user_id),
            notes=optional_message,
        )
        AgreementLifecycleService.send_for_signature(
            agreement.id,
            "email",
            str(agent_user_id),
            participant_user_id=str(buyer_user_id),
        )
        linked_item_id = f"{section}.{item_id}"
        existing = AgreementLink.query.filter_by(
            transaction_id=str(buyer_user_id),
            agreement_id=agreement.id,
            linked_item_type="checklist_item",
            linked_item_id=linked_item_id,
        ).first()
        if not existing:
            db.session.add(
                AgreementLink(
                    transaction_id=str(buyer_user_id),
                    agreement_id=agreement.id,
                    linked_item_type="checklist_item",
                    linked_item_id=linked_item_id,
                )
            )
            db.session.commit()
        return {"agreement_id": agreement.id}

    @staticmethod
    def send_form_via_messaging(
        *,
        form: ChecklistForm,
        agent_user_id: str,
        conversation_id: str | None,
        client_id_for_new: str | None,
        optional_message: str | None,
    ) -> dict:
        """
        Share a checklist form PDF with the client via agent messaging.

        Returns:
            Dict with message_id (ChatHistory id).

        Raises:
            ValueError: Missing/invalid conversation, access denied, or presign failure.
        """
        if not conversation_id or not str(conversation_id).strip():
            raise ValueError("conversation_id is required")

        resolved_id = str(conversation_id).strip()
        if resolved_id == "new":
            if not client_id_for_new or not str(client_id_for_new).strip():
                raise ValueError("client_id is required to create a conversation")
            conv = create_conversation(str(agent_user_id), str(client_id_for_new).strip())
            resolved_id = str(conv["id"])
        else:
            conv = get_conversation(resolved_id)
            if not conv:
                raise ValueError("Conversation not found")
            if str(conv.get("agent_id")) != str(agent_user_id):
                raise ValueError("Access denied")

        download_url = s3_service.generate_presigned_url(
            form.s3_template_path, download_filename=f"{form.form_key}.pdf"
        )
        if not download_url:
            raise ValueError("Failed to generate download URL")

        display_line = (form.title or "").strip() or form.form_key
        payload = {
            "v": 1,
            "kind": "checklist_form",
            "displayLine": display_line,
            "checklistForm": {
                "id": form.id,
                "form_key": form.form_key,
                "title": form.title,
                "download_url": download_url,
            },
        }
        line0 = f"{SHARED_ATTACHMENT_PREFIX}{json.dumps(payload, separators=(',', ':'))}"
        note = (optional_message or "").strip()
        full_message = f"{line0}\n\n{note}" if note else line0

        return send_conversation_message(
            resolved_id,
            str(agent_user_id),
            full_message,
            "agent",
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
