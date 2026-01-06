from ..extensions import db

# Import from organized subfolders for backward compatibility
from .auth import User, UserPreferences, OAuthState, GoogleOAuthToken
from .property import HomeUniversal, HomeLikes, Search
from .agent import AgentConnections, AgentConnectionRequest, ChatHistory
from .documents import PDFDocument
from .calendar import CalendarEvent

# Initialize database
def init_db():
    db.create_all()

__all__ = [
    'User', 
    'PDFDocument', 
    'UserPreferences', 
    'HomeUniversal', 
    'HomeLikes', 
    'Search',
    'AgentConnections', 
    'AgentConnectionRequest', 
    'ChatHistory',
    'CalendarEvent', 
    'GoogleOAuthToken', 
    'OAuthState', 
    'db'
]