"""Campaign CRUD + list/detail serialization (SIL-306)."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select

from app import db
from app.models import (
    EmailCampaign,
    EmailCampaignEvent,
    EmailCampaignRecipient,
    EmailCampaignVariant,
)
from app.services.brokerage.analytics import (
    BrokerageAnalyticsFilters,
    get_targeted_agent_engagement,
)
from app.services.brokerage.campaigns.assign import assign_variant
from logger import log


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _campaign_to_dict(
    campaign: EmailCampaign, *, include_recipients: bool = False
) -> dict[str, Any]:
    data: dict[str, Any] = {
        "id": campaign.id,
        "brokerage_id": campaign.brokerage_id,
        "name": campaign.name,
        "goal_metric": campaign.goal_metric,
        "status": campaign.status,
        "created_at": campaign.created_at.isoformat() if campaign.created_at else None,
        "sent_at": campaign.sent_at.isoformat() if campaign.sent_at else None,
        "baseline_attach_rate_percent": campaign.baseline_attach_rate_percent,
        "post_attach_rate_percent": campaign.post_attach_rate_percent,
        "variants": [
            {
                "id": v.id,
                "variant_key": v.variant_key,
                "subject": v.subject,
                "body_template": v.body_template,
            }
            for v in sorted(campaign.variants, key=lambda x: x.variant_key)
        ],
        "recipient_count": len(campaign.recipients),
        "variant_counts": {
            "A": sum(1 for r in campaign.recipients if r.variant_key == "A"),
            "B": sum(1 for r in campaign.recipients if r.variant_key == "B"),
        },
    }
    if include_recipients:
        data["recipients"] = [
            {
                "id": r.id,
                "agent_id": r.agent_id,
                "agent_name": r.agent_name,
                "variant_key": r.variant_key,
                "send_status": r.send_status,
                "sent_at": r.sent_at.isoformat() if r.sent_at else None,
            }
            for r in campaign.recipients
        ]
    return data


def list_campaigns(brokerage_org_id: str) -> dict[str, Any]:
    rows = db.session.scalars(
        select(EmailCampaign)
        .where(EmailCampaign.brokerage_id == brokerage_org_id)
        .order_by(EmailCampaign.created_at.desc())
    ).all()
    return {
        "success": True,
        "brokerage_org_id": brokerage_org_id,
        "campaigns": [_campaign_to_dict(c) for c in rows],
    }


def get_campaign(brokerage_org_id: str, campaign_id: str) -> dict[str, Any]:
    campaign = db.session.scalar(
        select(EmailCampaign).where(
            EmailCampaign.id == campaign_id,
            EmailCampaign.brokerage_id == brokerage_org_id,
        )
    )
    if not campaign:
        return {"success": False, "error": "campaign_not_found"}
    return {
        "success": True,
        "campaign": _campaign_to_dict(campaign, include_recipients=True),
    }


def create_campaign(
    brokerage_org_id: str,
    *,
    name: str,
    goal_metric: str,
    variants: list[dict[str, str]],
    segment: str = "targeted_engagement",
    send: bool = True,
) -> dict[str, Any]:
    """Create campaign with two variants; assign recipients from engagement segment."""
    if len(variants) != 2:
        return {
            "success": False,
            "error": "validation_error",
            "message": "Exactly two variants required",
        }

    keys = {v.get("variant_key") for v in variants}
    if keys != {"A", "B"}:
        return {
            "success": False,
            "error": "validation_error",
            "message": "Variants must be A and B",
        }

    agents: list[dict[str, Any]] = []
    if segment == "targeted_engagement":
        engagement = get_targeted_agent_engagement(
            BrokerageAnalyticsFilters(brokerage_org_id=brokerage_org_id)
        )
        agents = engagement.get("flagged_agents") or []

    if not agents:
        return {
            "success": False,
            "error": "validation_error",
            "message": "No agents in segment",
        }

    campaign_id = str(uuid.uuid4())
    now = _utcnow()
    campaign = EmailCampaign(
        id=campaign_id,
        brokerage_id=brokerage_org_id,
        name=name,
        goal_metric=goal_metric,
        status="sent" if send else "draft",
        created_at=now,
        sent_at=now if send else None,
    )
    db.session.add(campaign)

    for v in variants:
        db.session.add(
            EmailCampaignVariant(
                id=str(uuid.uuid4()),
                campaign_id=campaign_id,
                variant_key=v["variant_key"],
                subject=v.get("subject") or "",
                body_template=v.get("body_template") or "",
            )
        )

    for agent in agents:
        agent_id = str(agent.get("agent_id") or agent.get("id") or "")
        if not agent_id:
            continue
        variant_key = assign_variant(campaign_id, agent_id)
        recipient = EmailCampaignRecipient(
            id=str(uuid.uuid4()),
            campaign_id=campaign_id,
            agent_id=agent_id,
            agent_name=agent.get("name"),
            variant_key=variant_key,
            send_status="sent" if send else "pending",
            sent_at=now if send else None,
        )
        db.session.add(recipient)
        if send:
            db.session.add(
                EmailCampaignEvent(
                    id=str(uuid.uuid4()),
                    recipient_id=recipient.id,
                    event_type="sent",
                    occurred_at=now,
                )
            )

    try:
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        log.error("ERRORS", "Failed to create email campaign", {"error": str(exc)})
        return {"success": False, "error": "database_error"}

    # Stub SES: log only (demo-safe)
    if send:
        log.info(
            "EMAIL",
            "Campaign send stubbed (SES disabled for demo)",
            {
                "campaign_id": campaign_id,
                "recipient_count": len(agents),
                "brokerage_org_id": brokerage_org_id,
            },
        )

    refreshed = db.session.scalar(select(EmailCampaign).where(EmailCampaign.id == campaign_id))
    assert refreshed is not None
    return {
        "success": True,
        "campaign": _campaign_to_dict(refreshed, include_recipients=True),
    }
