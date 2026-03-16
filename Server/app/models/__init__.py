from ..extensions import db
from .agent import AgentConnectionRequest, AgentConnections, ChatHistory, Todo
from .calendar import CalendarEvent, CalendarShare
from .documents import (
    Agreement,
    AgreementEvent,
    AgreementLink,
    AgreementParticipant,
    AgreementRevision,
    Document,
)
from .property import (
    HomeComment,
    HomeLikes,
    HomeNotInterested,
    HomeUniversal,
    ReelLike,
    ScoringResultsTracker,
    Search,
    UserScoreWeights,
)
from .transactions import Transaction, TransactionAddress, TransactionTask

# Import from organized subfolders for backward compatibility
from .user import (
    GoogleOAuthToken,
    OAuthState,
    User,
    UserAgentProfile,
    UserCalendarConnection,
    UserCommunicationPrefs,
    UserDemographics,
    UserFinancials,
    UserImportantLocation,
    UserIntegration,
    UserIntentAttribute,
    UserRole,
    UserSearchIntent,
)


# Initialize database
def init_db():
    db.create_all()


__all__ = [
    "User",
    "Transaction",
    "TransactionAddress",
    "TransactionTask",
    "Document",
    "Agreement",
    "AgreementLink",
    "AgreementRevision",
    "AgreementParticipant",
    "AgreementEvent",
    "UserRole",
    "UserDemographics",
    "UserFinancials",
    "UserSearchIntent",
    "UserIntentAttribute",
    "UserImportantLocation",
    "UserCommunicationPrefs",
    "UserCalendarConnection",
    "UserAgentProfile",
    "HomeComment",
    "HomeUniversal",
    "HomeLikes",
    "HomeNotInterested",
    "ReelLike",
    "Search",
    "ScoringResultsTracker",
    "UserScoreWeights",
    "AgentConnections",
    "AgentConnectionRequest",
    "ChatHistory",
    "Todo",
    "CalendarEvent",
    "CalendarShare",
    "GoogleOAuthToken",
    "OAuthState",
    "UserIntegration",
    "db",
]
