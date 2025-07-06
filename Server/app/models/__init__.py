from ..extensions import db
from .user import User
from .pdf_document import PDFDocument
from .subscription import Subscription

# Initialize database
def init_db():
    db.create_all()

__all__ = ['User', 'PDFDocument', 'Subscription', 'db']