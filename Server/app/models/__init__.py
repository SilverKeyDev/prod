from ..extensions import db
from .user import User
from .pdf_document import PDFDocument
from .subscription import Subscription
from .home import Home
from .home_descriptions import HomeDescription
from .user_preferences import UserPreferences

# Initialize database
def init_db():
    db.create_all()

__all__ = ['User', 'PDFDocument', 'Subscription', 'UserPreferences', 'Home', 'HomeDescription', 'db']