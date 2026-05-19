"""
Service functions for managing agent clients
"""

from __future__ import annotations

import logging
from collections import defaultdict
from typing import Any

from sqlalchemy import func

from app import db
from app.dtos.user import _try_presigned_profile_picture_url
from app.services.transactions.checklist_support.checklist_constants import (
    PIPELINE_ORDER,
    PIPELINE_RANK,
    TASK_CATEGORIES,
)

from ...models import AgentConnections, Agreement, TransactionTask, User, UserRole
from ...utils.format.json_string_list_parse import (
    parse_json_or_csv_string_list,
    serialize_json_string_list,
)

logger = logging.getLogger(__name__)

# --- Client list enrichment (step labels, avatars, signature actions) ---

_SECTION_UNLOCK_REQUIRES: dict[str, tuple[str, ...]] = {
    "search": (),
    "offer": ("search",),
    "escrow": ("search", "offer"),
    "financing": ("search", "offer", "escrow"),
    "closing": ("search", "offer", "escrow", "financing"),
    "insurance": ("search", "offer", "escrow", "financing", "closing"),
}

_AGREEMENT_ACTIVE_STATUSES = frozenset({"sent", "delivered", "signed", "completed"})
_SIGNED_RECIPIENT_STATUSES = frozenset({"signed", "completed"})


def _client_kind_from_roles(role_names: set[str]) -> str:
    """Map user_roles (excluding agent) to AgentClient.client_kind; prefer seller over buyer."""
    roles = {r.lower() for r in role_names if r and str(r).lower() != "agent"}
    if "seller" in roles:
        return "seller"
    if "buyer" in roles:
        return "buyer"
    if "investor" in roles:
        return "investor"
    return "unknown"


def _batch_client_kinds(user_ids: list[str]) -> dict[str, str]:
    if not user_ids:
        return {}
    rows = UserRole.query.filter(UserRole.user_id.in_(user_ids)).all()
    by_user: dict[str, set[str]] = defaultdict(set)
    for row in rows:
        by_user[row.user_id].add(row.role)
    return {uid: _client_kind_from_roles(by_user.get(uid, set())) for uid in user_ids}


def _batch_pipeline_stages(user_ids: list[str]) -> dict[str, str]:
    """
    For each user, pick the checklist category with the most recent completed-task activity.
    Defaults to search when there are no completed tasks in TASK_CATEGORIES.
    """
    if not user_ids:
        return {}
    grouped = (
        db.session.query(
            TransactionTask.user_id,
            TransactionTask.category,
            func.max(TransactionTask.updated_at).label("latest_at"),
        )
        .filter(
            TransactionTask.user_id.in_(user_ids),
            TransactionTask.category.in_(TASK_CATEGORIES),
            TransactionTask.status == "done",
        )
        .group_by(TransactionTask.user_id, TransactionTask.category)
        .all()
    )
    # user_id -> (latest_at, rank, category)
    best: dict[str, tuple] = {}
    for user_id, category, latest_at in grouped:
        if category not in PIPELINE_RANK:
            continue
        rank = PIPELINE_RANK[category]
        prev = best.get(user_id)
        if prev is None:
            best[user_id] = (latest_at, rank, category)
            continue
        prev_at, prev_rank, _ = prev
        if latest_at is None:
            continue
        if prev_at is None or latest_at > prev_at or (latest_at == prev_at and rank > prev_rank):
            best[user_id] = (latest_at, rank, category)

    return {uid: best[uid][2] if uid in best else "search" for uid in user_ids}


def _item_id(item: dict[str, Any]) -> int | None:
    try:
        return int(item["id"])
    except (KeyError, TypeError, ValueError):
        return None


def _effective_checked_ids(user_id: str, category: str) -> set[int]:
    from app.services.transactions.checklist_signature_completion import (
        apply_signature_based_checked_ids,
    )
    from app.services.transactions.checklist_support.checklist_rules import (
        merge_task_checklist_checked_ids,
    )
    from app.services.transactions.retrieval import get_checklist_definition
    from app.services.transactions.unified_task_checklist_read import get_checked_ids_for_user

    items = get_checklist_definition(category)
    if not items:
        return set()
    raw_checked = get_checked_ids_for_user(str(user_id), category)
    old_set = {int(x) for x in raw_checked}
    pre_signature = merge_task_checklist_checked_ids(items, raw_checked, old_set)
    checked_set = set(pre_signature)
    apply_signature_based_checked_ids(items, str(user_id), category, checked_set)
    return checked_set


def _section_is_complete(user_id: str, category: str) -> bool:
    from app.services.transactions.checklist_support.checklist_rules import (
        sort_task_checklist_items,
    )
    from app.services.transactions.retrieval import get_checklist_definition

    items = get_checklist_definition(category)
    if not items:
        return True
    checked = _effective_checked_ids(user_id, category)
    sorted_items = sort_task_checklist_items(list(items))
    for item in sorted_items:
        iid = _item_id(item)
        if iid is None:
            continue
        if iid not in checked:
            return False
    return True


def _first_incomplete_step_label(items: list[dict[str, Any]], checked: set[int]) -> str | None:
    """Port of Client getActiveChecklistItemIds — returns label for the first active step only."""
    from app.services.transactions.checklist_support.checklist_rules import (
        sort_task_checklist_items,
    )

    sorted_items = sort_task_checklist_items(list(items))
    first_incomplete = None
    for item in sorted_items:
        iid = _item_id(item)
        if iid is None or iid in checked:
            continue
        first_incomplete = item
        break
    if first_incomplete is None:
        return None

    label = str(first_incomplete.get("label") or "").strip()
    if not label:
        return None

    group = str(first_incomplete.get("parallel_step_group") or "").strip()
    if not group:
        return label

    return label


def _current_step_for_user(user_id: str) -> tuple[str, str | None]:
    from app.services.transactions.retrieval import get_checklist_definition

    completion_cache: dict[str, bool] = {
        cat: _section_is_complete(user_id, cat) for cat in PIPELINE_ORDER
    }

    for category in PIPELINE_ORDER:
        reqs = _SECTION_UNLOCK_REQUIRES.get(category, ())
        if not all(completion_cache.get(req, False) for req in reqs):
            continue

        items = get_checklist_definition(category)
        if not items:
            continue

        checked = _effective_checked_ids(user_id, category)
        label = _first_incomplete_step_label(items, checked)
        if label:
            return category, label

        if not completion_cache.get(category, True):
            return category, None

    return "closing", None


def _batch_current_step(user_ids: list[str]) -> dict[str, tuple[str, str | None]]:
    if not user_ids:
        return {}
    return {uid: _current_step_for_user(uid) for uid in user_ids}


def _batch_profile_picture_urls(users: list[User]) -> dict[str, str | None]:
    return {str(u.id): _try_presigned_profile_picture_url(u) for u in users}


def _batch_requires_signature(agent_id: str, client_ids: list[str]) -> dict[str, bool]:
    if not client_ids:
        return {}

    out = dict.fromkeys(client_ids, False)
    agreements = Agreement.query.filter(
        Agreement.agent_id == agent_id,
        Agreement.buyer_id.in_(client_ids),
        Agreement.status.in_(tuple(_AGREEMENT_ACTIVE_STATUSES)),
    ).all()

    for agreement in agreements:
        buyer_id = str(agreement.buyer_id)
        if buyer_id not in out:
            continue

        participants = list(agreement.participants or [])
        if not participants:
            continue

        agent_participant = next((p for p in participants if p.user_id == agent_id), None)
        buyer_participant = next((p for p in participants if p.user_id == agreement.buyer_id), None)
        if agent_participant is None or buyer_participant is None:
            continue

        agent_signed = (
            agent_participant.recipient_status or ""
        ).lower() in _SIGNED_RECIPIENT_STATUSES
        buyer_signed = (
            buyer_participant.recipient_status or ""
        ).lower() in _SIGNED_RECIPIENT_STATUSES

        if buyer_signed and not agent_signed:
            out[buyer_id] = True

    return out


def append_unique_client_id(agent: User, client_id: str) -> None:
    """Mutate agent.client_ids to include client_id once."""
    merged = parse_json_or_csv_string_list(agent.client_ids)
    if client_id not in merged:
        merged.append(client_id)
        agent.client_ids = serialize_json_string_list(merged)


def append_unique_agent_id_for_client(client: User, agent_id: str) -> None:
    """Mutate client.agent_id JSON list to include agent_id once."""
    merged = parse_json_or_csv_string_list(client.agent_id)
    if agent_id not in merged:
        merged.append(agent_id)
        client.agent_id = serialize_json_string_list(merged)


def get_agent_clients(agent_id: str) -> list[dict]:
    """
    Get all clients for a specific agent.

    Primary source: agent.client_ids on the User record.
    Fallback: any AgentConnections rows for this agent (handles data drift).
    If fallback finds clients missing from client_ids, it syncs them.

    Returns:
        List of client dictionaries including client_kind and pipeline_stage (see OpenAPI AgentClient).
    """
    try:
        agent = User.query.filter_by(id=agent_id, is_agent=True).first()
        if not agent:
            logger.warning(f"Agent {agent_id} not found or not an agent")
            return []

        client_id_list = parse_json_or_csv_string_list(agent.client_ids)

        # Fallback: check AgentConnections for clients not in client_ids
        connections = AgentConnections.query.filter_by(agent_id=agent_id).all()
        connected_client_ids = {conn.client_id for conn in connections}
        missing = connected_client_ids - set(client_id_list)

        if missing:
            logger.info(
                f"Agent {agent_id}: syncing {len(missing)} client(s) from AgentConnections into client_ids"
            )
            client_id_list.extend(missing)
            agent.client_ids = serialize_json_string_list(client_id_list)
            try:
                db.session.commit()
            except Exception:
                logger.warning("Could not auto-sync client_ids; will return merged list anyway")

        if not client_id_list:
            return []

        clients = User.query.filter(User.id.in_(client_id_list)).all()  # type: ignore[reportAttributeAccessIssue]
        by_id = {c.id: c for c in clients}
        ordered_clients = [by_id[cid] for cid in client_id_list if cid in by_id]

        ordered_ids = [c.id for c in ordered_clients]
        kind_by_id = _batch_client_kinds(ordered_ids)
        stage_by_id = _batch_pipeline_stages(ordered_ids)
        step_by_id = _batch_current_step(ordered_ids)
        avatar_url_by_id = _batch_profile_picture_urls(ordered_clients)
        signature_by_id = _batch_requires_signature(agent_id, ordered_ids)

        client_list = []
        for client in ordered_clients:
            cid = client.id
            current_phase, current_step_label = step_by_id.get(cid, ("search", None))
            client_data = {
                "id": cid,
                "name": client.name,
                "email": client.email,
                "phone": client.phone,
                "profile_picture": client.profile_picture,
                "profile_picture_url": avatar_url_by_id.get(cid),
                "created_at": client.created_at.isoformat() if client.created_at else None,
                "client_kind": kind_by_id.get(cid, "unknown"),
                "pipeline_stage": stage_by_id.get(cid, "search"),
                "current_phase": current_phase,
                "current_step_label": current_step_label,
                "requires_signature": signature_by_id.get(cid, False),
            }
            client_list.append(client_data)

        return client_list

    except Exception as e:
        logger.error(f"Error fetching clients for agent {agent_id}: {e}", exc_info=True)
        raise


def get_client_info(client_id: str) -> dict | None:
    """
    Get detailed information about a specific client

    Args:
        client_id: The ID of the client

    Returns:
        Client dictionary with details or None if not found
    """
    try:
        client = User.query.filter_by(id=client_id).first()
        if not client:
            return None

        return {
            "id": client.id,
            "name": client.name,
            "email": client.email,
            "phone": client.phone,
            "created_at": client.created_at.isoformat() if client.created_at else None,
            "is_active": client.is_active,
        }

    except Exception as e:
        logger.error(f"Error fetching client info for {client_id}: {e}", exc_info=True)
        raise


def validate_agent_client_relationship(agent_id: str, client_id: str) -> bool:
    """
    Validate that an agent-client relationship exists.

    Checks client_ids first, then falls back to AgentConnections.
    """
    return agent_may_access_client(agent_id, client_id)


def agent_may_access_client(agent_id: str, client_id: str) -> bool:
    """
    True when *client_id* is on the agent roster (User.client_ids) or linked via AgentConnections.
    """
    try:
        agent_id_s = str(agent_id).strip()
        client_id_s = str(client_id).strip()
        if not agent_id_s or not client_id_s:
            return False

        agent = User.query.filter_by(id=agent_id_s, is_agent=True).first()
        if not agent:
            return False

        roster = {str(x) for x in parse_json_or_csv_string_list(agent.client_ids)}
        if client_id_s in roster:
            return True

        return (
            AgentConnections.query.filter_by(agent_id=agent_id_s, client_id=client_id_s).first()
            is not None
        )

    except Exception as e:
        logger.error(f"Error validating agent-client relationship: {e}", exc_info=True)
        return False


def get_user_agent_id(user_id: str) -> str | None:
    """
    Get the primary agent ID for a client user.

    Checks client.agent_id first, then falls back to AgentConnections.
    """
    try:
        client = User.query.filter_by(id=user_id, is_agent=False).first()
        if not client:
            return None

        agent_ids = parse_json_or_csv_string_list(client.agent_id)
        if agent_ids:
            return agent_ids[0]

        # Fallback: check AgentConnections
        conn = AgentConnections.query.filter_by(client_id=user_id).first()
        return conn.agent_id if conn else None

    except Exception as e:
        logger.error(f"Error getting agent ID for user {user_id}: {e}", exc_info=True)
        return None


def get_connected_agent_ids_for_client(client_id: str) -> set[str]:
    """
    All agent user IDs linked to this client (accepted connections).

    Merges `users.agent_id` (JSON or CSV list) with `AgentConnections` rows.
    """
    try:
        client = User.query.filter_by(id=client_id, is_agent=False).first()
        if not client:
            return set()

        ids = set(parse_json_or_csv_string_list(client.agent_id))
        connections = AgentConnections.query.filter_by(client_id=client_id).all()
        ids |= {conn.agent_id for conn in connections if conn.agent_id}
        return ids

    except Exception as e:
        logger.error(f"Error resolving connected agents for client {client_id}: {e}", exc_info=True)
        raise


def get_agent_client_ids(agent_id: str) -> list[str]:
    """
    Get all client IDs for an agent.

    Merges client_ids from User record with AgentConnections.
    """
    try:
        agent = User.query.filter_by(id=agent_id, is_agent=True).first()
        if not agent:
            return []

        ids_from_user = set(parse_json_or_csv_string_list(agent.client_ids))
        connections = AgentConnections.query.filter_by(agent_id=agent_id).all()
        ids_from_conns = {conn.client_id for conn in connections}

        return list(ids_from_user | ids_from_conns)

    except Exception as e:
        logger.error(f"Error getting client IDs for agent {agent_id}: {e}", exc_info=True)
        return []
