"""Load a campaign into the SIL-309 learning feature shape.

Prefer DB (SIL-306 ORM + events). Fall back to JSON demo seed for
``camp-*`` ids / unit tests without Postgres.
"""

from __future__ import annotations

import hashlib
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app import db
from app.models import EmailCampaign, EmailCampaignRecipient
from app.services.brokerage.campaigns.learning_artifacts import get_json_campaign
from app.services.brokerage.campaigns.service import get_campaign as get_db_campaign


def _stable_unit(s: str) -> float:
    digest = hashlib.sha256(s.encode("utf-8")).hexdigest()
    return int(digest[:8], 16) / 0xFFFFFFFF


def _infer_variant_meta(subject: str, body: str) -> dict[str, Any]:
    text = f"{subject} {body}".lower()
    if "$" in text or "dollar" in text or "recover" in text:
        incentive = "dollar_amount"
    elif "%" in text or "percent" in text:
        incentive = "percentage"
    else:
        incentive = "process"

    if "book" in text or "meet" in text or "coordinator" in text:
        cta = "book_time"
    elif "checklist" in text:
        cta = "checklist"
    elif "script" in text or "one-liner" in text:
        cta = "script"
    else:
        cta = "soft_nudge"

    include_meet = "meet" in text or "calendar" in text
    return {
        "key": None,  # filled by caller
        "subject": subject,
        "body_template": body,
        "cta_type": cta,
        "incentive_framing": incentive,
        "include_meet_link": include_meet,
        "subject_length": len(subject or ""),
    }


def _synthetic_agent_features(agent_id: str) -> dict[str, Any]:
    """Deterministic proxies when ORM has no tenure/volume/office columns."""
    u1 = _stable_unit(f"{agent_id}:tenure")
    u2 = _stable_unit(f"{agent_id}:vol")
    u3 = _stable_unit(f"{agent_id}:office")
    u4 = _stable_unit(f"{agent_id}:prior")
    office_idx = int(u3 * 24) + 1
    return {
        "tenure_years": round(0.5 + u1 * 14.0, 2),
        "transaction_volume": int(3 + u2 * 40),
        "attach_rate": round(0.05 + u1 * 0.45, 4),
        "prior_campaign_opens": int(u4 * 4),
        "prior_campaign_clicks": int(max(0, u4 * 3 - 1)),
        "office_id": f"OFF-{office_idx:03d}",
    }


def campaign_dict_from_orm(campaign: EmailCampaign) -> dict[str, Any]:
    """Normalize ORM campaign + events into JSON-like learning dict."""
    variants = []
    for v in sorted(campaign.variants, key=lambda x: x.variant_key):
        meta = _infer_variant_meta(v.subject or "", v.body_template or "")
        meta["key"] = v.variant_key
        variants.append(meta)

    recipients = []
    for r in campaign.recipients:
        types = {e.event_type for e in r.events}
        feats = _synthetic_agent_features(r.agent_id)
        recipients.append(
            {
                "agent_id": r.agent_id,
                "variant": r.variant_key,
                "sent": "sent" in types or r.send_status == "sent",
                "opened": "opened" in types,
                "clicked": "clicked" in types,
                "attached": any(e.event_type == "attached" and e.attributed for e in r.events),
                **feats,
            }
        )

    baseline = float(campaign.baseline_attach_rate_percent or 20.0) / 100.0
    return {
        "id": campaign.id,
        "name": campaign.name,
        "goal_metric": campaign.goal_metric,
        "status": campaign.status,
        "baseline_attach_rate": baseline,
        "variants": variants,
        "recipients": recipients,
    }


def load_campaign_for_learning(
    brokerage_org_id: str,
    campaign_id: str,
) -> dict[str, Any]:
    """
    Return ``{success, campaign}`` in learning feature shape.

    Order: DB UUID → JSON ``camp-*`` fallback (unit tests / offline).
    """
    # JSON stable ids (no DB required)
    if campaign_id.startswith("camp-"):
        js = get_json_campaign(campaign_id)
        if js:
            return {"success": True, "campaign": js, "source": "json"}
        return {"success": False, "error": "campaign_not_found"}

    # DB path
    try:
        detail = get_db_campaign(brokerage_org_id, campaign_id)
    except Exception:  # noqa: BLE001 — fall through to JSON if no app context
        detail = {"success": False, "error": "db_unavailable"}

    if detail.get("success"):
        campaign = db.session.scalar(
            select(EmailCampaign)
            .where(
                EmailCampaign.id == campaign_id,
                EmailCampaign.brokerage_id == brokerage_org_id,
            )
            .options(
                selectinload(EmailCampaign.recipients).selectinload(EmailCampaignRecipient.events),
                selectinload(EmailCampaign.variants),
            )
        )
        if campaign:
            return {
                "success": True,
                "campaign": campaign_dict_from_orm(campaign),
                "source": "db",
            }

    # Name alias: map Title Q1 JSON → first DB campaign with matching name
    js = get_json_campaign(campaign_id)
    if js:
        return {"success": True, "campaign": js, "source": "json"}

    return {"success": False, "error": "campaign_not_found"}
