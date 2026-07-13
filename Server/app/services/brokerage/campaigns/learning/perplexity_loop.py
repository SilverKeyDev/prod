"""Perplexity draft + review for campaign learning loop (SIL-309).

Guardrails:
- Aggregate stats + variant copy only — no agent PII in prompts
- Drafts are suggestions (approval_required=True) — never auto-send
- Demo-safe cached fallback when Perplexity is down / key missing
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import requests

from app.config.llm_models import perplexity_model_analysis
from app.services.brokerage.campaigns.paths import LEARNING_CACHE_DIR
from app.services.research.perplexity.perplexity_analysis import _safe_parse_json
from app.services.research.perplexity.perplexity_config import (
    PERPLEXITY_API_KEY,
    PERPLEXITY_HEADERS,
    PERPLEXITY_URL,
)
from logger import log

_TIMEOUT_S = 45


def _cache_path(kind: str, campaign_id: str) -> Path:
    LEARNING_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    return LEARNING_CACHE_DIR / f"{campaign_id}_{kind}.json"


def _load_cache(kind: str, campaign_id: str) -> dict[str, Any] | None:
    path = _cache_path(kind, campaign_id)
    if not path.is_file():
        return None
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


def _save_cache(kind: str, campaign_id: str, payload: dict[str, Any]) -> None:
    path = _cache_path(kind, campaign_id)
    with path.open("w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2)
        fh.write("\n")


def _call_perplexity(system: str, user: str) -> dict[str, Any] | None:
    if not PERPLEXITY_API_KEY or not PERPLEXITY_HEADERS:
        log.warn("API", "SIL-309 Perplexity key missing; using cache fallback", {})
        return None
    payload = {
        "model": perplexity_model_analysis(),
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": 0.3,
    }
    try:
        resp = requests.post(
            PERPLEXITY_URL,
            headers=PERPLEXITY_HEADERS,
            json=payload,
            timeout=_TIMEOUT_S,
        )
        resp.raise_for_status()
        data = resp.json()
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        parsed = _safe_parse_json(content, default=None)
        if isinstance(parsed, dict):
            return parsed
        log.warn("API", "SIL-309 Perplexity returned non-JSON", {"preview": str(content)[:200]})
        return None
    except Exception as exc:  # noqa: BLE001
        log.warn("API", "SIL-309 Perplexity call failed", {"error": str(exc)})
        return None


def _fallback_review(winner_analysis: dict[str, Any], campaign: dict[str, Any]) -> dict[str, Any]:
    drivers = winner_analysis.get("drivers") or []
    winner = winner_analysis.get("winner_variant")
    return {
        "source": "cached_fallback",
        "what_worked": drivers
        or [
            f"Variant {winner} led on attach rate",
            "Dollar-framed incentives and shorter subjects correlated with lift",
        ],
        "what_did_not_work": [
            "Longer soft-nudge subjects underperformed on open rate",
            "Percentage-framed incentives lagged dollar framing",
        ],
        "recommended_next_test": (
            "Keep dollar-amount framing; A/B shorter subject vs Meet-link CTA on next send"
        ),
        "campaign_goal": campaign.get("goal_metric"),
        "approval_required": True,
    }


def _fallback_draft(
    winner_analysis: dict[str, Any],
    campaign: dict[str, Any],
    review: dict[str, Any],
) -> dict[str, Any]:
    goal = campaign.get("goal_metric") or "ancillary_attach_rate"
    drivers = "; ".join(winner_analysis.get("drivers") or review.get("what_worked") or [])
    return {
        "source": "cached_fallback",
        "approval_required": True,
        "status": "pending_approval",
        "conditioning_summary": drivers or "prior winner drivers",
        "variants": [
            {
                "key": "A",
                "subject": "Attach in-house title — $500 per closing",
                "body_template": (
                    "Hi {{first_name}}, last campaign showed dollar framing and shorter "
                    "subjects won. Route title in-house to recover ~$500 per close. "
                    "Reply yes for a one-pager — no auto enroll."
                ),
                "cta_type": "soft_nudge",
                "incentive_framing": "dollar_amount",
                "include_meet_link": False,
                "subject_length": 46,
            },
            {
                "key": "B",
                "subject": "Book 15 min — lock in your title attach",
                "body_template": (
                    "Hi {{first_name}}, agents who booked time with the services "
                    "coordinator attached at the highest rate. Grab a Meet slot to "
                    "set your default title path (goal: improve "
                    f"{goal})."
                ),
                "cta_type": "book_time",
                "incentive_framing": "dollar_amount",
                "include_meet_link": True,
                "subject_length": 44,
            },
        ],
        "notes": "Cached demo draft — human approval required before any SES send.",
    }


def build_review_prompt_payload(
    campaign: dict[str, Any],
    winner_analysis: dict[str, Any],
) -> dict[str, Any]:
    """Aggregate-only payload for Perplexity (no agent ids/emails/names)."""
    return {
        "campaign_name": campaign.get("name"),
        "goal_metric": campaign.get("goal_metric"),
        "baseline_attach_rate": campaign.get("baseline_attach_rate"),
        "winner_analysis": {
            "winner_variant": winner_analysis.get("winner_variant"),
            "winner_attach_rate": winner_analysis.get("winner_attach_rate"),
            "winner_open_rate": winner_analysis.get("winner_open_rate"),
            "winner_click_rate": winner_analysis.get("winner_click_rate"),
            "drivers": winner_analysis.get("drivers"),
            "variant_insights": winner_analysis.get("variant_insights"),
            "model": winner_analysis.get("model"),
        },
        "variant_copy": [
            {
                "key": v.get("key"),
                "subject": v.get("subject"),
                "cta_type": v.get("cta_type"),
                "incentive_framing": v.get("incentive_framing"),
                "include_meet_link": v.get("include_meet_link"),
                "subject_length": v.get("subject_length") or len(str(v.get("subject") or "")),
            }
            for v in campaign.get("variants", [])
        ],
    }


def review_campaign(
    campaign: dict[str, Any],
    winner_analysis: dict[str, Any],
    *,
    use_cache_on_failure: bool = True,
) -> dict[str, Any]:
    campaign_id = str(campaign.get("id"))
    system = (
        "You are a brokerage campaign analyst. Return ONLY valid JSON with keys: "
        "what_worked (string[]), what_did_not_work (string[]), recommended_next_test (string). "
        "Use aggregate stats and variant copy only. Never invent person names or emails."
    )
    user = json.dumps(build_review_prompt_payload(campaign, winner_analysis))
    parsed = _call_perplexity(system, user)
    if parsed:
        out = {
            "source": "perplexity",
            "what_worked": parsed.get("what_worked") or [],
            "what_did_not_work": parsed.get("what_did_not_work") or [],
            "recommended_next_test": parsed.get("recommended_next_test") or "",
            "campaign_goal": campaign.get("goal_metric"),
            "approval_required": True,
        }
        _save_cache("review", campaign_id, out)
        return out

    if use_cache_on_failure:
        cached = _load_cache("review", campaign_id)
        if cached:
            cached = {**cached, "source": cached.get("source", "cached_fallback")}
            return cached
    out = _fallback_review(winner_analysis, campaign)
    _save_cache("review", campaign_id, out)
    return out


def draft_next_variants(
    campaign: dict[str, Any],
    winner_analysis: dict[str, Any],
    review: dict[str, Any],
    *,
    use_cache_on_failure: bool = True,
) -> dict[str, Any]:
    campaign_id = str(campaign.get("id"))
    system = (
        "You draft the NEXT A/B email variant pair for a brokerage agent campaign. "
        "Return ONLY valid JSON: {variants:[{key,subject,body_template,cta_type,"
        "incentive_framing,include_meet_link}], conditioning_summary:string}. "
        "Use {{first_name}} placeholder only — no real names, emails, phones, or addresses. "
        "Drafts require human approval before send."
    )
    user = json.dumps(
        {
            "goal_metric": campaign.get("goal_metric"),
            "prior_review": {
                "what_worked": review.get("what_worked"),
                "what_did_not_work": review.get("what_did_not_work"),
                "recommended_next_test": review.get("recommended_next_test"),
            },
            "winner_drivers": winner_analysis.get("drivers"),
            "prior_variant_copy": [
                {
                    "key": v.get("key"),
                    "subject": v.get("subject"),
                    "cta_type": v.get("cta_type"),
                    "incentive_framing": v.get("incentive_framing"),
                }
                for v in campaign.get("variants", [])
            ],
        }
    )
    parsed = _call_perplexity(system, user)
    if parsed and isinstance(parsed.get("variants"), list) and len(parsed["variants"]) >= 2:
        variants = []
        for i, raw in enumerate(parsed["variants"][:2]):
            subject = str(raw.get("subject") or f"Next iteration variant {chr(65 + i)}")
            variants.append(
                {
                    "key": raw.get("key") or ("A" if i == 0 else "B"),
                    "subject": subject,
                    "body_template": str(
                        raw.get("body_template")
                        or "Hi {{first_name}}, see the updated in-house attach offer."
                    ),
                    "cta_type": raw.get("cta_type") or "soft_nudge",
                    "incentive_framing": raw.get("incentive_framing") or "dollar_amount",
                    "include_meet_link": bool(raw.get("include_meet_link")),
                    "subject_length": len(subject),
                }
            )
        out = {
            "source": "perplexity",
            "approval_required": True,
            "status": "pending_approval",
            "conditioning_summary": parsed.get("conditioning_summary")
            or "; ".join(winner_analysis.get("drivers") or []),
            "variants": variants,
            "notes": "Perplexity draft — human approval required before SES send.",
        }
        _save_cache("draft", campaign_id, out)
        return out

    if use_cache_on_failure:
        cached = _load_cache("draft", campaign_id)
        if cached:
            return {**cached, "source": cached.get("source", "cached_fallback")}
    out = _fallback_draft(winner_analysis, campaign, review)
    _save_cache("draft", campaign_id, out)
    return out
