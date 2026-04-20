"""Remove buyer-linked library rows when agreements are voided or stripped."""

from app import db
from app.models import Agreement, DocumentLibraryItem


def delete_agreement_library_item(agreement: Agreement) -> None:
    """Remove the buyer-linked library row so the agreement leaves Saved for agent and client."""
    lib_item_id = agreement.library_item_id
    agreement.library_item_id = None
    if lib_item_id:
        item = DocumentLibraryItem.query.get(lib_item_id)
        if item is not None:
            db.session.delete(item)
