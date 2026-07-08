from __future__ import annotations

from datetime import datetime, timezone

from app.services.brokerage.ml.agent_risk_model import AgentRiskModel
from app.services.brokerage.ml.config import Sil208Config
from app.services.brokerage.ml.dropoff_model import DropoffRiskModel
from app.services.brokerage.ml.feature_store import (
    build_agent_feature_rows,
    build_monthly_volume_series,
    build_stage_feature_rows,
)
from app.services.brokerage.ml.seasonal_forecast import SeasonalVolumeForecaster


def _stage_label(row: dict) -> int:
    return int(row["drop_off_percent"] >= 20 or row["avg_days_in_stage"] >= 14)


def _agent_label(row: dict) -> int:
    return int(
        row["stalled_deals"] >= 2
        or row["avg_days_since_update"] >= 14
        or row["stage_dropoff_rate"] >= 0.30
    )


def score_brokerage_ml_insights(brokerage_org_id: str) -> dict:
    cfg = Sil208Config()

    stage_rows = build_stage_feature_rows(brokerage_org_id)
    agent_rows = build_agent_feature_rows(brokerage_org_id)
    monthly_counts = build_monthly_volume_series(brokerage_org_id)

    if len(stage_rows) < 2 or len(agent_rows) < 5:
        return {
            "success": False,
            "error": "insufficient_feature_rows",
            "brokerage_org_id": brokerage_org_id,
        }

    if len(monthly_counts) < 12:
        return {
            "success": False,
            "error": "insufficient_monthly_history",
            "brokerage_org_id": brokerage_org_id,
        }

    stage_labels = [_stage_label(r) for r in stage_rows]
    agent_labels = [_agent_label(r) for r in agent_rows]

    dropoff_model = DropoffRiskModel(cfg)
    agent_model = AgentRiskModel(cfg)
    forecast_model = SeasonalVolumeForecaster(cfg)

    dropoff_metrics = dropoff_model.fit(stage_rows, stage_labels)
    agent_metrics = agent_model.fit(agent_rows, agent_labels)
    forecast_metrics = forecast_model.fit(monthly_counts)

    scored_agents = agent_model.score_rows(agent_rows)
    at_risk_agents = [a for a in scored_agents if a["at_risk"]][:25]

    return {
        "success": True,
        "brokerage_org_id": brokerage_org_id,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "model_version": cfg.model_version,
        "data_coverage": {
            "stages": len(stage_rows),
            "agents": len(agent_rows),
            "months": len(monthly_counts),
        },
        "metrics": {
            "dropoff": dropoff_metrics,
            "agent_risk": agent_metrics,
            "forecast": forecast_metrics,
        },
        "stage_dropoff_risks": dropoff_model.score_rows(stage_rows),
        "at_risk_agents": at_risk_agents,
        "seasonal_forecast": forecast_model.forecast(monthly_counts),
    }
