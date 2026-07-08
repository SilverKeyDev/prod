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


def _balanced_binary_labels(risk_scores: list[float]) -> list[int]:
    """Ensure at least two classes for sklearn when proxy labels collapse."""
    if not risk_scores:
        return []

    labels = [0] * len(risk_scores)
    if len(risk_scores) == 1:
        return labels

    ranked = sorted(range(len(risk_scores)), key=lambda idx: risk_scores[idx], reverse=True)
    top_n = max(1, len(risk_scores) // 2)
    for idx in ranked[:top_n]:
        labels[idx] = 1
    return labels


def _stage_label_rows(stage_rows: list[dict]) -> list[int]:
    risk_scores = [
        float(row["drop_off_percent"]) + (float(row["avg_days_in_stage"]) / 30.0)
        for row in stage_rows
    ]
    proxy = [
        int(row["drop_off_percent"] >= 15 or row["avg_days_in_stage"] >= 120) for row in stage_rows
    ]
    if len(set(proxy)) >= 2:
        return proxy
    return _balanced_binary_labels(risk_scores)


def _agent_label_rows(agent_rows: list[dict]) -> list[int]:
    risk_scores = [
        float(row["stalled_deals"]) * 2.0
        + float(row["avg_days_since_update"]) / 30.0
        + float(row["stage_dropoff_rate"]) * 100.0
        for row in agent_rows
    ]
    proxy = [
        int(
            row["stalled_deals"] >= 2
            or row["avg_days_since_update"] >= 120
            or row["stage_dropoff_rate"] >= 0.12
        )
        for row in agent_rows
    ]
    if len(set(proxy)) >= 2:
        return proxy
    return _balanced_binary_labels(risk_scores)


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

    stage_labels = _stage_label_rows(stage_rows)
    agent_labels = _agent_label_rows(agent_rows)

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
