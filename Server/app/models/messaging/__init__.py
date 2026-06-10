from .brokerage_partner_adoption import BrokeragePartnerAdoption
from .partner_operator import PartnerOperator
from .workspace_conversation import WorkspaceConversation
from .workspace_conversation_participant import WorkspaceConversationParticipant

WORKSPACE_CONVERSATION_KINDS = frozenset(
    {
        "platform_support",
        "brokerage_agent",
        "integrator_brokerage",
        "group",
    }
)

SUPPORT_CATEGORIES = frozenset({"brokerage", "integrator"})

PARTICIPANT_ROLES = frozenset(
    {
        "brokerage_admin",
        "agent",
        "integrator",
        "support",
        "owner",
        "member",
    }
)

__all__ = [
    "BrokeragePartnerAdoption",
    "PARTICIPANT_ROLES",
    "PartnerOperator",
    "SUPPORT_CATEGORIES",
    "WORKSPACE_CONVERSATION_KINDS",
    "WorkspaceConversation",
    "WorkspaceConversationParticipant",
]
