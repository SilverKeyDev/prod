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

    # Get the first location key
    location_key = next(iter(data.keys()), None)
    if not location_key:
        raise ValueError("No location key found in report data")
    
    location_data = data.get(location_key, {})

    # Mapping of fields to dot-separated paths
    field_mappings = {
        "Neighborhood Vibe": ("vibe", location_data),
        "Community Events": ("community_events", location_data),
        "Neighborhood Rating": ("neighborhood_rating", location_data),
        "Crime Rating": ("safety.crime_rating", data),
        "Accessibility Rating": ("accessibility.accessibility_rating", data),
        "Wheelchair Friendly": ("accessibility.wheelchair_friendly", data),
        "Development": ("development.upcoming_changes", data),
        "Gentrification": ("development.gentrification_signs", data),
        "Culture Rating": ("culture_and_events.culture_rating", data),
        "Seasonal Trends": ("culture_and_events.seasonal_trends", data),
        "Environmental Rating": ("environment_and_utilities.environmental_rating", data),
        "Air Quality": ("environment_and_utilities.air_quality", data),
        "Internet Speed": ("environment_and_utilities.internet_speed", data),
        "Social Rating": ("social_character.social_rating", data),
        "Income Level": ("social_character.income_level", data),
        "Religiosity": ("social_character.religiosity", data),
        "Financial Rating": ("money_stuff.financial_rating", data),
        "Monthly Rent": ("money_stuff.monthly_payment", data),
        "Commute": ("commute.commute_times", data),
        "Family Rating": ("family_friendly.family_rating", data),
        "Family Notes": ("family_friendly.great_for_families", data),
        "Nightlife Score": ("nightlife_and_dating.nightlife_score", data),
        "Dating Scene": ("nightlife_and_dating.dating_scene", data),
        "Pet Friendly": ("extra_tips.pet_friendly", data),
        "Cell Service": ("extra_tips.cell_service_quality", data),
    }

    summary = {}
    missing_fields = []

    for field, (path, base) in field_mappings.items():
        path_parts = path.split('.')
        current = base
        for part in path_parts:
            if isinstance(current, dict):
                current = current.get(part, None)
            else:
                current = None
                break

        if current is not None:
            summary[field] = str(current)
            logger.debug(f"✅ Found field '{field}' at path '{path}'")
        else:
            summary[field] = ""
            logger.debug(f"🔍 Field '{field}' not found at path '{path}'")
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
            # Try different possible extensions
            alt_keys = [
                key.replace('.json', '_RAW.json'),
                key.replace('_RAW.json', '.json'),
                key.replace('.json', '.json.gz'),
                key.replace('_RAW.json', '_RAW.json.gz')
            ]
            
            for alt_key in alt_keys:
                if alt_key != key:  # Don't try the original key again
                    tried_keys.append(alt_key)
                    logger.debug(f"🔁 Trying fallback key: {alt_key}")
                    try:
                        raw = _download_json_from_s3(alt_key)
                        key = alt_key  # update to working key
                        break
                    except Exception as e:
                        logger.debug(f"❌ Failed to download {alt_key}: {e}")
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