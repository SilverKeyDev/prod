"""Unit tests for unified task checklist progress summary."""

from __future__ import annotations

from unittest.mock import patch

import pytest


@pytest.mark.unit
def test_build_task_checklist_progress_summary_aggregates_sections(app) -> None:
    with app.app_context():
        from app.services.transactions.unified_task_checklist_progress_summary import (
            build_task_checklist_progress_summary,
        )

        def fake_build(subject_user_id: str, checklist_type: str) -> dict | None:
            assert subject_user_id == "buyer-1"
            counts = {
                "search": (2, 5),
                "offer": (1, 3),
                "escrow": (0, 4),
                "financing": (4, 4),
                "closing": (0, 2),
                "insurance": (1, 1),
            }
            if checklist_type not in counts:
                return None
            completed, total = counts[checklist_type]
            return {
                "items": [{}] * total,
                "checkedIds": list(range(completed)),
            }

        with patch(
            "app.services.transactions.unified_task_checklist_progress_summary.build_task_checklist_data",
            side_effect=fake_build,
        ):
            summary = build_task_checklist_progress_summary("buyer-1")

        assert summary["sections"]["search"] == {
            "completed": 2,
            "total": 5,
            "isComplete": False,
        }
        assert summary["sections"]["financing"]["isComplete"] is True
        assert summary["sections"]["insurance"]["isComplete"] is True
        assert summary["overall"] == {"completed": 8, "total": 19, "percent": 42}
