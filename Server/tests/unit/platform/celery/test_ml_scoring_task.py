from unittest.mock import patch

from app.celery.tasks.ml_scoring import score_brokerage_ml_insights_task


def test_ml_scoring_task_success():
    with (
        patch.object(score_brokerage_ml_insights_task, "update_state"),
        patch(
            "app.services.brokerage.ml.scoring_service.score_brokerage_ml_insights",
            return_value={"success": True, "model_version": "sil208-v1"},
        ),
    ):
        result = score_brokerage_ml_insights_task.run("b1")
    assert result["success"] is True
