"""Timeline and close checklist handlers."""

from __future__ import annotations

from typing import TYPE_CHECKING

from flask import Response, jsonify, request
from sqlalchemy import delete, select

from app import db
from app.models import TransactionTask
from app.schemas import ChecklistResponse, UpdateChecklistRequest
from app.utils.common_patterns import (
    invalid_request,
    require_authenticated_user,
    server_error,
    validation,
)
from app.utils.validation import validate_request, validate_response
from logger import log

if TYPE_CHECKING:
    from app.models.user import User

CLOSE_CHECKLIST_CATEGORIES = frozenset({"escrow", "financing", "closing", "insurance"})


def _build_response(checklist):
    return jsonify({"success": True, "data": checklist})


def _get_checklist_ids_from_user_tasks(user_id, category):
    tasks = db.session.scalars(
        select(TransactionTask).where(
            TransactionTask.user_id == str(user_id),
            TransactionTask.category == category,
        )
    ).all()
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


def _get_checklist_ids(user, category):
    user_id = str(user.id)
    return _get_checklist_ids_from_user_tasks(user_id, category)


def _set_checklist_ids(user_id, category, ids):
    if not isinstance(ids, list):
        raise ValueError("Expected list")
    user_id = str(user_id)
    db.session.execute(
        delete(TransactionTask).where(
            TransactionTask.user_id == user_id, TransactionTask.category == category
        )
    )
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


def _ids_from_put_body(data: UpdateChecklistRequest) -> list[int]:
    """Return normalized checklist ids from validated request body."""
    raw_ids = data.checklist.checkedIds or []
    out: list[int] = []
    for tid in raw_ids:
        try:
            out.append(int(tid) if not isinstance(tid, int | float) else int(tid))
        except (TypeError, ValueError):
            pass
    return out


@require_authenticated_user
def get_timeline_checklist(user: User) -> Response | tuple[Response, int]:
    category = "timeline"
    checklist = _get_checklist_ids(user, category)
    return _build_response(checklist)


@require_authenticated_user
@validate_response(ChecklistResponse)
@validate_request(UpdateChecklistRequest)
def put_timeline_checklist(
    user: User, data: UpdateChecklistRequest
) -> Response | tuple[Response, int]:
    category = "timeline"
    try:
        ids = _ids_from_put_body(data)
        _set_checklist_ids(user.id, category, ids)
        return _build_response(ids)
    except ValueError:
        return validation("Expected list")
    except Exception as e:
        log.error("AUTH", "timeline_checklist_update_failed", e)
        return server_error(e, context={"function": "put_timeline_checklist"})


@require_authenticated_user
def get_close_checklist(user: User) -> Response | tuple[Response, int]:
    checklist_type = request.args.get("type", "escrow")
    if checklist_type not in CLOSE_CHECKLIST_CATEGORIES:
        return invalid_request("Invalid checklist type")
    checklist = _get_checklist_ids(user, checklist_type)
    return _build_response(checklist)


@require_authenticated_user
@validate_response(ChecklistResponse)
@validate_request(UpdateChecklistRequest)
def put_close_checklist(
    user: User, data: UpdateChecklistRequest
) -> Response | tuple[Response, int]:
    checklist_type = request.args.get("type", "escrow")
    if checklist_type not in CLOSE_CHECKLIST_CATEGORIES:
        return invalid_request("Invalid checklist type")
    try:
        ids = _ids_from_put_body(data)
        _set_checklist_ids(user.id, checklist_type, ids)
        return _build_response(ids)
    except ValueError:
        return validation("Expected list")
    except Exception as e:
        log.error(
            "AUTH",
            "checklist_update_failed",
            {"checklist_type": checklist_type, "error": str(e)},
        )
        return server_error(e, context={"function": "put_close_checklist", "type": checklist_type})
