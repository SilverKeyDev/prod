"""Internal streaming property generator (SSE); use property_stream for public API."""

import json
import os
import traceback
from datetime import datetime, timedelta, timezone
from typing import Any

from flask import current_app

from app import db
from app.services.aggregation import get_preferences_dict_optional
from app.services.auth import SecurityException, get_current_user
from app.services.property_cache import (
    get_cached_sections_dict,
    get_or_create_property,
    get_property_by_zpid_or_address,
    get_user_commute,
    get_user_highlights,
    save_section,
    save_user_commute,
    save_user_highlights,
    should_regenerate_section,
    update_property_basic_data,
    update_property_images,
    update_property_price,
)
from app.services.property_cache.section_cache import get_cached_sections
from app.services.research.perplexity import (
    analyze_property_with_sonar_pro,
    generate_report_sections_for_property,
    generate_report_sections_for_property_streaming,
)
from app.services.research.property.property_analysis import (
    DEFAULT_SECTION_ORDER,
    prepare_user_preferences_dict,
)
from app.services.research.property.property_analysis_payload import (
    finalize_property_analysis_payload,
)
from app.services.search.features.image_features import extract_and_clean_features
from app.services.search.scoring import (
    ResearchAnalysisOptions,
    attach_analysis_cache_meta,
    build_research_analysis_options,
    highlights_context_payload,
    public_property_analysis,
    resolve_highlights_counts_and_signature,
)

from .property_stream_steps import (
    build_combined_features,
    build_commute_data,
    build_features,
    fetch_basic_property_data,
    fetch_zillow_images,
    get_property_address,
    persist_to_property_cache,
)

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
_IMAGES_MAX_AGE = timedelta(days=7)
_IMAGE_FEATURES_MAX_AGE = timedelta(days=30)
_BASIC_DATA_MAX_AGE = timedelta(days=1)


def _sse(type_name: str, data: dict) -> str:
    return f"data: {json.dumps({'type': type_name, 'data': data})}\n\n"


def _is_stale(timestamp: datetime | None, max_age: timedelta) -> bool:
    if timestamp is None:
        return True
    return datetime.now(timezone.utc) - timestamp > max_age


def _generate_property_stream_internal(
    params: dict,
    address: str | None,
    skip_pros_cons: bool = False,
    research_body: dict[str, Any] | None = None,
):
    """Internal generator: shared-cache-aware property stream.

    1. Look up shared PropertyCache (by zpid/address).
    2. Always refresh price from Slipstream API.
    3. Serve cached images / features / analysis sections when fresh.
    4. Commute and highlights are per-user.
    """
    try:
        # ----- resolve current user -----
        current_user = None
        try:
            current_user = get_current_user()
        except (SecurityException, Exception):
            current_user = None

        analysis_options: ResearchAnalysisOptions | None = None
        if current_user:
            analysis_options, opt_err = build_research_analysis_options(
                current_user, research_body or {}
            )
            if opt_err is not None:
                yield _sse("error", opt_err)
                return

        # ----- shared cache lookup -----
        zpid_param = params.get("zpid") if isinstance(params, dict) else None
        cached_prop = get_property_by_zpid_or_address(zpid=zpid_param, address=address)

        # ----- basic data: always fetch fresh (price changes) -----
        data, err = fetch_basic_property_data(params)
        if err is not None:
            # If we have a shared cache hit, use cached raw_data as fallback
            if cached_prop and cached_prop.raw_data:
                data = cached_prop.raw_data
                current_app.logger.info("[PROPERTY] API fetch failed but using cached raw_data")
            else:
                yield _sse("error", err)
                return

        # Update price on basic event
        from app.utils.currency import format_currency, resolve_price

        fresh_price = format_currency(resolve_price(data))

        yield _sse("basic", {"success": True, "query": params, "data": data})

        property_address = get_property_address(data or {}, address)

        # ----- get or create shared PropertyCache row -----
        try:
            prop_record = get_or_create_property(zpid=zpid_param, address=property_address)
            update_property_basic_data(prop_record, data, address=property_address, params=params)
            update_property_price(prop_record, fresh_price)
            db.session.commit()
        except Exception as cache_err:
            current_app.logger.warning(
                "[PROPERTY] Failed to upsert PropertyCache: %s", cache_err, exc_info=True
            )
            db.session.rollback()
            prop_record = cached_prop  # fall back to whatever we found earlier

        # ----- commute (per-user) -----
        commute_data: dict[str, Any] = {}
        user_id_str = str(current_user.id) if current_user else None

        if prop_record and user_id_str:
            cached_commute = get_user_commute(user_id_str, prop_record.id)
            if cached_commute and cached_commute.commute_data:
                commute_data = cached_commute.commute_data
                current_app.logger.info("[PROPERTY] Using cached commute for user")
            else:
                commute_prefs = (analysis_options.preferences if analysis_options else None) or None
                try:
                    commute_data = build_commute_data(
                        property_address,
                        current_user,
                        GOOGLE_MAPS_API_KEY,
                        user_prefs_dict=commute_prefs,
                    )
                    if not commute_data and property_address:
                        commute_data["property_address"] = property_address
                except Exception as e:
                    current_app.logger.error("[PROPERTY] Error calculating commute: %s", e)
                    commute_data = {"error": "Failed to calculate commute data"}
                # persist
                try:
                    save_user_commute(user_id_str, prop_record.id, commute_data)
                    db.session.commit()
                except Exception:
                    db.session.rollback()
        else:
            commute_prefs = (analysis_options.preferences if analysis_options else None) or None
            try:
                commute_data = build_commute_data(
                    property_address,
                    current_user,
                    GOOGLE_MAPS_API_KEY,
                    user_prefs_dict=commute_prefs,
                )
                if not commute_data and property_address:
                    commute_data["property_address"] = property_address
            except Exception as e:
                current_app.logger.error("[PROPERTY] Error calculating commute: %s", e)
                commute_data = {"error": "Failed to calculate commute data"}

        yield _sse("commute_data", commute_data)

        # ----- analysis sections (shared) + highlights (per-user) -----
        property_analysis: dict[str, Any] = {}

        # Load cached shared sections
        cached_sections: dict[str, Any] = {}
        if prop_record:
            cached_sections = get_cached_sections_dict(prop_record.id)

        if skip_pros_cons:
            # Compare mode: stream shared sections, no highlights
            section_names = [s for s in DEFAULT_SECTION_ORDER if s != "neighborhood"]
            sections_to_generate: list[str] = []

            for sn in section_names:
                if sn in cached_sections:
                    section_row = None
                    for s in get_cached_sections(prop_record.id) if prop_record else []:
                        if s.section_name == sn:
                            section_row = s
                            break
                    if not should_regenerate_section(section_row):
                        property_analysis[sn] = cached_sections[sn]
                        yield _sse("property_analysis_section", {sn: cached_sections[sn]})
                        continue
                sections_to_generate.append(sn)

            if sections_to_generate and data:
                user_prefs_dict = {}
                if current_user:
                    raw_prefs: dict[str, Any] = {}
                    if analysis_options is not None:
                        raw_prefs = analysis_options.preferences
                    else:
                        raw_prefs = get_preferences_dict_optional(str(current_user.id)) or {}
                    user_prefs_dict = prepare_user_preferences_dict(raw_prefs)

                for section_result in generate_report_sections_for_property_streaming(
                    section_names=sections_to_generate,
                    address=property_address or data.get("streetAddress", "Unknown address"),
                    user_preferences=user_prefs_dict,
                    property_data=data,
                    existing_sections=property_analysis,
                ):
                    sn = section_result["section_name"]
                    sd = section_result["section_data"]
                    property_analysis[sn] = sd
                    yield _sse("property_analysis_section", {sn: sd})
                    # Persist shared section
                    if prop_record:
                        try:
                            save_section(prop_record.id, sn, sd)
                            db.session.commit()
                        except Exception:
                            db.session.rollback()

        else:
            # Normal mode: highlights (per-user) + shared sections
            try:
                if current_user and data and analysis_options is not None:
                    user_prefs_dict = prepare_user_preferences_dict(analysis_options.preferences)

                    # Check cached highlights
                    highlights_from_cache = False
                    if prop_record and user_id_str:
                        cached_hl = get_user_highlights(user_id_str, prop_record.id)
                        if cached_hl and cached_hl.pros is not None:
                            adj_p, adj_c, adj_sig, mscore = resolve_highlights_counts_and_signature(
                                analysis_options, data
                            )
                            if cached_hl.analysis_cache_signature == adj_sig:
                                property_analysis = {
                                    "pros": cached_hl.pros,
                                    "cons": cached_hl.cons,
                                }
                                if cached_hl.highlights_context:
                                    property_analysis[
                                        "highlights_context"
                                    ] = cached_hl.highlights_context
                                highlights_from_cache = True
                                current_app.logger.info(
                                    "[PROPERTY] Using cached highlights for user"
                                )

                    if not highlights_from_cache:
                        home_object = {
                            "address": property_address
                            or data.get("streetAddress", "Unknown address"),
                            "price": data.get("price", data.get("listPrice", 0)),
                            "bedrooms": data.get("bedrooms", data.get("beds", 0)),
                            "bathrooms": data.get("bathrooms", data.get("baths", 0)),
                            "livingArea": data.get("livingArea", data.get("sqft", 0)),
                            "propertyType": data.get(
                                "propertyType", data.get("homeType", "Unknown")
                            ),
                            "lotAreaValue": data.get("lotAreaValue"),
                            "lotAreaUnit": data.get("lotAreaUnit"),
                            "listingStatus": data.get("listingStatus"),
                            "city": data.get("city"),
                            "state": data.get("state"),
                            "zipcode": data.get("zipcode"),
                        }
                        adj_p, adj_c, adj_sig, mscore = resolve_highlights_counts_and_signature(
                            analysis_options, data
                        )
                        sonar_ctx = {
                            "viewer_is_agent": analysis_options.viewer_is_agent,
                            "profile_subject": analysis_options.profile_subject,
                            "pros_count": adj_p,
                            "cons_count": adj_c,
                            "bullet_style": analysis_options.bullet_style,
                        }
                        analysis_result = analyze_property_with_sonar_pro(
                            user_prefs_dict, home_object, analysis_context=sonar_ctx
                        )
                        if analysis_result:
                            property_analysis = {
                                "pros": analysis_result.pros,
                                "cons": analysis_result.cons,
                            }
                            hc = highlights_context_payload(mscore)
                            if hc:
                                property_analysis["highlights_context"] = hc
                        else:
                            property_analysis = {}

                        # Persist user-specific highlights
                        if prop_record and user_id_str and property_analysis:
                            try:
                                save_user_highlights(
                                    user_id_str,
                                    prop_record.id,
                                    pros=property_analysis.get("pros"),
                                    cons=property_analysis.get("cons"),
                                    highlights_context=property_analysis.get("highlights_context"),
                                    analysis_cache_signature=adj_sig,
                                )
                                db.session.commit()
                            except Exception:
                                db.session.rollback()

                    yield _sse(
                        "property_analysis_partial",
                        public_property_analysis(property_analysis).copy(),
                    )

                    # Shared analysis sections
                    section_names = DEFAULT_SECTION_ORDER
                    sections_to_generate_normal: list[str] = []
                    for sn in section_names:
                        if sn in cached_sections:
                            section_row = None
                            for s in get_cached_sections(prop_record.id) if prop_record else []:
                                if s.section_name == sn:
                                    section_row = s
                                    break
                            if not should_regenerate_section(section_row):
                                property_analysis[sn] = cached_sections[sn]
                                continue
                        sections_to_generate_normal.append(sn)

                    if sections_to_generate_normal:
                        additional_sections = generate_report_sections_for_property(
                            section_names=sections_to_generate_normal,
                            address=property_address
                            or data.get("streetAddress", "Unknown address"),
                            user_preferences=user_prefs_dict,
                            property_data=data,
                        )
                        if additional_sections:
                            property_analysis.update(additional_sections)
                            # Persist new shared sections
                            if prop_record:
                                try:
                                    for sn, sd in additional_sections.items():
                                        save_section(prop_record.id, sn, sd)
                                    db.session.commit()
                                except Exception:
                                    db.session.rollback()

                    # Merge cached sections that were not regenerated
                    for sn, sd in cached_sections.items():
                        if sn not in property_analysis:
                            property_analysis[sn] = sd

                    if property_analysis and "error" not in property_analysis:
                        property_analysis = attach_analysis_cache_meta(property_analysis, adj_sig)
            except Exception as e:
                current_app.logger.error("[PROPERTY] Error during property analysis: %s", e)
                current_app.logger.error(traceback.format_exc())
                property_analysis = {"error": "Failed to analyze property"}

        property_analysis = finalize_property_analysis_payload(
            property_analysis,
            property_address or (data or {}).get("streetAddress"),
            for_compare_stream=skip_pros_cons,
        )
        yield _sse("property_analysis", public_property_analysis(property_analysis))

        # ----- images (shared) -----
        zillow_images: list[str] = []
        if (
            prop_record
            and prop_record.images
            and not _is_stale(prop_record.images_fetched_at, _IMAGES_MAX_AGE)
        ):
            zillow_images = prop_record.images if isinstance(prop_record.images, list) else []
            current_app.logger.info("[PROPERTY] Using cached images (%d)", len(zillow_images))
        else:
            zillow_images = fetch_zillow_images(params, data or {})
            if prop_record:
                try:
                    primary_img = (
                        zillow_images[0]
                        if zillow_images
                        else data.get("imgSrc") or data.get("image") or data.get("image_url") or ""
                    )
                    update_property_images(
                        prop_record, zillow_images, primary_image_url=primary_img
                    )
                    db.session.commit()
                except Exception:
                    db.session.rollback()

        yield _sse(
            "images",
            zillow_images if isinstance(zillow_images, dict) else {"images": zillow_images or []},
        )

        # ----- image features (shared, expensive) -----
        image_features: dict[str, Any] | None = None
        if (
            prop_record
            and prop_record.image_features
            and not _is_stale(prop_record.image_features_generated_at, _IMAGE_FEATURES_MAX_AGE)
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

        # ----- listing features (shared) -----
        features: dict[str, Any] = {}
        if (
            prop_record
            and prop_record.listing_features
            and not _is_stale(prop_record.basic_data_updated_at, _IMAGES_MAX_AGE)
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
            yield _sse("combined_features", combined_features_data or {})
            yield _sse("image_features", image_features or {})
            yield _sse("features", features or {})
        else:
            yield _sse("image_features", image_features or {})
            yield _sse("features", features or {})
            yield _sse("combined_features", combined_features_data or {})

        # ----- persist to PropertyCache + UserPropertyLink -----
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

        yield _sse("complete", {})

    except Exception as e:
        current_app.logger.error("[PROPERTY] Streaming error: %s", e, exc_info=True)
        current_app.logger.error(traceback.format_exc())
        yield _sse("error", {"error": str(e)})
