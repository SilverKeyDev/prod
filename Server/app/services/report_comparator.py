import json
from io import BytesIO
from typing import List, Dict
from typing import Any, Dict

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


def _extract_summary(data: Dict) -> Dict[str, str]:
    """Extracts summary fields with full recursive fallback and top-level section merge."""
    logger.debug(f"🔍 Extracting summary from data: {json.dumps(data, indent=2)}")

    # Merge all top-level sections into a single structure
    merged_data = {}
    for key, section in data.items():
        if isinstance(section, dict):
            merged_data.update({key: section})  # keep address wrapper
            for subkey, subval in section.items():
                merged_data[subkey] = subval  # flatten it into merged

    field_paths = {
        "Neighborhood Vibe": "vibe",
        "Community Events": "community_events",
        "Neighborhood Rating": "neighborhood_rating",
        "Crime Rating": "safety.crime_rating",
        "Accessibility Rating": "accessibility.accessibility_rating",
        "Wheelchair Friendly": "accessibility.wheelchair_friendly",
        "Development": "development.upcoming_changes",
        "Gentrification": "development.gentrification_signs",
        "Culture Rating": "culture_and_events.culture_rating",
        "Seasonal Trends": "culture_and_events.seasonal_trends",
        "Environmental Rating": "environment_and_utilities.environmental_rating",
        "Air Quality": "environment_and_utilities.air_quality",
        "Internet Speed": "environment_and_utilities.internet_speed",
        "Social Rating": "social_character.social_rating",
        "Income Level": "social_character.income_level",
        "Religiosity": "social_character.religiosity",
        "Financial Rating": "money_stuff.financial_rating",
        "Monthly Rent": "money_stuff.monthly_payment",
        "Commute": "commute.commute_times",
        "Family Rating": "family_friendly.family_rating",
        "Family Notes": "family_friendly.great_for_families",
        "Nightlife Score": "nightlife_and_dating.nightlife_score",
        "Dating Scene": "nightlife_and_dating.dating_scene",
        "Pet Friendly": "extra_tips.pet_friendly",
        "Cell Service": "extra_tips.cell_service_quality",
    }

    def deep_search(obj: Any, target_key: str) -> Any:
        if isinstance(obj, dict):
            for k, v in obj.items():
                if k == target_key:
                    return v
                result = deep_search(v, target_key)
                if result not in [None, ""]:
                    return result
        elif isinstance(obj, list):
            for item in obj:
                result = deep_search(item, target_key)
                if result not in [None, ""]:
                    return result
        return None

    summary = {}
    missing_fields = []

    for label, path in field_paths.items():
        keys = path.split('.')
        current = merged_data
        value = None

        try:
            for key in keys:
                if isinstance(current, dict):
                    current = current.get(key)
                else:
                    current = None
                    break
            if current not in [None, ""]:
                value = str(current)
        except Exception:
            value = None

        if value in [None, ""]:
            search_key = keys[-1]
            fallback = deep_search(merged_data, search_key)
            if fallback not in [None, ""]:
                value = str(fallback)
                logger.debug(f"🔄 Fallback found '{label}' via deep search for '{search_key}'")
            else:
                logger.warning(f"⚠️ Could not find '{label}' via path '{path}' or fallback for key '{search_key}'")
                missing_fields.append(label)
        else:
            logger.debug(f"✅ Found '{label}' via path '{path}'")

        summary[label] = value or ""

    if missing_fields:
        logger.warning(f"Missing fields in report data: {missing_fields}")

    logger.debug(f"✅ Final extracted summary: {json.dumps(summary, indent=2)}")
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
            raw = _download_json_from_s3(key)
        except Exception as primary_exc:
            alt_keys = [
                key.replace('.json', '_RAW.json'),
                key.replace('_RAW.json', '.json'),
                key.replace('.json', '.json.gz'),
                key.replace('_RAW.json', '_RAW.json.gz')
            ]

            for alt_key in alt_keys:
                if alt_key != key:
                    tried_keys.append(alt_key)
                    logger.debug(f"🔁 Trying fallback key: {alt_key}")
                    try:
                        raw = _download_json_from_s3(alt_key)
                        key = alt_key
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