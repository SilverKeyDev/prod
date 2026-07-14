"""One-click campaign learning loop — SIL-309 acceptance path.

Produces: winner analysis + what-worked review + drafted next variant pair.
Persists result for dashboard replay. Drafts always require human approval.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.services.brokerage.campaigns.learning.campaign_loader import (
    load_campaign_for_learning,
)
from app.services.brokerage.campaigns.learning.meet_link import (
    apply_meet_option_to_draft_variant,
)
from app.services.brokerage.campaigns.learning.perplexity_loop import (
    draft_next_variants,
    review_campaign,
)
from app.services.brokerage.campaigns.learning.scoring_service import (
    score_campaign_engagement,
)
from app.services.brokerage.campaigns.learning_artifacts import save_learning_result
from logger import log


def run_campaign_learning_loop(
    brokerage_org_id: str,
    campaign_id: str,
    *,
    skip_perplexity: bool = False,
) -> dict[str, Any]:
    loaded = load_campaign_for_learning(brokerage_org_id, campaign_id)
    if not loaded.get("success"):
        return loaded

    campaign = loaded["campaign"]
    scoring = score_campaign_engagement(brokerage_org_id, campaign_id)
    if not scoring.get("success"):
        return scoring

    winner_analysis = scoring["winner_analysis"]

    if skip_perplexity:
        from app.services.brokerage.campaigns.learning import perplexity_loop as pl

        review = pl._fallback_review(winner_analysis, campaign)
        draft = pl._fallback_draft(winner_analysis, campaign, review)
        review["source"] = "forced_fallback"
        draft["source"] = "forced_fallback"
    else:
        review = review_campaign(campaign, winner_analysis)
        draft = draft_next_variants(campaign, winner_analysis, review)

    draft_variants = [apply_meet_option_to_draft_variant(v) for v in draft.get("variants", [])]
    draft = {
        **draft,
        "variants": draft_variants,
        "approval_required": True,
        "status": "pending_approval",
    }

    payload = {
        "success": True,
        "brokerage_org_id": brokerage_org_id,
        "campaign_id": campaign_id,
        "campaign_name": campaign.get("name"),
        "data_source": loaded.get("source"),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "winner_analysis": winner_analysis,
        "segment_predictions": scoring.get("segment_predictions"),
        "model_metrics": scoring.get("metrics"),
        "review": review,
        "next_iteration_draft": draft,
        "guardrails": {
            "auto_send": False,
            "approval_required": True,
            "pii_in_prompts": False,
            "cpu_only": True,
        },
    }
    save_learning_result(campaign_id, payload)
    log.info(
        "API",
        "SIL-309 learning loop complete",
        {
            "campaign_id": campaign_id,
            "data_source": loaded.get("source"),
            "chosen_model": (scoring.get("metrics") or {}).get("chosen_model"),
            "draft_source": draft.get("source"),
            "review_source": review.get("source"),
        },
    )
    return payload
