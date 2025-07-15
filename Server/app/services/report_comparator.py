import json
from io import BytesIO
from typing import List, Dict

import pandas as pd
import logging

from flask import current_app
from .s3_service import s3_service

logger = logging.getLogger(__name__)


def _download_json_from_s3(s3_key: str) -> Dict:
    """Download and parse JSON report stored in S3."""
    if not s3_key:
        raise ValueError("s3_key is required")

    if s3_service.s3_client is None:
        raise RuntimeError("S3 client not initialised")

    bucket_name = current_app.config.get("S3_BUCKET_NAME_PDFS")
    if not bucket_name:
        raise RuntimeError("S3_BUCKET_NAME_PDFS config missing")

    logger.debug(f"🔽 Attempting to download: Bucket={bucket_name}, Key={s3_key}")
    buffer = BytesIO()

    try:
        s3_service.s3_client.download_fileobj(bucket_name, s3_key, buffer)
    except Exception as e:
        logger.error(f"❌ Download failed for key={s3_key}: {e}")
        raise

    buffer.seek(0)
    raw_json = buffer.read().decode("utf-8")

    logger.debug(f"📄 Raw JSON ({len(raw_json)} bytes) for {s3_key}: {raw_json[:200]}...")
    parsed_data = json.loads(raw_json)
    logger.debug(f"✅ Successfully parsed JSON for {s3_key}")
    return parsed_data


def _extract_summary(data: Dict) -> Dict:
    """Extracts summary fields from report data."""
    logger.debug(f"🔍 Extracting summary from data: {json.dumps(data, indent=2)}")
    
    # Mapping of desired fields to their locations in the JSON data
    field_mappings = {
        "Neighborhood Vibe": ("neighborhood_overview", "vibe"),
        "Nearby Amenities": ("cool_stuff_nearby", None), # Special handling for nested objects
        "Community Events": ("neighborhood_overview", "community_events"),
        "Neighborhood Rating": ("neighborhood_overview", "neighborhood_rating"),
        "Crime Rating": ("safety", "crime_rating"),
        "Crime Score": ("safety", "crime_score"),
        "Flood/Fire Risk": ("safety", "flood_or_fire_risk"),
        "Accessibility Rating": ("accessibility", "accessibility_rating"),
        "Wheelchair Friendly": ("accessibility", "wheelchair_friendly"),
        "Development": ("development", "upcoming_changes"),
        "Gentrification": ("development", "gentrification_signs"),
        "Culture Rating": ("culture_and_events", "culture_rating"),
        "Seasonal Trends": ("culture_and_events", "seasonal_trends"),
        "Environmental Rating": ("environment_and_utilities", "environmental_rating"),
        "Air Quality": ("environment_and_utilities", "air_quality"),
        "Internet Speed": ("environment_and_utilities", "internet_speed"),
        "Social Rating": ("social_character", "social_rating"),
        "Income Level": ("social_character", "income_level"),
        "Religiosity": ("social_character", "religiosity"),
        "Financial Rating": ("money_stuff", "financial_rating"),
        "Monthly Rent": ("money_stuff", "monthly_payment"),
        "Commute": ("commute", "commute_times"),
        "Commute Rating": ("commute", "commute_rating"),
        "Family Rating": ("family_friendly", "family_rating"),
        "Family Notes": ("family_friendly", "great_for_families"),
        "Nightlife Score": ("young_people_vibes", "nightlife_score"),
        "Dating Scene": ("young_people_vibes", "dating_scene"),
        "Pet Friendly": ("extra_tips", "pet_friendly"),
        "Cell Service": ("extra_tips", "cell_service_quality"),
    }

    summary = {}
    missing_fields = []

    for field, (section, key) in field_mappings.items():
        source_dict = data.get(section, {})
        
        if key:
            value = source_dict.get(key)
            if value is not None:
                summary[field] = value
            else:
                missing_fields.append(field)
        elif section == "cool_stuff_nearby":
            # Special handler for amenities
            amenities = []
            if source_dict.get("restaurants"): amenities.append("Restaurants")
            if source_dict.get("activities"): amenities.append("Activities")
            if source_dict.get("parks"): amenities.append("Parks")
            if source_dict.get("shopping"): amenities.append("Shopping")
            summary[field] = ", ".join(amenities) if amenities else None
            if not summary[field]:
                missing_fields.append(field)

    if missing_fields:
        logger.warning(f"Missing fields in report data: {missing_fields}")

    logger.debug(f"✅ Extracted summary: {summary}")
    return summary


def compare_reports(s3_keys: List[str]) -> pd.DataFrame:
    """Given a list of S3 keys, download each JSON and return flattened summary list."""
    logger.info(f"🔍 Comparing {len(s3_keys)} reports")
    results = []
    logger.debug(f"🧵 S3 keys to process: {s3_keys}")

    for key in s3_keys:
        logger.debug(f"📌 Processing key: {key}")
        raw = None
        tried_keys = [key]

        try:
            # First try original key
            raw = _download_json_from_s3(key)
        except Exception as primary_exc:
            # Attempt fallbacks
            base_key = key
            alt_keys = set()
            
            for alt_key in alt_keys:
                tried_keys.append(alt_key)
                logger.debug(f"🔁 Trying fallback key: {alt_key}")
                try:
                    raw = _download_json_from_s3(alt_key)
                    key = alt_key  # update to working key
                    break
                except Exception:
                    continue

            if raw is None:
                logger.error(f"❌ All attempts failed for: {tried_keys}")
                results.append({"Address": key, "Error": f"Could not download any of: {tried_keys}"})
                continue

        try:
            address = raw.get("address") or key.split("/")[-1].replace("_RAW.json", "").replace(".json", "")
            summary = _extract_summary(raw)
            summary["Address"] = address
            results.append(summary)
            logger.debug(f"✅ Extracted summary for {address}")
        except Exception as e:
            logger.exception(f"❌ Failed to parse or extract report for key={key}")
            results.append({"Address": key, "Error": str(e)})

    df = pd.DataFrame(results)
    if "Address" in df.columns:
        df = df.set_index("Address")
    logger.info(f"📊 Comparison DataFrame ready with shape {df.shape}")
    return df