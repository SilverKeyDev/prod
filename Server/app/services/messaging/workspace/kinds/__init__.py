"""Registry of workspace conversation kind policies."""

from __future__ import annotations

from app.services.messaging.workspace.kinds.base import ConversationKindPolicy
from app.services.messaging.workspace.kinds.brokerage_agent import BrokerageAgentPolicy
from app.services.messaging.workspace.kinds.group import GroupPolicy
from app.services.messaging.workspace.kinds.integrator_brokerage import IntegratorBrokeragePolicy
from app.services.messaging.workspace.kinds.platform_support import PlatformSupportPolicy

KIND_REGISTRY: dict[str, ConversationKindPolicy] = {
    "platform_support": PlatformSupportPolicy(),
    "brokerage_agent": BrokerageAgentPolicy(),
    "integrator_brokerage": IntegratorBrokeragePolicy(),
    "group": GroupPolicy(),
}


def get_policy(kind: str) -> ConversationKindPolicy:
    policy = KIND_REGISTRY.get(kind)
    if policy is None:
        raise ValueError(f"Unknown workspace conversation kind: {kind}")
    return policy
