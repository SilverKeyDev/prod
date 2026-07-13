"""Score campaign engagement and produce winner / segment predictions."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.services.brokerage.campaigns.learning.campaign_loader import (
    load_campaign_for_learning,
)
from app.services.brokerage.campaigns.learning.config import Sil309Config
from app.services.brokerage.campaigns.learning.features import build_feature_rows
from app.services.brokerage.campaigns.learning.model import CampaignEngagementModel


def _winner_analysis(insights: list[dict[str, Any]], model_meta: dict[str, Any]) -> dict[str, Any]:
    if not insights:
        return {"winner_variant": None, "drivers": []}
    ranked = sorted(insights, key=lambda x: x["attach_rate"], reverse=True)
    top = ranked[0]
    runners = ranked[1:]
    drivers = []
    if runners:
        other = runners[0]
        if top["avg_subject_length"] < other["avg_subject_length"]:
            drivers.append("shorter subject outperformed")
        if top.get("incentive_framing") == "dollar_amount":
            drivers.append("dollar-amount incentive framing outperformed")
        if top.get("cta_type") == "book_time":
            drivers.append("book-time CTA outperformed soft nudge")
        if top.get("include_meet_link") and not other.get("include_meet_link"):
            drivers.append("Meet-link CTA correlated with higher attach")
    return {
        "winner_variant": top["variant"],
        "winner_attach_rate": top["attach_rate"],
        "winner_open_rate": top["open_rate"],
        "winner_click_rate": top["click_rate"],
        "drivers": drivers or ["variant-level attach rate differential"],
        "variant_insights": insights,
        "model": {
            "chosen_model": model_meta.get("chosen_model"),
            "chosen_auc": model_meta.get("chosen_auc"),
            "candidates": model_meta.get("candidates"),
            "rationale": model_meta.get("rationale"),
            "model_version": Sil309Config().model_version,
        },
    }


def _segment_predictions(scored: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not scored:
        return []
    buckets: dict[str, list[float]] = {}
    for row in scored:
        tenure = float(row.get("tenure_years") or 0)
        band = "junior" if tenure < 3 else "mid" if tenure < 8 else "senior"
        office = str(row.get("office_id") or "OFF")
        key = f"{band}|{office}"
        buckets.setdefault(key, []).append(float(row["score"]))
    segments = []
    for key, scores in buckets.items():
        band, office = key.split("|", 1)
        segments.append(
            {
                "tenure_band": band,
                "office_id": office,
                "n": len(scores),
                "mean_attach_propensity": round(sum(scores) / len(scores), 4),
            }
        )
    return sorted(segments, key=lambda s: s["mean_attach_propensity"], reverse=True)[:12]


def score_campaign_engagement(
    brokerage_org_id: str,
    campaign_id: str,
) -> dict[str, Any]:
    loaded = load_campaign_for_learning(brokerage_org_id, campaign_id)
    if not loaded.get("success"):
        return loaded

    campaign = loaded["campaign"]
    rows = build_feature_rows(campaign)
    model = CampaignEngagementModel()
    meta = model.select_and_fit(rows)
    if not meta.get("success"):
        return {
            "success": False,
            "error": meta.get("error", "model_fit_failed"),
            "brokerage_org_id": brokerage_org_id,
            "campaign_id": campaign_id,
        }

    insights = model.feature_insights(rows)
    scored = model.score_rows(rows)
    winner = _winner_analysis(insights, meta)

    return {
        "success": True,
        "brokerage_org_id": brokerage_org_id,
        "campaign_id": campaign_id,
        "campaign_name": campaign.get("name"),
        "goal_metric": campaign.get("goal_metric"),
        "data_source": loaded.get("source"),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "model_version": Sil309Config().model_version,
        "winner_analysis": winner,
        "segment_predictions": _segment_predictions(scored),
        "scored_recipients_sample": scored[:15],
        "metrics": meta,
    }
