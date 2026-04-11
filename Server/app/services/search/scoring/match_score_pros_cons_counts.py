"""
Match-score-aligned pros/cons counts for property highlights (same MCDA as search ranking).
"""

from __future__ import annotations

import logging
from typing import Any

from app.services.search.home_matching.mcda.score import get_mcda_config, score_listing_mcda

from .research_preferences_context import (
    ResearchAnalysisOptions,
    compute_analysis_cache_signature,
)

logger = logging.getLogger(__name__)


def infer_status_type_from_listing(data: dict[str, Any]) -> str:
    ls = str(data.get("listingStatus") or data.get("listing_status") or "").strip().lower()
    if "rent" in ls or "lease" in ls or "rental" in ls:
        return "ForRent"
    return "ForSale"


def compute_listing_match_score(
    preferences: dict[str, Any],
    data: dict[str, Any],
    *,
    config: dict[str, Any] | None = None,
) -> float | None:
    """Return MCDA display score for listing + preferences, or None if scoring fails."""
    if not isinstance(preferences, dict) or not isinstance(data, dict):
        return None
    try:
        st = infer_status_type_from_listing(data)
        return score_listing_mcda(preferences, data, status_type=st, config=config)
    except Exception:
        logger.debug("compute_listing_match_score failed", exc_info=True)
        return None


def adjust_pros_cons_counts(
    base_pros: int,
    base_cons: int,
    score: float,
    score_lo: float,
    score_hi: float,
) -> tuple[int, int]:
    """
    Keep total bullets (pros + cons) equal to base_pros + base_cons (clamped),
    split by normalized match score: high score → more pros; low → more cons.
    Each side stays in [1, 6].
    """
    bp = max(1, min(6, int(base_pros)))
    bc = max(1, min(6, int(base_cons)))
    total = max(2, min(12, bp + bc))

    if score_hi <= score_lo:
        t = 0.5
    else:
        t = max(0.0, min(1.0, (float(score) - score_lo) / (score_hi - score_lo)))

    ideal_pros = 1.0 + (total - 2) * t

    best_pros, best_cons = bp, bc
    best_dist = 1e9
    best_tie = 1e9

    for pros in range(1, min(6, total - 1) + 1):
        cons = total - pros
        if cons < 1 or cons > 6:
            continue
        dist = abs(float(pros) - ideal_pros)
        tie = abs(pros - bp) + abs(cons - bc)
        if dist < best_dist or (dist == best_dist and tie < best_tie):
            best_dist = dist
            best_tie = tie
            best_pros, best_cons = pros, cons

    return best_pros, best_cons


def resolve_highlights_counts_and_signature(
    analysis_options: ResearchAnalysisOptions,
    data: dict[str, Any],
) -> tuple[int, int, str, float | None]:
    """
    Adjust pros/cons counts from MCDA score and build cache signature for those counts.
    """
    cfg = get_mcda_config()
    lo = float(cfg["output_display_min"])
    hi = float(cfg["output_display_max"])
    mscore = compute_listing_match_score(analysis_options.preferences, data, config=cfg)
    if mscore is None:
        adj_p = analysis_options.pros_count
        adj_c = analysis_options.cons_count
    else:
        adj_p, adj_c = adjust_pros_cons_counts(
            analysis_options.pros_count,
            analysis_options.cons_count,
            mscore,
            lo,
            hi,
        )
    sig = compute_analysis_cache_signature(
        analysis_options.preferences_user_id,
        analysis_options.profile_subject,
        analysis_options.viewer_is_agent,
        adj_p,
        adj_c,
        analysis_options.bullet_style,
    )
    return adj_p, adj_c, sig, mscore


def highlights_context_payload(match_score: float | None) -> dict[str, Any] | None:
    """Public metadata for clients (non-underscore key on property_analysis)."""
    if match_score is None:
        return None
    cfg = get_mcda_config()
    return {
        "matchScore": match_score,
        "scoreScaleMin": float(cfg["output_display_min"]),
        "scoreScaleMax": float(cfg["output_display_max"]),
    }
