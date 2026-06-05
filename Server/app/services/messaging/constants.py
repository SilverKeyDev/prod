"""Shared messaging constants."""

MAX_GROUP_PARTICIPANTS = 50

GROUP_EVENT_PREFIX = "__GROUP_EVENT__"

WORKSPACE_MESSAGE_ROLES = frozenset(
    {
        "user",
        "agent",
        "brokerage_admin",
        "integrator",
        "support",
        "system",
    }
)
