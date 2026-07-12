"""Idempotent seed of two completed A/B campaigns for demo (SIL-308).

Usage:
  cd Server && .venv/bin/python -m scripts.skyslope.seed_demo_campaigns --brokerage-id <uuid>
"""

from __future__ import annotations

import argparse
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app import create_app, db
from app.models import (
    EmailCampaign,
    EmailCampaignEvent,
    EmailCampaignRecipient,
    EmailCampaignVariant,
)
from app.services.brokerage.ancillary_fees import ANCILLARY_FEES
from app.services.brokerage.campaigns.assign import assign_variant
from app.services.brokerage.campaigns.lift import recovered_dollars
from app.services.brokerage.constants import DEFAULT_BROKERAGE_ORG_ID
from logger import log

# ~40 agents per arm for Q1 (~80 total)
_Q1_AGENTS = [f"demo-agent-{i:03d}" for i in range(80)]
_Q2_AGENTS = [f"demo-agent-{i:03d}" for i in range(40, 120)]


def seed_demo_campaigns(brokerage_id: str, *, force: bool = False) -> dict:
    """Seed Q1 title + Q2 warranty campaigns. Idempotent by name+brokerage."""
    created = []
    for spec in (_q1_spec(brokerage_id), _q2_spec(brokerage_id)):
        existing = db.session.scalar(
            select(EmailCampaign).where(
                EmailCampaign.brokerage_id == brokerage_id,
                EmailCampaign.name == spec["name"],
            )
        )
        if existing and not force:
            created.append({"id": existing.id, "name": existing.name, "skipped": True})
            continue
        if existing and force:
            db.session.delete(existing)
            db.session.flush()

        campaign_id = str(uuid.uuid4())
        campaign = EmailCampaign(
            id=campaign_id,
            brokerage_id=brokerage_id,
            name=spec["name"],
            goal_metric=spec["goal_metric"],
            status="completed",
            created_at=spec["created_at"],
            sent_at=spec["sent_at"],
            baseline_attach_rate_percent=spec["baseline"],
            post_attach_rate_percent=spec["post"],
        )
        db.session.add(campaign)
        for vk, subject, body in spec["variants"]:
            db.session.add(
                EmailCampaignVariant(
                    id=str(uuid.uuid4()),
                    campaign_id=campaign_id,
                    variant_key=vk,
                    subject=subject,
                    body_template=body,
                )
            )

        service = spec["service"]
        fee = ANCILLARY_FEES[service]
        # Target recovered dollars → attach counts
        target_dollars = spec["target_recovered"]
        target_attaches = max(1, target_dollars // fee)

        recipients_meta = []
        for agent_id in spec["agents"]:
            vk = assign_variant(campaign_id, agent_id)
            rid = str(uuid.uuid4())
            recipients_meta.append((rid, agent_id, vk))
            db.session.add(
                EmailCampaignRecipient(
                    id=rid,
                    campaign_id=campaign_id,
                    agent_id=agent_id,
                    agent_name=agent_id.replace("-", " ").title(),
                    variant_key=vk,
                    send_status="sent",
                    sent_at=spec["sent_at"],
                )
            )

        # Events: all sent; opens/clicks; attributed attaches
        open_rate, click_rate = spec["open_rate"], spec["click_rate"]
        # Prefer winning variant for attaches when configured (still fill target)
        ordered = list(enumerate(recipients_meta))
        if spec.get("prefer_variant") == "B":
            ordered.sort(key=lambda item: 0 if item[1][2] == "B" else 1)

        attach_idx = 0
        attach_recipient_ids: set[str] = set()
        for _i, (rid, _agent_id, _vk) in ordered:
            if attach_idx >= target_attaches:
                break
            attach_recipient_ids.add(rid)
            attach_idx += 1

        for i, (rid, _agent_id, _vk) in enumerate(recipients_meta):
            t0 = spec["sent_at"]
            db.session.add(
                EmailCampaignEvent(
                    id=str(uuid.uuid4()),
                    recipient_id=rid,
                    event_type="sent",
                    occurred_at=t0,
                )
            )
            if i / max(len(recipients_meta), 1) < open_rate:
                db.session.add(
                    EmailCampaignEvent(
                        id=str(uuid.uuid4()),
                        recipient_id=rid,
                        event_type="opened",
                        occurred_at=t0 + timedelta(days=1),
                    )
                )
            if i / max(len(recipients_meta), 1) < click_rate:
                db.session.add(
                    EmailCampaignEvent(
                        id=str(uuid.uuid4()),
                        recipient_id=rid,
                        event_type="clicked",
                        occurred_at=t0 + timedelta(days=2),
                    )
                )
            if rid in attach_recipient_ids:
                db.session.add(
                    EmailCampaignEvent(
                        id=str(uuid.uuid4()),
                        recipient_id=rid,
                        event_type="attached",
                        occurred_at=t0 + timedelta(days=14 + (i % 20)),
                        service=service,
                        attributed=True,
                    )
                )

        created.append(
            {
                "id": campaign_id,
                "name": spec["name"],
                "skipped": False,
                "target_recovered": target_dollars,
                "fee": fee,
                "attaches": attach_idx,
                "computed_dollars": recovered_dollars(attach_idx, fee),
                "lift_pp": round(spec["post"] - spec["baseline"], 2),
            }
        )

    db.session.commit()
    return {"success": True, "brokerage_id": brokerage_id, "campaigns": created}


def _q1_spec(brokerage_id: str) -> dict:
    sent = datetime(2026, 1, 15, tzinfo=timezone.utc)
    return {
        "name": "Title attach push — Q1",
        "goal_metric": "title_attach",
        "service": "title",
        "baseline": 30.0,
        "post": 34.0,  # 4pp lift in 1–5 band; B wins vs A in results
        "target_recovered": 28000,  # 56 * 500
        "open_rate": 0.45,
        "click_rate": 0.12,
        "prefer_variant": "B",
        "agents": _Q1_AGENTS,
        "created_at": sent - timedelta(days=2),
        "sent_at": sent,
        "variants": [
            ("A", "Boost your closings with in-house title", "Variant A body — soft nudge"),
            ("B", "Recover $500+ per deal with preferred title", "Variant B body — dollar framing"),
        ],
    }


def _q2_spec(brokerage_id: str) -> dict:
    sent = datetime(2026, 4, 10, tzinfo=timezone.utc)
    return {
        "name": "Home warranty nudge — Q2",
        "goal_metric": "home_warranty_attach",
        "service": "home_warranty",
        "baseline": 43.0,
        "post": 44.5,  # ~1.5pp near-tie
        "target_recovered": 2250,  # 15 * 150
        "open_rate": 0.40,
        "click_rate": 0.10,
        "prefer_variant": None,
        "agents": _Q2_AGENTS,
        "created_at": sent - timedelta(days=1),
        "sent_at": sent,
        "variants": [
            ("A", "Offer home warranty at every listing appt", "Variant A"),
            ("B", "One more protection for your buyers", "Variant B"),
        ],
    }


def validate_seed_payloads(brokerage_id: str) -> list[str]:
    """Return list of validation errors (empty = ok)."""
    from app.services.brokerage.campaigns.results import get_campaign_results

    errors: list[str] = []
    rows = db.session.scalars(
        select(EmailCampaign).where(EmailCampaign.brokerage_id == brokerage_id)
    ).all()
    if len(rows) < 2:
        errors.append(f"Expected >=2 campaigns, got {len(rows)}")
    for c in rows:
        res = get_campaign_results(brokerage_id, c.id)
        if not res.get("success"):
            errors.append(f"{c.name}: results failed")
            continue
        lift = res.get("attach_rate_lift_pp") or 0
        if not (1.0 <= lift <= 5.0):
            errors.append(f"{c.name}: lift_pp {lift} not in [1,5]")
        for row in res.get("recovered_by_service") or []:
            fee = ANCILLARY_FEES.get(row["service"])
            if fee is not None and row["fee_assumption"] != fee:
                errors.append(f"{c.name}: fee mismatch for {row['service']}")
            expected = recovered_dollars(row["attributed_attaches"], row["fee_assumption"])
            if row["recovered_dollars"] != expected:
                errors.append(f"{c.name}: dollar math mismatch")
        if not res.get("recovered_by_service"):
            errors.append(f"{c.name}: empty recovered_by_service")
    return errors


def main():
    parser = argparse.ArgumentParser(description="Seed demo email campaigns")
    parser.add_argument(
        "--brokerage-id",
        default=DEFAULT_BROKERAGE_ORG_ID,
        help="Brokerage org UUID",
    )
    parser.add_argument("--force", action="store_true", help="Recreate if exists")
    parser.add_argument("--validate-only", action="store_true")
    args = parser.parse_args()

    app = create_app()
    with app.app_context():
        if args.validate_only:
            errs = validate_seed_payloads(args.brokerage_id)
            if errs:
                for e in errs:
                    log.error("EMAIL", f"Seed validation failed: {e}")
                raise SystemExit(1)
            log.info("EMAIL", "OK: seed validation passed")
            return

        result = seed_demo_campaigns(args.brokerage_id, force=args.force)
        log.info("EMAIL", "Demo campaigns seeded", result)
        errs = validate_seed_payloads(args.brokerage_id)
        if errs:
            for e in errs:
                log.warn("EMAIL", f"Seed validation warning: {e}")


if __name__ == "__main__":
    main()
