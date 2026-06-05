"""Document, agreement, and checklist form DTOs."""

from app.dtos.documents.agreement import AgreementDTO, participant_payload, revision_payload
from app.dtos.documents.checklist_form import ChecklistFormDTO
from app.dtos.documents.document import WorkflowDocumentDTO
from app.dtos.documents.docusign_template import DocusignTemplateDTO

__all__ = [
    "AgreementDTO",
    "ChecklistFormDTO",
    "DocusignTemplateDTO",
    "WorkflowDocumentDTO",
    "participant_payload",
    "revision_payload",
]
