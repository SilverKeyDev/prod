"""Unit tests for property research Celery tasks."""

from __future__ import annotations

import os
from unittest.mock import patch

from app.celery.tasks.property_research import compare_property_task, research_property_task


def test_research_property_task_returns_config_error_when_env_missing():
    with patch.dict(
        os.environ,
        {"GOOGLE_MAPS_API_KEY": "", "SLIPSTREAM_PRIVATE": ""},
        clear=False,
    ):
        with patch.object(research_property_task, "update_state"):
            result = research_property_task.run({"address": "123 Main St"})
    assert result["success"] is False
    assert result["status_code"] == 503
    assert "GOOGLE_MAPS_API_KEY" in result["error"]


def test_research_property_task_success_with_mocked_pipeline():
    pipeline_response = ({"success": True, "data": {"address": "123 Main St"}}, 200)
    with (
        patch.object(research_property_task, "update_state"),
        patch(
            "app.services.research.property.property_research_pipeline.handle_property_request_non_streaming",
            return_value=pipeline_response,
        ),
    ):
        result = research_property_task.run(
            {"address": "123 Main St"},
            address="123 Main St",
        )
    assert result["success"] is True
    assert result["status_code"] == 200
    assert result["response_data"]["success"] is True


def test_compare_property_task_passes_skip_pros_cons_to_pipeline():
    with (
        patch.object(compare_property_task, "update_state"),
        patch(
            "app.services.research.property.property_research_pipeline.handle_property_request_non_streaming",
            return_value=({"success": True}, 200),
        ) as mock_pipeline,
    ):
        compare_property_task.run({"address": "456 Oak Ave"})
    assert mock_pipeline.call_args.kwargs["skip_pros_cons"] is True


def test_research_property_task_handles_pipeline_exception():
    with (
        patch.object(research_property_task, "update_state"),
        patch(
            "app.services.research.property.property_research_pipeline.handle_property_request_non_streaming",
            side_effect=RuntimeError("pipeline failed"),
        ),
    ):
        result = research_property_task.run({"address": "123 Main St"})
    assert result["success"] is False
    assert result["status_code"] == 500
    assert "pipeline failed" in result["error"]
