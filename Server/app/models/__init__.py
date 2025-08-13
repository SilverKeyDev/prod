from ..extensions import db
from .user import User
from .pdf_document import PDFDocument
from .subscription import Subscription
from .home_descriptions import HomeDescription
from .user_preferences import UserPreferences
from .home_universal import HomeUniversal

# Initialize database
def init_db():
    db.create_all()

__all__ = ['User', 'PDFDocument', 'Subscription', 'UserPreferences', 'HomeDescription', 'HomeUniversal', 'db']