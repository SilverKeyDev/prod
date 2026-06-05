"""DocuSign template ORM → OpenAPI list item schema."""

from __future__ import annotations

from typing import TYPE_CHECKING

from app.schemas.generated import DocusignTemplateListItem as DocusignTemplateListItemSchema

if TYPE_CHECKING:
    from app.models.documents.docusign_template import DocusignTemplate as DocusignTemplateModel


class DocusignTemplateDTO:
    @staticmethod
    def to_list_item(template: DocusignTemplateModel) -> DocusignTemplateListItemSchema:
        return DocusignTemplateListItemSchema(
            id=template.id,
            name=template.name,
            is_active=template.is_active,
        )
