from ..extensions import db
from .agent import AgentConnectionRequest, AgentConnections, ChatHistory, Todo
from .calendar import CalendarEvent, CalendarShare
from .documents import (
    Agreement,
    AgreementEvent,
    AgreementLink,
    AgreementParticipant,
    AgreementRevision,
    ChecklistForm,
    Document,
    DocumentLibraryItem,
    DocusignConnectEvent,
    DocusignOAuthToken,
    DocusignTemplate,
)
from .partners import BuyerStepView, Partner, RevShareLink, RevShareLinkClick
from .property import (
    HomeComment,
    HomeNotInterested,
    PropertyAnalysisSection,
    PropertyCache,
    ReelLike,
    ScoringResultsTracker,
    UserPropertyCommute,
    UserPropertyHighlights,
    UserPropertyLink,
    UserScoreWeights,
)
from .transactions import (
    ChecklistItemDispatchSetting,
    Transaction,
    TransactionAddress,
    TransactionTask,
)

# Import from organized subfolders for backward compatibility
from .user import (
    GoogleOAuthToken,
    OAuthState,
    User,
    UserAgentProfile,
    UserClientSettings,
    UserCommunicationPrefs,
    UserDemographics,
    UserFinancials,
    UserImportantLocation,
    UserIntentAttribute,
    UserRole,
    UserSearchDisplaySettings,
    UserSearchIntent,
)


# Initialize database
def init_db():
    db.create_all()


__all__ = [
    "Partner",
    "RevShareLink",
    "RevShareLinkClick",
    "BuyerStepView",
    "User",
    "ChecklistItemDispatchSetting",
    "Transaction",
    "TransactionAddress",
    "TransactionTask",
    "Document",
    "DocumentLibraryItem",
    "ChecklistForm",
    "Agreement",
    "AgreementLink",
    "AgreementRevision",
    "AgreementParticipant",
    "AgreementEvent",
    "UserRole",
    "UserDemographics",
    "UserFinancials",
    "UserClientSettings",
    "UserSearchDisplaySettings",
    "UserSearchIntent",
    "UserIntentAttribute",
    "UserImportantLocation",
    "UserCommunicationPrefs",
    "UserAgentProfile",
    "HomeComment",
    "HomeNotInterested",
    "PropertyAnalysisSection",
    "PropertyCache",
    "ReelLike",
    "ScoringResultsTracker",
    "UserPropertyCommute",
    "UserPropertyHighlights",
    "UserPropertyLink",
    "UserScoreWeights",
    "AgentConnections",
    "AgentConnectionRequest",
    "ChatHistory",
    "Todo",
    "CalendarEvent",
    "CalendarShare",
    "GoogleOAuthToken",
    "OAuthState",
    "DocusignConnectEvent",
    "DocusignOAuthToken",
    "DocusignTemplate",
    "db",
]
