"""Partner / rev-share ORM → OpenAPI schemas."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any, cast

from app.models.partners.partner import DEFAULT_INTEGRATION_DISPLAY_MODE
from app.schemas.generated import BuyerStepView as BuyerStepViewSchema
from app.schemas.generated import IntegrationDisplayMode
from app.schemas.generated import Partner as PartnerSchema
from app.schemas.generated import RevShareRecentClick as RevShareRecentClickSchema
from app.utils.format.datetime import to_aware_utc_iso


def _aware_datetime(dt: datetime | None) -> datetime:
    if dt is None:
        return datetime.now(timezone.utc)
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _integration_display_mode_enum(
    raw: str | IntegrationDisplayMode | None,
) -> IntegrationDisplayMode:
    if isinstance(raw, IntegrationDisplayMode):
        return raw
    return IntegrationDisplayMode(raw or DEFAULT_INTEGRATION_DISPLAY_MODE)


if TYPE_CHECKING:
    from app.models.partners.buyer_step_view import BuyerStepView as BuyerStepViewModel
    from app.models.partners.partner import Partner as PartnerModel
    from app.models.partners.rev_share_link_click import RevShareLinkClick as RevShareLinkClickModel
    from app.models.user.user import User as UserModel


class PartnerDTO:
    @staticmethod
    def from_orm(partner: PartnerModel) -> PartnerSchema:
        step_ids = partner.resolved_step_ids()
        return PartnerSchema(
            id=partner.id,
            name=partner.name,
            slug=partner.slug,
            destination_url_template=partner.destination_url_template,
            logo_url=partner.logo_url,
            description=partner.description,
            step_id=step_ids[0] if step_ids else partner.step_id,
            step_ids=step_ids,
            target_roles=list(partner.target_roles or []),
            payout_type=cast(Any, partner.payout_type),
            payout_per_conversion=float(partner.payout_per_conversion),
            integration_display_mode=_integration_display_mode_enum(
                partner.integration_display_mode
            ),
            embed_url_template=partner.embed_url_template,
            is_active=partner.is_active,
            created_at=to_aware_utc_iso(partner.created_at),
            updated_at=to_aware_utc_iso(partner.updated_at),
            total_clicks=None,
            click_through_rate=None,
            unique_buyer_step_views=None,
        )

    @classmethod
    def to_response(cls, partner: PartnerModel) -> dict:
        return cls.from_orm(partner).model_dump(mode="json", warnings=False)


class BuyerStepViewDTO:
    @staticmethod
    def from_orm(row: BuyerStepViewModel) -> BuyerStepViewSchema:
        return BuyerStepViewSchema(
            id=row.id,
            buyer_id=row.buyer_id,
            step_id=row.step_id,
            transaction_id=row.transaction_id,
            viewed_at=_aware_datetime(row.viewed_at),
            partner_payout_snapshot=row.partner_payout_snapshot,
        )

    @classmethod
    def to_response(cls, row: BuyerStepViewModel) -> dict:
        return cls.from_orm(row).model_dump(mode="json")


class RevShareLinkClickDTO:
    @staticmethod
    def from_orm(click: RevShareLinkClickModel) -> RevShareRecentClickSchema:
        return RevShareRecentClickSchema(
            id=click.id,
            partner_id=click.partner_id,
            link_id=click.link_id,
            agent_id=click.agent_id,
            buyer_id=click.buyer_id,
            transaction_id=click.transaction_id,
            step_id=click.step_id,
            clicked_at=_aware_datetime(click.clicked_at),
            payout_per_conversion=float(click.payout_per_conversion),
            payout_type=click.payout_type,
            utm_source=click.utm_source,
            utm_medium=click.utm_medium,
            utm_campaign=click.utm_campaign,
            geo_city=click.geo_city,
            geo_zip=click.geo_zip,
            geo_region=click.geo_region,
            device_class=click.device_class,
            referrer=click.referrer,
            buyer_name=None,
            agent_name=None,
        )

    @classmethod
    def to_recent_click(
        cls,
        click: RevShareLinkClickModel,
        *,
        buyer: UserModel | None,
        agent: UserModel | None,
        agent_display_fallback: str | None = None,
    ) -> dict:
        base = cls.from_orm(click).model_dump(mode="json")
        base["buyer_name"] = buyer.name if buyer else None
        if agent:
            base["agent_name"] = agent.name
        elif agent_display_fallback is not None:
            base["agent_name"] = agent_display_fallback
        else:
            base["agent_name"] = None
        return base
