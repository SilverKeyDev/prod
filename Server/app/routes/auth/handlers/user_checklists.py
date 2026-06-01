"""Timeline and close checklist handlers."""

from __future__ import annotations

from typing import TYPE_CHECKING

from flask import Response, current_app, jsonify, request

from app import db
from app.models import TransactionTask
from app.schemas import ChecklistResponse, UpdateChecklistRequest
from app.utils.common_patterns import require_authenticated_user, safe_json_loads
from app.utils.validation import validate_request, validate_response

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


def _ids_from_put_body(data: UpdateChecklistRequest | None) -> list[int] | None:
    """Return normalized checklist ids, or None if the body cannot be interpreted."""
    if data is not None:
        raw_ids = data.checklist.checkedIds or []
        out: list[int] = []
        for tid in raw_ids:
            try:
                out.append(int(tid) if not isinstance(tid, int | float) else int(tid))
            except (TypeError, ValueError):
                pass
        return out
    raw = request.get_json(silent=True)
    if isinstance(raw, list):
        out = []
        for x in raw:
            try:
                out.append(int(x) if not isinstance(x, int | float) else int(x))
            except (TypeError, ValueError):
                pass
        return out
    return None


@require_authenticated_user
def get_timeline_checklist(user: User) -> Response | tuple[Response, int]:
    category = "timeline"
    checklist = _get_checklist_ids(user, category)
    return _build_response(checklist)


@require_authenticated_user
@validate_response(ChecklistResponse)
@validate_request(UpdateChecklistRequest)
def put_timeline_checklist(
    user: User, data: UpdateChecklistRequest | None = None
) -> Response | tuple[Response, int]:
    category = "timeline"
    try:
        ids = _ids_from_put_body(data)
        if ids is None:
            return jsonify({"success": False, "error": "Expected JSON array"}), 400
        _set_checklist_ids(user.id, category, ids)
        return _build_response(ids)
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        current_app.logger.error("Failed to update timeline checklist: %s", e)
        return jsonify({"success": False, "error": "Server error"}), 500


@require_authenticated_user
def get_close_checklist(user: User) -> Response | tuple[Response, int]:
    checklist_type = request.args.get("type", "escrow")
    if checklist_type not in CLOSE_CHECKLIST_CATEGORIES:
        return jsonify({"success": False, "error": "Invalid checklist type"}), 400
    checklist = _get_checklist_ids(user, checklist_type)
    return _build_response(checklist)


@require_authenticated_user
@validate_response(ChecklistResponse)
@validate_request(UpdateChecklistRequest)
def put_close_checklist(
    user: User, data: UpdateChecklistRequest | None = None
) -> Response | tuple[Response, int]:
    checklist_type = request.args.get("type", "escrow")
    if checklist_type not in CLOSE_CHECKLIST_CATEGORIES:
        return jsonify({"success": False, "error": "Invalid checklist type"}), 400
    try:
        ids = _ids_from_put_body(data)
        if ids is None:
            return jsonify({"success": False, "error": "Expected JSON array"}), 400
        _set_checklist_ids(user.id, checklist_type, ids)
        return _build_response(ids)
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        current_app.logger.error("Failed to update %s checklist: %s", checklist_type, e)
        return jsonify({"success": False, "error": "Server error"}), 500
