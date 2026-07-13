"""Unit tests for SIL-309 campaign learning loop (JSON seed path)."""

from __future__ import annotations

from app.services.brokerage.campaigns.learning.features import build_feature_rows
from app.services.brokerage.campaigns.learning.learning_loop import (
    run_campaign_learning_loop,
)
from app.services.brokerage.campaigns.learning.model import CampaignEngagementModel
from app.services.brokerage.campaigns.learning.scoring_service import (
    score_campaign_engagement,
)
from app.services.brokerage.campaigns.learning_artifacts import (
    get_json_campaign,
    load_json_campaign_store,
)
from app.services.brokerage.constants import DEFAULT_BROKERAGE_ORG_ID

TITLE_CAMPAIGN = "camp-title-q1-2026"


def test_json_campaign_seed_loads_two_completed_campaigns():
    store = load_json_campaign_store(force_reload=True)
    assert store["brokerage_org_id"] == DEFAULT_BROKERAGE_ORG_ID
    assert len(store["campaigns"]) == 2
    assert get_json_campaign(TITLE_CAMPAIGN) is not None


def test_engagement_model_picks_a_candidate():
    campaign = get_json_campaign(TITLE_CAMPAIGN)
    assert campaign is not None
    rows = build_feature_rows(campaign)
    model = CampaignEngagementModel()
    meta = model.select_and_fit(rows)
    assert meta["success"] is True
    assert meta["chosen_model"] in {
        "logistic_regression",
        "hist_gradient_boosting",
        "torch_mlp",
    }
    assert meta["chosen_auc"] >= 0.5


def test_score_campaign_engagement_shape():
    result = score_campaign_engagement(DEFAULT_BROKERAGE_ORG_ID, TITLE_CAMPAIGN)
    assert result["success"] is True
    assert result["data_source"] == "json"
    assert result["winner_analysis"]["winner_variant"] in ("A", "B")
    assert result["winner_analysis"]["drivers"]
    assert isinstance(result["segment_predictions"], list)


def test_learning_loop_one_click_offline():
    result = run_campaign_learning_loop(
        DEFAULT_BROKERAGE_ORG_ID,
        TITLE_CAMPAIGN,
        skip_perplexity=True,
    )
    assert result["success"] is True
    assert result["winner_analysis"]["winner_variant"]
    assert result["review"]["what_worked"]
    assert result["review"]["what_did_not_work"]
    draft = result["next_iteration_draft"]
    assert draft["approval_required"] is True
    assert draft["status"] == "pending_approval"
    assert len(draft["variants"]) == 2
    assert result["guardrails"]["auto_send"] is False
    assert result["guardrails"]["pii_in_prompts"] is False


def test_title_campaign_variant_b_wins_attach():
    """SIL-308 story: Title Q1 — variant B wins clearly on JSON seed."""
    campaign = get_json_campaign(TITLE_CAMPAIGN)
    assert campaign is not None
    rows = build_feature_rows(campaign)
    a = [r for r in rows if r["variant"] == "A"]
    b = [r for r in rows if r["variant"] == "B"]
    a_rate = sum(r["attached"] for r in a) / max(len(a), 1)
    b_rate = sum(r["attached"] for r in b) / max(len(b), 1)
    assert b_rate > a_rate
