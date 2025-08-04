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
        # Neighborhood Overview
        "Local Culture": "neighborhood_overview.local_culture",
        "Neighborhood Vibe": "neighborhood_overview.vibe",
        "Known For": "neighborhood_overview.known_for",
        "Community Events": "neighborhood_overview.community_events",
        "What People Love": "neighborhood_overview.what_people_love",
        "Things to Watch Out For": "neighborhood_overview.things_to_watch_out_for",
        "Population Total": "neighborhood_overview.population_total",
        "Neighborhood Rating": "neighborhood_overview.neighborhood_rating",
        "LGBTQ Representation": "neighborhood_overview.LGBTQ_representation",
        
        # Safety
        "Crime Rating": "safety.crime_rating",
        "Places to Watch Out For": "safety.places_to_watch_out_for",
        "Police Presence": "safety.police_presence",
        "Safety Rating": "safety.safety_rating",
        
        # Culture and Events
        "Local Events": "culture_and_events.local_events",
        "Seasonal Trends": "culture_and_events.seasonal_trends",
        "Community Engagement": "culture_and_events.community_engagement",
        "Culture Rating": "culture_and_events.culture_rating",
        
        # Social Character
        "Income Level": "social_character.income_level",
        "Religiosity": "social_character.religiosity",
        "Cultural Tone": "social_character.cultural_tone",
        "Social Rating": "social_character.social_rating",
        
        # Local Amenities - Restaurants
        "Restaurant 1 Name": "local_amenities.restaurants.0.name",
        "Restaurant 1 Vibe": "local_amenities.restaurants.0.vibe",
        "Restaurant 1 What to Try": "local_amenities.restaurants.0.what_to_try",
        "Restaurant 2 Name": "local_amenities.restaurants.1.name",
        "Restaurant 2 Vibe": "local_amenities.restaurants.1.vibe",
        "Restaurant 2 What to Try": "local_amenities.restaurants.1.what_to_try",
        "Restaurant 3 Name": "local_amenities.restaurants.2.name",
        "Restaurant 3 Vibe": "local_amenities.restaurants.2.vibe",
        "Restaurant 3 What to Try": "local_amenities.restaurants.2.what_to_try",
        
        # Local Amenities - Activities
        "Activity 1 Name": "local_amenities.activities.0.name",
        "Activity 1 Description": "local_amenities.activities.0.description",
        "Activity 2 Name": "local_amenities.activities.1.name",
        "Activity 2 Description": "local_amenities.activities.1.description",
        "Activity 3 Name": "local_amenities.activities.2.name",
        "Activity 3 Description": "local_amenities.activities.2.description",
        
        # Local Amenities - Parks
        "Park 1 Name": "local_amenities.parks.0.name",
        "Park 1 Features": "local_amenities.parks.0.features",
        "Park 2 Name": "local_amenities.parks.1.name",
        "Park 2 Features": "local_amenities.parks.1.features",
        "Park 3 Name": "local_amenities.parks.2.name",
        "Park 3 Features": "local_amenities.parks.2.features",
        
        # Local Amenities - Stores
        "Thrift Store Name": "local_amenities.thrift_store.name",
        "Thrift Store Vibe": "local_amenities.thrift_store.vibe",
        "Grocery Store Name": "local_amenities.grocery_store.name",
        "Grocery Store Vibe": "local_amenities.grocery_store.vibe",
        "Late Night Restaurant Name": "local_amenities.late_night_restaurant.name",
        "Late Night Restaurant Vibe": "local_amenities.late_night_restaurant.vibe",
        
        # Commute
        "Public Transport": "commute.public_transport",
        "Traffic": "commute.traffic",
        "Walkability": "commute.walkability",
        
        # Family Friendly
        "Lots of Kids": "family_friendly.lots_of_kids",
        "Great for Families": "family_friendly.great_for_families",
        "Family Rating": "family_friendly.family_rating",
        
        # Nightlife and Dating
        "Nightlife Rating": "nightlife_and_dating.nightlife_rating",
        "Best Spots": "nightlife_and_dating.best_spots",
        "Dating Scene": "nightlife_and_dating.dating_scene",
      
        # Development
        "Upcoming Changes": "development.upcoming_changes",
        "Zoning or Construction": "development.zoning_or_construction",
        "Gentrification Signs": "development.gentrification_signs",
        "Vacancy or Decay": "development.vacancy_or_decay",
        
        # Environment and Utilities
        "Air Quality": "environment_utilities.air_quality",
        "Noise Pollution": "environment_utilities.noise_pollution",
        "Light Pollution": "environment_utilities.light_pollution",
        "Water Quality": "environment_utilities.water_quality",
        "Electric Costs": "environment_utilities.avg_utility_costs.electric",
        "Gas Costs": "environment_utilities.avg_utility_costs.gas",
        "Water Costs": "environment_utilities.avg_utility_costs.water",
        "Internet Speed": "environment_utilities.internet_speed",
        "Environmental Rating": "environment_utilities.environmental_rating",
        
        # Financial Information
        "Monthly Payment": "financial_information.monthly_payment",
        "Property Taxes": "financial_information.property_taxes",
        "Value Assessment": "financial_information.value_assessment",
        "Investment Potential": "financial_information.investment_potential",
        "Financial Rating": "financial_information.financial_rating",
        
        # Schools (Elementary)
        "Elementary Walking Distance": "schools.schools.elementary.walking_distance",
        "Elementary Known For": "schools.schools.elementary.known_for",
        
        # Schools (Middle)
        "Middle Walking Distance": "schools.schools.middle.walking_distance",
        "Middle Known For": "schools.schools.middle.known_for",
        
        # Schools (High)
        "High Walking Distance": "schools.schools.high.walking_distance",
        "High Known For": "schools.schools.high.known_for",
        "High GPA Average": "schools.schools.high.gpa_avg",
        "High SAT Average": "schools.schools.high.sat_avg",
        "High Graduation Rate": "schools.schools.high.grad_rate",
        "High Top Colleges": "schools.schools.high.top_colleges",
        
        # Extra Tips
        "Parking": "extra_tips.parking",
        "Pet Friendly": "extra_tips.pet_friendly",
        "Cell Service Quality": "extra_tips.cell_service_quality",
        "Other Notable Tips": "extra_tips.other_notable_tips",
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
                elif isinstance(current, list) and key.isdigit():
                    # Handle array indices like "0", "1", "2"
                    index = int(key)
                    if 0 <= index < len(current):
                        current = current[index]
                    else:
                        current = None
                        break
                else:
                    current = None
                    break
            if current not in [None, ""]:
                # Handle boolean values properly
                if isinstance(current, bool):
                    value = "Yes" if current else "No"
                elif isinstance(current, (int, float)):
                    value = str(current)
                elif isinstance(current, dict):
                    # If we get a dict, try to extract a meaningful string representation
                    value = str(current)
                else:
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
        except Exception as e:
            logger.exception(f"❌ Failed to parse or extract report for key={key}")
            results.append({"Address": key, "Error": str(e)})

    df = pd.DataFrame(results)
    if "Address" in df.columns:
        df = df.set_index("Address")
    logger.info(f"📊 Comparison DataFrame ready with shape {df.shape}")
    return df