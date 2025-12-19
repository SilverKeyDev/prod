from ..extensions import db
from .user import User
from .pdf_document import PDFDocument
from .user_preferences import UserPreferences
from .home_universal import HomeUniversal
from .agent_conversation import AgentConversation
from .agent_connection_request import AgentConnectionRequest

# Initialize database
def init_db():
    db.create_all()

__all__ = ['User', 'PDFDocument', 'UserPreferences', 'HomeUniversal', 'AgentConversation', 'AgentConnectionRequest', 'db']