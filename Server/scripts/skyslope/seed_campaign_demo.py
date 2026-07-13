#!/usr/bin/env python3
"""SIL-308 / SIL-309 — seed two completed A/B campaigns into demo JSON.

Idempotent. Reads SIL-285 agents.csv (+ optional deals.csv for attach rates)
and writes Server/data/skyslope-demo/campaigns/campaigns.json.

Usage (from Server/ with venv active):
  python scripts/skyslope/seed_campaign_demo.py
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from collections import defaultdict
from datetime import date, datetime, timezone
from pathlib import Path

import numpy as np

SERVER_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(SERVER_ROOT))

from app.services.brokerage.campaigns.paths import (  # noqa: E402
    AGENTS_CSV,
    CAMPAIGNS_JSON,
    DEALS_CSV,
)
from app.services.brokerage.constants import DEFAULT_BROKERAGE_ORG_ID  # noqa: E402

SEED = 309
IN_HOUSE_MARKERS = ("in-house", "in house", "jv", "preferred")


def _tenure_years(hire_date: str, as_of: date) -> float:
    try:
        hired = date.fromisoformat(hire_date)
    except ValueError:
        return 3.0
    return max(0.25, round((as_of - hired).days / 365.25, 2))


def _is_in_house(value: str | None) -> bool:
    if not value:
        return False
    lower = value.strip().lower()
    return any(m in lower for m in IN_HOUSE_MARKERS)


def _agent_attach_rates(deals_path: Path) -> dict[str, dict[str, float]]:
    """Per-agent title / warranty attach rates from deals.csv when present."""
    out: dict[str, dict[str, float]] = {}
    if not deals_path.is_file():
        return out
    tallies: dict[str, dict[str, list[int]]] = defaultdict(
        lambda: {"title": [0, 0], "warranty": [0, 0]}
    )
    with deals_path.open(encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            agent_id = (row.get("agent_id") or "").strip()
            if not agent_id:
                continue
            tallies[agent_id]["title"][1] += 1
            if _is_in_house(row.get("title_vendor")):
                tallies[agent_id]["title"][0] += 1
            tallies[agent_id]["warranty"][1] += 1
            hw = (row.get("has_home_warranty") or "").strip().lower()
            if hw in ("1", "true", "yes", "y"):
                # treat as in-house warranty attach for demo purposes
                tallies[agent_id]["warranty"][0] += 1
    for agent_id, metrics in tallies.items():
        t_in, t_n = metrics["title"]
        w_in, w_n = metrics["warranty"]
        out[agent_id] = {
            "title": (t_in / t_n) if t_n else 0.22,
            "warranty": (w_in / w_n) if w_n else 0.18,
            "volume": float(t_n),
        }
    return out


def _load_agents(path: Path) -> list[dict]:
    with path.open(encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


def _assign_variant(agent_id: str) -> str:
    """Deterministic 50/50 split from agent id hash."""
    return "A" if (sum(ord(c) for c in agent_id) % 2 == 0) else "B"


def _simulate_outcomes(
    rng: np.random.Generator,
    *,
    variant: str,
    campaign: str,
    attach_rate: float,
    tenure_years: float,
    prior_engagement: float,
) -> dict:
    """Realistic open/click/attach probs; B wins clearly on title Q1."""
    if campaign == "title_q1":
        # B: shorter subject + dollar incentive → clear winner
        open_p = 0.38 if variant == "A" else 0.52
        click_p = 0.10 if variant == "A" else 0.17
        attach_lift = 0.04 if variant == "A" else 0.12
        fee = 500.0
    else:
        # warranty Q2: near-tie / modest lift
        open_p = 0.42 if variant == "A" else 0.44
        click_p = 0.11 if variant == "A" else 0.12
        attach_lift = 0.03 if variant == "A" else 0.045
        fee = 150.0

    # Feature-aware noise so the ML model has signal
    open_p = float(
        np.clip(open_p + 0.02 * (tenure_years / 10) + 0.03 * prior_engagement, 0.05, 0.9)
    )
    click_p = float(np.clip(click_p + 0.01 * prior_engagement, 0.02, 0.35))
    attach_p = float(
        np.clip(attach_rate + attach_lift - 0.05 * max(0, 0.35 - attach_rate), 0.02, 0.85)
    )

    opened = bool(rng.random() < open_p)
    clicked = bool(opened and rng.random() < (click_p / max(open_p, 1e-6)))
    attached = bool(
        clicked and rng.random() < (attach_p / max(click_p, 1e-6) * 0.55 + attach_p * 0.2)
    )
    # Also allow attach without click at low rate (offline conversation)
    if opened and not attached and rng.random() < attach_lift * 0.35:
        attached = True

    revenue = round(fee, 2) if attached else 0.0
    return {
        "sent": True,
        "opened": opened,
        "clicked": clicked,
        "attached": attached,
        "attributed_revenue": revenue,
    }


def _build_campaign(
    *,
    campaign_id: str,
    name: str,
    goal: str,
    sent_at: str,
    variants: list[dict],
    agents: list[dict],
    attach_key: str,
    attach_rates: dict[str, dict[str, float]],
    baseline: float,
    campaign_key: str,
    arms: int,
    rng: np.random.Generator,
) -> dict:
    as_of = date.fromisoformat(sent_at)
    # Prefer low-attach agents (SIL-279 segment story)
    scored = []
    for agent in agents:
        aid = agent["agent_id"]
        metrics = attach_rates.get(aid, {})
        rate = float(metrics.get(attach_key, baseline))
        vol = float(metrics.get("volume", 8))
        scored.append((rate, -vol, aid, agent, metrics))
    scored.sort()
    selected = scored[:arms]

    recipients = []
    for rate, _neg_vol, aid, agent, metrics in selected:
        variant = _assign_variant(aid)
        tenure = _tenure_years(agent.get("hire_date", "2020-01-01"), as_of)
        prior = float(rng.integers(0, 4))
        outcomes = _simulate_outcomes(
            rng,
            variant=variant,
            campaign=campaign_key,
            attach_rate=rate,
            tenure_years=tenure,
            prior_engagement=prior / 3.0,
        )
        recipients.append(
            {
                "agent_id": aid,
                "office_id": agent.get("office_id", "OFF-000"),
                "variant": variant,
                "tenure_years": tenure,
                "transaction_volume": int(metrics.get("volume", 8)),
                "attach_rate": round(rate, 4),
                "prior_campaign_opens": int(prior),
                "prior_campaign_clicks": int(max(0, prior - 1)),
                **outcomes,
            }
        )

    return {
        "id": campaign_id,
        "name": name,
        "goal_metric": goal,
        "status": "completed",
        "created_at": f"{sent_at}T10:00:00+00:00",
        "sent_at": sent_at,
        "baseline_attach_rate": baseline,
        "variants": variants,
        "recipients": recipients,
    }


def build_store(arms: int = 80) -> dict:
    rng = np.random.default_rng(SEED)
    agents = _load_agents(AGENTS_CSV)
    attach_rates = _agent_attach_rates(DEALS_CSV)

    title_variants = [
        {
            "key": "A",
            "subject": "A quick reminder about our preferred title partners",
            "body_template": (
                "Hi {{first_name}}, when you route closings through our preferred title "
                "partners, clients get a smoother experience and you keep more of the "
                "transaction in-house. Reply if you'd like a one-pager on the JV."
            ),
            "cta_type": "soft_nudge",
            "incentive_framing": "percentage",
            "include_meet_link": False,
            "subject_length": 58,
        },
        {
            "key": "B",
            "subject": "Earn $500 more per closing — in-house title",
            "body_template": (
                "Hi {{first_name}}, agents who attach in-house title recover about $500 "
                "per closing for the brokerage (and a cleaner client handoff for you). "
                "Book 15 minutes with your services coordinator to get set up."
            ),
            "cta_type": "book_time",
            "incentive_framing": "dollar_amount",
            "include_meet_link": True,
            "subject_length": 48,
        },
    ]
    warranty_variants = [
        {
            "key": "A",
            "subject": "Home warranty attach tips for your next listing",
            "body_template": (
                "Hi {{first_name}}, a short checklist for offering home warranty at "
                "listing appointment. Attach rates climb when you mention it early."
            ),
            "cta_type": "checklist",
            "incentive_framing": "process",
            "include_meet_link": False,
            "subject_length": 49,
        },
        {
            "key": "B",
            "subject": "Warranty nudge: +$150 ancillary per close",
            "body_template": (
                "Hi {{first_name}}, attaching home warranty adds ~$150 ancillary revenue "
                "per close. Try this one-liner with sellers this week."
            ),
            "cta_type": "script",
            "incentive_framing": "dollar_amount",
            "include_meet_link": False,
            "subject_length": 44,
        },
    ]

    campaigns = [
        _build_campaign(
            campaign_id="camp-title-q1-2026",
            name="Title attach push — Q1",
            goal="ancillary_attach_rate",
            sent_at="2026-01-15",
            variants=title_variants,
            agents=agents,
            attach_key="title",
            attach_rates=attach_rates,
            baseline=0.22,
            campaign_key="title_q1",
            arms=arms,
            rng=rng,
        ),
        _build_campaign(
            campaign_id="camp-warranty-q2-2026",
            name="Home warranty nudge — Q2",
            goal="ancillary_attach_rate",
            sent_at="2026-04-10",
            variants=warranty_variants,
            agents=agents,
            attach_key="warranty",
            attach_rates=attach_rates,
            baseline=0.18,
            campaign_key="warranty_q2",
            arms=arms,
            rng=rng,
        ),
    ]

    return {
        "brokerage_org_id": DEFAULT_BROKERAGE_ORG_ID,
        "model_version": "sil309-seed-v1",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "seed": SEED,
        "campaigns": campaigns,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--arms", type=int, default=80, help="Recipients per campaign")
    parser.add_argument(
        "--out",
        type=Path,
        default=CAMPAIGNS_JSON,
        help="Output JSON path",
    )
    args = parser.parse_args()
    store = build_store(arms=args.arms)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open("w", encoding="utf-8") as fh:
        json.dump(store, fh, indent=2)
        fh.write("\n")
    print(f"Wrote {args.out} ({len(store['campaigns'])} campaigns, {args.arms} arms each)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
