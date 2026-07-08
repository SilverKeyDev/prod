from unittest.mock import patch

from app.services.brokerage.ml.scoring_service import score_brokerage_ml_insights


def test_sil208_scoring_shape_with_mocked_feature_store():
    with (
        patch(
            "app.services.brokerage.ml.scoring_service.build_stage_feature_rows",
            return_value=[
                {"stage": "search", "count": 100, "drop_off_percent": 0, "avg_days_in_stage": 5.0},
                {"stage": "tour", "count": 70, "drop_off_percent": 30, "avg_days_in_stage": 12.0},
                {"stage": "offer", "count": 50, "drop_off_percent": 29, "avg_days_in_stage": 15.0},
                {
                    "stage": "contract",
                    "count": 40,
                    "drop_off_percent": 20,
                    "avg_days_in_stage": 18.0,
                },
                {"stage": "closing", "count": 30, "drop_off_percent": 25, "avg_days_in_stage": 9.0},
            ],
        ),
        patch(
            "app.services.brokerage.ml.scoring_service.build_agent_feature_rows",
            return_value=[
                {
                    "agent_id": f"a{i}",
                    "open_deals": 5,
                    "stalled_deals": i % 3,
                    "avg_days_since_update": 10 + i,
                    "stage_dropoff_rate": 0.1 + i * 0.02,
                }
                for i in range(15)
            ],
        ),
        patch(
            "app.services.brokerage.ml.scoring_service.build_monthly_volume_series",
            return_value={f"2025-{m:02d}": 50 + m for m in range(1, 13)}
            | {f"2026-{m:02d}": 60 + m for m in range(1, 7)},
        ),
    ):
        result = score_brokerage_ml_insights("b1")

    assert result["success"] is True
    assert "metrics" in result
    assert "dropoff" in result["metrics"]
    assert "agent_risk" in result["metrics"]
    assert "forecast" in result["metrics"]
    assert len(result["seasonal_forecast"]) == 6


def test_sil208_insufficient_months_returns_error():
    with (
        patch(
            "app.services.brokerage.ml.scoring_service.build_stage_feature_rows",
            return_value=[
                {"stage": "search", "count": 100, "drop_off_percent": 0, "avg_days_in_stage": 5.0},
                {"stage": "tour", "count": 70, "drop_off_percent": 30, "avg_days_in_stage": 12.0},
            ],
        ),
        patch(
            "app.services.brokerage.ml.scoring_service.build_agent_feature_rows",
            return_value=[
                {
                    "agent_id": f"a{i}",
                    "open_deals": 4,
                    "stalled_deals": 1,
                    "avg_days_since_update": 8.0,
                    "stage_dropoff_rate": 0.2,
                }
                for i in range(10)
            ],
        ),
        patch(
            "app.services.brokerage.ml.scoring_service.build_monthly_volume_series",
            return_value={"2026-01": 30, "2026-02": 28},
        ),
    ):
        result = score_brokerage_ml_insights("b1")

    assert result["success"] is False
    assert result["error"] == "insufficient_monthly_history"
