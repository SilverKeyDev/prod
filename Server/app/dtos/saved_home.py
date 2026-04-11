"""PropertyCache + UserPropertyLink -> OpenAPI `SavedHome` schema."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING

from app.schemas.generated import SavedHome as SavedHomeSchema

if TYPE_CHECKING:
    from app.models.property.property_cache import PropertyCache as PropertyCacheModel
    from app.models.property.user_property_link import UserPropertyLink as UserPropertyLinkModel


class SavedHomeDTO:
    """Maps PropertyCache + UserPropertyLink to the API shape."""

    @staticmethod
    def _ensure_timezone_aware(dt: datetime | None) -> str | None:
        if dt is None:
            return None
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat()

    @staticmethod
    def _normalize_image_urls(image_urls: dict | list | None) -> dict[str, str] | None:
        if image_urls is None:
            return None
        if isinstance(image_urls, dict):
            return image_urls
        if isinstance(image_urls, list):
            return {str(i): url for i, url in enumerate(image_urls) if url}
        return None

    @staticmethod
    def from_property_cache(
        prop: PropertyCacheModel,
        link: UserPropertyLinkModel,
    ) -> SavedHomeSchema:
        """Construct from shared PropertyCache + per-user UserPropertyLink."""
        return SavedHomeSchema(
            id=prop.id,
            user_id=link.user_id,
            address=prop.address,
            isLiked=bool(link.is_liked),
            current=bool(link.current),
            score=link.score,
            ranking=link.ranking,
            city=prop.city,
            state=prop.state,
            zipcode=prop.zipcode,
            beds=prop.beds,
            baths=prop.baths,
            sqft=prop.sqft,
            lot_size=prop.lot_size,
            price=prop.price,
            created_at=SavedHomeDTO._ensure_timezone_aware(link.created_at),
            updated_at=SavedHomeDTO._ensure_timezone_aware(link.updated_at),
            image_url=prop.primary_image_url,
            image_urls=SavedHomeDTO._normalize_image_urls(prop.images),
            zpid=prop.zpid,
            mls_home_id=prop.mls_home_id,
            listing_status=prop.listing_status,
            property_type=prop.property_type,
            home_type=prop.home_type,
            year_built=prop.year_built,
            mls_agent_id=prop.mls_agent_id,
            listing_agent_phone=prop.listing_agent_phone,
            listing_agent_email=prop.listing_agent_email,
            brokerage=prop.brokerage,
            mls_region=prop.mls_region,
            latitude=prop.latitude,
            longitude=prop.longitude,
            living_area=prop.living_area,
            lot_area_value=prop.lot_area_value,
            lot_area_unit=prop.lot_area_unit,
            features=prop.listing_features,
            property_analysis=None,
            commute_data=None,
            raw_data=prop.raw_data,
        )
