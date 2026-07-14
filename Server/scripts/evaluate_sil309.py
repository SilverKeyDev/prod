#!/usr/bin/env python3
"""Evaluate SIL-309 campaign engagement models.

Default: JSON seed (camp-title-q1-2026) — no DB required.
With --from-db: score the first seeded DB campaign (after seed_demo_campaigns).

Usage (from Server/ with venv):
  python scripts/evaluate_sil309.py
  python scripts/evaluate_sil309.py --run-loop
  python scripts/evaluate_sil309.py --from-db --run-loop
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

SERVER_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVER_ROOT))

from app.services.brokerage.campaigns.learning.learning_loop import (  # noqa: E402
    run_campaign_learning_loop,
)
from app.services.brokerage.campaigns.learning.scoring_service import (  # noqa: E402
    score_campaign_engagement,
)
from app.services.brokerage.constants import DEFAULT_BROKERAGE_ORG_ID  # noqa: E402


def _resolve_db_campaign_id(brokerage_org_id: str, name_substr: str) -> str:
    from app import create_app
    from app.services.brokerage.campaigns.service import list_campaigns

    app = create_app()
    with app.app_context():
        listed = list_campaigns(brokerage_org_id)
        for c in listed.get("campaigns") or []:
            if name_substr in (c.get("name") or ""):
                return str(c["id"])
    raise SystemExit(f"No DB campaign matching {name_substr!r}; run seed_demo_campaigns first")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--campaign-id",
        default="camp-title-q1-2026",
        help="Campaign id (JSON camp-* or DB UUID)",
    )
    parser.add_argument(
        "--brokerage-org-id",
        default=DEFAULT_BROKERAGE_ORG_ID,
    )
    parser.add_argument(
        "--from-db",
        action="store_true",
        help="Use first Title Q1 campaign from DB instead of JSON id",
    )
    parser.add_argument(
        "--run-loop",
        action="store_true",
        help="Also run full learning loop with skip_perplexity",
    )
    args = parser.parse_args()

    campaign_id = args.campaign_id
    if args.from_db:
        campaign_id = _resolve_db_campaign_id(args.brokerage_org_id, "Title attach push")

    def _run() -> int:
        scoring = score_campaign_engagement(args.brokerage_org_id, campaign_id)
        print(json.dumps(scoring, indent=2))
        if not scoring.get("success"):
            return 1

        metrics = scoring.get("metrics") or {}
        print(
            f"\nChosen model: {metrics.get('chosen_model')} "
            f"(AUC={metrics.get('chosen_auc')}) — {metrics.get('rationale')}"
        )

        if args.run_loop:
            loop = run_campaign_learning_loop(
                args.brokerage_org_id,
                campaign_id,
                skip_perplexity=True,
            )
            print("\n--- learning loop (skip_perplexity) ---")
            print(
                json.dumps(
                    {
                        "winner": (loop.get("winner_analysis") or {}).get("winner_variant"),
                        "drivers": (loop.get("winner_analysis") or {}).get("drivers"),
                        "review_source": (loop.get("review") or {}).get("source"),
                        "draft_source": (loop.get("next_iteration_draft") or {}).get("source"),
                        "draft_subjects": [
                            v.get("subject")
                            for v in (loop.get("next_iteration_draft") or {}).get("variants", [])
                        ],
                        "approval_required": (loop.get("next_iteration_draft") or {}).get(
                            "approval_required"
                        ),
                    },
                    indent=2,
                )
            )
        return 0

    if args.from_db or not str(campaign_id).startswith("camp-"):
        from app import create_app

        app = create_app()
        with app.app_context():
            return _run()
    return _run()


if __name__ == "__main__":
    raise SystemExit(main())
