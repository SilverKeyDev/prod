"""Checklist category helpers."""

from app.schemas.generated import ChecklistType
from app.services.transactions.checklist_support.checklist_constants import (
    TASK_CATEGORIES,
    coerce_checklist_type,
)


def test_coerce_checklist_type_accepts_openapi_enum() -> None:
    assert coerce_checklist_type(ChecklistType.escrow) == "escrow"
    assert coerce_checklist_type(ChecklistType.escrow) in TASK_CATEGORIES


def test_coerce_checklist_type_accepts_string() -> None:
    assert coerce_checklist_type("closing") == "closing"


def test_coerce_checklist_type_defaults_when_missing() -> None:
    assert coerce_checklist_type(None) == "escrow"
