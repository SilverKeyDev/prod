"""ChecklistForm ORM → OpenAPI ChecklistForm schemas."""

from __future__ import annotations

from typing import TYPE_CHECKING

from app.schemas.generated import ChecklistForm as ChecklistFormSchema
from app.schemas.generated import ChecklistFormWithDownload as ChecklistFormWithDownloadSchema
from app.utils.format.datetime import to_aware_utc_iso

if TYPE_CHECKING:
    from app.models.documents.checklist_form import ChecklistForm as ChecklistFormModel


class ChecklistFormDTO:
    @staticmethod
    def from_orm(form: ChecklistFormModel) -> ChecklistFormSchema:
        return ChecklistFormSchema(
            id=form.id,
            form_key=form.form_key,
            title=form.title,
            description=form.description,
            s3_template_path=form.s3_template_path,
            category=form.category,
            created_at=to_aware_utc_iso(form.created_at),
            updated_at=to_aware_utc_iso(form.updated_at),
        )

    @staticmethod
    def to_with_download(
        form: ChecklistFormModel,
        *,
        download_url: str | None,
        deadline: str | None = None,
    ) -> ChecklistFormWithDownloadSchema:
        base = ChecklistFormDTO.from_orm(form)
        return ChecklistFormWithDownloadSchema(
            **base.model_dump(mode="json"),
            download_url=download_url,
            deadline=deadline,
        )
