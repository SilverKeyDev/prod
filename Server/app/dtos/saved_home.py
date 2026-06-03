"""PropertyCache + UserPropertyLink / HomeNotInterested -> OpenAPI schemas."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING

from pydantic import ValidationError

from app.schemas.generated import NotInterestedHomeItem as NotInterestedHomeItemSchema
from app.schemas.generated import SavedHome as SavedHomeSchema
from app.utils.db.orm_lookup import get_model
from logger import log

if TYPE_CHECKING:
    from app.models.property.home_not_interested import HomeNotInterested as HomeNotInterestedModel
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

    @classmethod
    def from_orm(cls, link: UserPropertyLinkModel) -> SavedHomeSchema:
        """Load PropertyCache from link and build SavedHome schema."""
        from app.models import PropertyCache as PropertyCacheModel

        prop = get_model(PropertyCacheModel, link.property_id)
        if not prop:
            raise ValueError(f"PropertyCache not found for link property_id={link.property_id}")
        return cls.from_property_cache(prop, link)

    @classmethod
    def to_response(cls, link: UserPropertyLinkModel) -> dict:
        """Validated SavedHome dict for JSON responses."""
        return cls.from_orm(link).model_dump(mode="json")


class NotInterestedHomeDTO:
    """Maps HomeNotInterested to OpenAPI NotInterestedHomeItem (HTTP) or export rows."""

    @staticmethod
    def _iso_utc(dt: datetime | None) -> str | None:
        if dt is None:
            return None
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat()

    @classmethod
    def to_response(cls, row: HomeNotInterestedModel) -> dict:
        """HTTP payload: documented NotInterestedHomeItem fields only."""
        data = {
            "id": row.id,
            "address": row.address,
            "latitude": row.latitude,
            "longitude": row.longitude,
            "zpid": row.zpid,
            "mls_home_id": row.mls_home_id,
        }
        try:
            validated = NotInterestedHomeItemSchema.model_validate(data)
        except ValidationError as e:
            log.error(
                "ERRORS",
                f"NotInterestedHome DTO validation failed: {e}",
                e,
            )
            raise ValueError(f"Invalid not-interested home data: {e}") from e
        return validated.model_dump(mode="json")

    @classmethod
    def to_export_row(cls, row: HomeNotInterestedModel) -> dict:
        """GDPR export: full portability fields (not constrained to NotInterestedHomeItem)."""
        return {
            "id": row.id,
            "user_id": row.user_id,
            "address": row.address,
            "isNotInterested": row.is_not_interested,
            "not_interested_history": row.not_interested_history,
            "why": row.why,
            "score": row.score,
            "created_at": cls._iso_utc(row.created_at),
            "updated_at": cls._iso_utc(row.updated_at),
            "zpid": row.zpid,
            "mls_home_id": row.mls_home_id,
            "latitude": row.latitude,
            "longitude": row.longitude,
        }
