"""Resolve agent-scoped target user IDs for favorites, documents, etc."""

from flask import jsonify, request

from app.services.agent.client_service import agent_may_access_client


def resolve_agent_scoped_user_id(user, json_body: dict | None = None):
    """
    Resolve which user's favorites/documents to read or mutate.

    Optional ``client_id`` may be supplied as a query param (e.g. GET) or in
    ``json_body`` (e.g. POST). Non-agents cannot pass ``client_id``. Agents may
    only use IDs present in their ``client_ids`` roster.

    Returns:
        (target_user_id, None) on success, or
        (None, (jsonify_response, http_status)) on authorization / validation error.
    """
    cid = request.args.get("client_id")
    if cid is not None and isinstance(cid, str):
        cid = cid.strip()
    if not cid:
        cid = None
    if cid is None and isinstance(json_body, dict):
        raw = json_body.get("client_id")
        if raw is not None and str(raw).strip():
            cid = str(raw).strip()

    if not cid:
        return str(user.id), None

    if not getattr(user, "is_agent", False):
        return None, (
            jsonify({"success": False, "error": "Only agents can act on behalf of another user"}),
            403,
        )

    cid_s = str(cid)
    if not agent_may_access_client(str(user.id), cid_s):
        return None, (
            jsonify({"success": False, "error": "Client not assigned to this agent"}),
            403,
        )

    return cid_s, None
