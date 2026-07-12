from unittest.mock import patch

from app.services.brokerage.analytics import BrokerageAnalyticsFilters, get_timing_analytics
from app.services.brokerage.ml.feature_store import densify_monthly_counts
from app.services.brokerage.ml.scoring_service import score_brokerage_ml_insights
from app.services.brokerage.ml.seasonal_forecast import SeasonalVolumeForecaster


def _mock_feature_sets():
    return (
        [
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
        [
            {
                "agent_id": f"a{i}",
                "open_deals": 5,
                "stalled_deals": i % 3,
                "avg_days_since_update": 10 + i,
                "stage_dropoff_rate": 0.1 + i * 0.02,
            }
            for i in range(15)
        ],
        {f"2025-{m:02d}": 50 + m for m in range(1, 13)}
        | {f"2026-{m:02d}": 60 + m for m in range(1, 7)},
    )


def test_sil208_scoring_shape_with_mocked_feature_store():
    with patch(
        "app.services.brokerage.ml.scoring_service.build_feature_sets",
        return_value=_mock_feature_sets(),
    ):
        result = score_brokerage_ml_insights("b1")

    assert result["success"] is True
    assert "metrics" in result
    assert "dropoff" in result["metrics"]
    assert "agent_risk" in result["metrics"]
    assert "forecast" in result["metrics"]
    assert len(result["seasonal_forecast"]) == 6


def test_sil208_insufficient_months_returns_error():
    with patch(
        "app.services.brokerage.ml.scoring_service.build_feature_sets",
        return_value=(
            [
                {"stage": "search", "count": 100, "drop_off_percent": 0, "avg_days_in_stage": 5.0},
                {"stage": "tour", "count": 70, "drop_off_percent": 30, "avg_days_in_stage": 12.0},
            ],
            [
                {
                    "agent_id": f"a{i}",
                    "open_deals": 4,
                    "stalled_deals": 1,
                    "avg_days_since_update": 8.0,
                    "stage_dropoff_rate": 0.2,
                }
                for i in range(10)
            ],
            {"2026-01": 30, "2026-02": 28},
        ),
    ):
        result = score_brokerage_ml_insights("b1")

    assert result["success"] is False
    assert result["error"] == "insufficient_monthly_history"


def test_densify_monthly_counts_fills_gaps_with_zero():
    sparse = {"2025-01": 10, "2025-03": 12, "2025-05": 8}
    dense = densify_monthly_counts(sparse)

    assert list(dense.keys()) == ["2025-01", "2025-02", "2025-03", "2025-04", "2025-05"]
    assert dense["2025-02"] == 0
    assert dense["2025-04"] == 0
    assert len(dense) == 5


def test_seasonal_forecast_clamps_negative_predictions():
    forecaster = SeasonalVolumeForecaster()
    decreasing = {f"2025-{m:02d}": max(0, 120 - m * 10) for m in range(1, 13)}
    forecaster.fit(decreasing)
    forecast = forecaster.forecast(decreasing, horizon=3)

    assert forecast
    for row in forecast:
        assert row["predicted_count"] >= 0
        assert row["lower"] >= 0
        assert row["upper"] >= 0


def test_timing_analytics_returns_success_for_insufficient_ml_history(app):
    with (
        patch(
            "app.services.brokerage.analytics.db.session.scalar",
            return_value=object(),
        ),
        patch(
            "app.services.brokerage.analytics.score_brokerage_ml_insights",
            return_value={"success": False, "error": "insufficient_monthly_history"},
        ),
    ):
        with app.app_context():
            result = get_timing_analytics(BrokerageAnalyticsFilters(brokerage_org_id="b1"))

    assert result["success"] is True
    assert result["seasonal_volume"] == []
    assert result["peak_weeks"] == []
    assert result["forecast_note"] == "Not enough historical data for ML forecast"
    assert result["ml"] == {"status": "insufficient_monthly_history"}


def test_build_feature_sets_loads_transactions_once():
    with (
        patch(
            "app.services.brokerage.ml.feature_store.load_brokerage_transactions",
            return_value=[],
        ) as load_mock,
        patch(
            "app.services.brokerage.ml.feature_store.build_stage_feature_rows_from_transactions",
            return_value=[],
        ),
        patch(
            "app.services.brokerage.ml.feature_store.build_agent_feature_rows_from_transactions",
            return_value=[],
        ),
        patch(
            "app.services.brokerage.ml.feature_store.build_monthly_volume_series_from_transactions",
            return_value={},
        ),
    ):
        from app.services.brokerage.ml.feature_store import build_feature_sets

        build_feature_sets("b1")

    load_mock.assert_called_once_with("b1")
