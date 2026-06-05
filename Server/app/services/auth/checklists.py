"""Timeline and close checklist persistence."""

from __future__ import annotations

from sqlalchemy import delete, select

from app import db
from app.models import TransactionTask
from app.utils.db import db_transaction


def get_checklist_ids_from_user_tasks(user_id: str, category: str) -> list[int]:
    tasks = db.session.scalars(
        select(TransactionTask).where(
            TransactionTask.user_id == str(user_id),
            TransactionTask.category == category,
        )
    ).all()
    ids: list[int] = []
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


def set_checklist_ids(user_id: str, category: str, ids: list) -> None:
    if not isinstance(ids, list):
        raise ValueError("Expected list")
    uid = str(user_id)
    with db_transaction():
        db.session.execute(
            delete(TransactionTask).where(
                TransactionTask.user_id == uid,
                TransactionTask.category == category,
            )
        )
        for i, tid in enumerate(ids):
            try:
                template_id = int(tid) if not isinstance(tid, int | float) else int(tid)
            except (TypeError, ValueError):
                continue
            db.session.add(
                TransactionTask(
                    user_id=uid,
                    category=category,
                    title=f"Item {template_id}",
                    status="done",
                    order_index=i,
                    task_metadata={"templateId": template_id},
                )
            )
