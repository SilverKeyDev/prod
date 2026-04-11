"""Agent/client scoping and safe JSON helpers used across routes."""

import json

from flask import jsonify, request


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

    client_ids = safe_json_loads(user.client_ids, default=[])
    if not isinstance(client_ids, list):
        client_ids = []
    allowed = {str(x) for x in client_ids}
    cid_s = str(cid)
    if cid_s not in allowed:
        return None, (
            jsonify({"success": False, "error": "Client not assigned to this agent"}),
            403,
        )

    return cid_s, None


def safe_json_loads(value, default=None):
    """
    Safely parse JSON string or return default value.
    Handles string parsing, type checking, and error cases.

    Args:
        value: Value to parse (string, dict, list, or None)
        default: Default value to return if parsing fails or value is None/empty

    Returns:
        Parsed JSON value or default
    """
    if not value:
        return default

    # If already a dict or list, return as-is
    if isinstance(value, dict | list):
        return value

    # If not a string, return default
    if not isinstance(value, str):
        return default

    # Try to parse JSON string
    try:
        return json.loads(value)
    except (json.JSONDecodeError, TypeError, ValueError):
        return default
