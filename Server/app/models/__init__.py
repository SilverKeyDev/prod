from ..extensions import db

# Import from organized subfolders for backward compatibility
from .auth import User, UserPreferences, OAuthState, GoogleOAuthToken
from .property import HomeUniversal, HomeLikes, HomeNotInterested, Search, ScoringResultsTracker, UserScoreWeights
from .agent import AgentConnections, AgentConnectionRequest, ChatHistory, Todo
from .documents import (
    Document,
    Agreement,
    AgreementRevision,
    AgreementParticipant,
    AgreementEvent,
    DocusignConnectEvent,
    DocusignTemplate,
    DocusignOAuthToken
)
from .calendar import CalendarEvent, CalendarShare

# Initialize database
def init_db():
    db.create_all()

__all__ = [
    'User', 
    'Document',
    'Agreement',
    'AgreementRevision',
    'AgreementParticipant',
    'AgreementEvent',
    'DocusignConnectEvent',
    'DocusignTemplate',
    'DocusignOAuthToken',
    'UserPreferences', 
    'HomeUniversal', 
    'HomeLikes', 
    'HomeNotInterested',
    'Search',
    'ScoringResultsTracker',
    'UserScoreWeights',
    'AgentConnections', 
    'AgentConnectionRequest', 
    'ChatHistory',
    'Todo',
    'CalendarEvent',
    'CalendarShare',
    'GoogleOAuthToken', 
    'OAuthState', 
    'db'
]