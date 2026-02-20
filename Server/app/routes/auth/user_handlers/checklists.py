"""Timeline and close checklist handlers."""

from __future__ import annotations

from typing import TYPE_CHECKING

from flask import Response, current_app, jsonify, request

from app import db
from app.models import TransactionTask
from app.utils.common_patterns import require_authenticated_user, safe_json_loads

if TYPE_CHECKING:
    from app.models.user import User

CLOSE_CHECKLIST_CATEGORIES = frozenset({"escrow", "financing", "closing", "insurance"})
_LEGACY_CHECKLIST_COLUMN = {
    "timeline": "timeline_checklist",
    "escrow": "escrow_checklist",
    "financing": "financing_checklist",
    "closing": "closing_checklist",
    "insurance": "insurance_checklist",
}


def _parse_checklist(raw_value):
    if not raw_value:
        return []
    parsed = safe_json_loads(raw_value, default=None)
    if parsed is not None:
        return parsed if isinstance(parsed, list) else []
    return [item.strip() for item in raw_value.split(",") if item.strip()]


def _build_response(checklist):
    return jsonify({"success": True, "data": checklist})


def _get_checklist_ids_from_user_tasks(user_id, category):
    tasks = TransactionTask.query.filter_by(user_id=str(user_id), category=category).all()
    ids = []
    for t in tasks:
        if t.status != "done":
            continue
        meta = t.task_metadata or {}
        tid = meta.get("templateId")
        if tid is not None:
            try:
                ids.append(int(tid))
            except (TypeError, ValueError):
                pass
        elif t.order_index is not None:
            ids.append(int(t.order_index))
    return sorted(ids)


def _get_checklist_ids_legacy(user, category):
    col = _LEGACY_CHECKLIST_COLUMN.get(category)
    if not col or not hasattr(user, col):
        return []
    raw = getattr(user, col, None)
    parsed = _parse_checklist(raw)
    result = []
    for x in parsed:
        try:
            result.append(int(x) if not isinstance(x, int | float) else int(x))
        except (TypeError, ValueError):
            pass
    return sorted(result)


def _get_checklist_ids(user, category):
    user_id = str(user.id)
    tasks = TransactionTask.query.filter_by(user_id=user_id, category=category).all()
    if tasks:
        return _get_checklist_ids_from_user_tasks(user_id, category)
    return _get_checklist_ids_legacy(user, category)


def _set_checklist_ids(user_id, category, ids):
    if not isinstance(ids, list):
        raise ValueError("Expected list")
    user_id = str(user_id)
    TransactionTask.query.filter_by(user_id=user_id, category=category).delete()
    for i, tid in enumerate(ids):
        try:
            template_id = int(tid) if not isinstance(tid, int | float) else int(tid)
        except (TypeError, ValueError):
            continue
        db.session.add(
            TransactionTask(
                user_id=user_id,
                category=category,
                title=f"Item {template_id}",
                status="done",
                order_index=i,
                task_metadata={"templateId": template_id},
            )
        )
    db.session.commit()


@require_authenticated_user
def timeline_checklist(user: User) -> Response | tuple[Response, int]:
    category = "timeline"
    if request.method == "GET":
        checklist = _get_checklist_ids(user, category)
        return _build_response(checklist)
    try:
        data = request.get_json(force=True)
        if not isinstance(data, list):
            return jsonify({"success": False, "error": "Expected JSON array"}), 400
        _set_checklist_ids(user.id, category, data)
        return _build_response(data)
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        current_app.logger.error("Failed to update timeline checklist: %s", e)
        return jsonify({"success": False, "error": "Server error"}), 500


@require_authenticated_user
def close_checklist(user: User) -> Response | tuple[Response, int]:
    """Consolidated Close checklist endpoint - handles escrow, financing, closing, and insurance checklists."""
    checklist_type = request.args.get("type", "escrow")
    if checklist_type not in CLOSE_CHECKLIST_CATEGORIES:
        return jsonify({"success": False, "error": "Invalid checklist type"}), 400
    if request.method == "GET":
        checklist = _get_checklist_ids(user, checklist_type)
        return _build_response(checklist)
    try:
        data = request.get_json(force=True)
        if not isinstance(data, list):
            return jsonify({"success": False, "error": "Expected JSON array"}), 400
        _set_checklist_ids(user.id, checklist_type, data)
        return _build_response(data)
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        current_app.logger.error("Failed to update %s checklist: %s", checklist_type, e)
        return jsonify({"success": False, "error": "Server error"}), 500
