"""Post-analysis leg of the property SSE stream (images, features, persist)."""

from __future__ import annotations

from collections.abc import Callable, Iterator
from datetime import datetime, timedelta, timezone
from typing import Any

from flask import current_app

from app import db
from app.services.property_cache import update_property_images
from app.services.search.features.image_features import extract_and_clean_features

from .property_stream_steps import (
    build_combined_features,
    build_features,
    fetch_zillow_images,
    persist_to_property_cache,
)


def iter_stream_tail_after_analysis(
    *,
    sse: Callable[[str, dict], str],
    is_stale: Callable[[datetime | None, timedelta], bool],
    skip_pros_cons: bool,
    property_analysis: dict[str, Any],
    data: dict[str, Any] | None,
    prop_record: Any,
    params: dict,
    address: str | None,
    current_user: Any,
    commute_data: dict[str, Any],
    images_max_age: timedelta,
    image_features_max_age: timedelta,
) -> Iterator[str]:
    """Yield SSE chunks for images, features, cache persist, and completion."""
    zillow_images: list[str] = []
    if (
        prop_record
        and prop_record.images
        and not is_stale(prop_record.images_fetched_at, images_max_age)
    ):
        zillow_images = prop_record.images if isinstance(prop_record.images, list) else []
        current_app.logger.info("[PROPERTY] Using cached images (%d)", len(zillow_images))
    else:
        zillow_images = fetch_zillow_images(params, data or {})
        if prop_record:
            try:
                d = data or {}
                primary_img = (
                    zillow_images[0]
                    if zillow_images
                    else d.get("imgSrc") or d.get("image") or d.get("image_url") or ""
                )
                update_property_images(prop_record, zillow_images, primary_image_url=primary_img)
                db.session.commit()
            except Exception:
                db.session.rollback()

    yield sse(
        "images",
        zillow_images if isinstance(zillow_images, dict) else {"images": zillow_images or []},
    )

    image_features: dict[str, Any] | None = None
    if (
        prop_record
        and prop_record.image_features
        and not is_stale(prop_record.image_features_generated_at, image_features_max_age)
    ):
        image_features = prop_record.image_features
        current_app.logger.info("[PROPERTY] Using cached image_features")
    else:
        try:
            if zillow_images:
                image_features = extract_and_clean_features(zillow_images[:5])
                if prop_record and image_features and "error" not in (image_features or {}):
                    try:
                        prop_record.image_features = image_features
                        prop_record.image_features_generated_at = datetime.now(timezone.utc)
                        db.session.commit()
                    except Exception:
                        db.session.rollback()
        except Exception as e:
            current_app.logger.error("[PROPERTY] Error extracting image features: %s", e)
            image_features = {"error": "Failed to extract features from images"}

    features: dict[str, Any] = {}
    if (
        prop_record
        and prop_record.listing_features
        and not is_stale(prop_record.basic_data_updated_at, images_max_age)
    ):
        features = prop_record.listing_features
        current_app.logger.info("[PROPERTY] Using cached listing_features")
    else:
        features = build_features(data or {})
        if prop_record:
            try:
                prop_record.listing_features = features
                db.session.commit()
            except Exception:
                db.session.rollback()

    combined_features_data = build_combined_features(features, image_features, current_user)

    if skip_pros_cons:
        yield sse("combined_features", combined_features_data or {})
        yield sse("image_features", image_features or {})
        yield sse("features", features or {})
    else:
        yield sse("image_features", image_features or {})
        yield sse("features", features or {})
        yield sse("combined_features", combined_features_data or {})

    try:
        if current_user:
            persist_to_property_cache(
                user_id=str(current_user.id),
                prop_record=prop_record,
                data=data or {},
                address=address,
                params=params,
                features=features,
                combined_features_data=combined_features_data,
                property_analysis=property_analysis,
                commute_data=commute_data,
                zillow_images=zillow_images,
            )
    except Exception as persist_err:
        current_app.logger.error(
            "[PROPERTY] Failed to persist property details: %s",
            persist_err,
            exc_info=True,
        )

    yield sse("complete", {})
