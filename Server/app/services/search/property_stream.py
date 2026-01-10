"""
Streaming property data generator for Server-Sent Events (SSE).

This module provides a generator function that yields property data chunks
as they become available, allowing the frontend to display data progressively.
"""

import os
import json
import requests
from flask import current_app
from datetime import datetime, timedelta

from app.services.auth.current_user import get_current_user, SecurityException
from app.models import UserPreferences, HomeUniversal
from app.services.research.graphs.graphic_generation import fetch_travel_time, generate_static_map_url, GOOGLE_MAPS_ID
from app.services.search.image_features import extract_and_clean_features
from app.services.search.property_features import extract_property_features
from app.services.research.perplexity_analysis import analyze_property_with_sonar_pro, generate_report_sections_for_property
from app.services.search.feature_overlap_llm import combine_and_check_features
from app.utils.address_format import normalize_address
from app.utils.currency import format_currency
from app import db

RAPI_HOST = "us-housing-market-data1.p.rapidapi.com"
RAPI_KEY = os.getenv('RAPIDAPI_KEY')
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")


def generate_property_stream(params: dict, address: str | None = None):
    """
    Generator function that yields SSE-formatted property data chunks.
    
    Args:
        params: Query parameters for RapidAPI (zpid, property_url, or address)
        address: Optional full address string for fallback
        
    Yields:
        SSE-formatted strings with JSON data for each section
    """
    try:
        # Step 1: Fetch basic property data and yield immediately
        url = f"https://{RAPI_HOST}/property"
        headers = {
            "x-rapidapi-host": RAPI_HOST,
            "x-rapidapi-key": RAPI_KEY,
            "Accept": "application/json",
        }
        r = requests.get(url, headers=headers, params=params, timeout=300)
        
        if not r.ok:
            yield f"data: {json.dumps({'type': 'error', 'data': {'success': False, 'error': 'RAPIDAPI_ERROR', 'status_code': r.status_code, 'details': r.text[:800]}})}\n\n"
            return
        
        data = r.json()
        
        # Handle case where API returns a list instead of a dict
        if isinstance(data, list):
            if len(data) > 0:
                data = data[0]
            else:
                # Empty list - yield error and return
                yield f"data: {json.dumps({'type': 'error', 'data': {'success': False, 'error': 'RAPIDAPI_ERROR', 'status_code': 200, 'details': 'API returned empty list'}})}\n\n"
                return
        
        # Ensure data is a dict before proceeding
        if not isinstance(data, dict):
            yield f"data: {json.dumps({'type': 'error', 'data': {'success': False, 'error': 'RAPIDAPI_ERROR', 'status_code': 200, 'details': f'API returned unexpected data type: {type(data).__name__}'}})}\n\n"
            return
        
        # Yield basic data immediately
        yield f"data: {json.dumps({'type': 'basic', 'data': {'success': True, 'query': params, 'data': data}})}\n\n"
        
        # Always regenerate - skip cache checks
        cached_commute_data = None
        cached_property_analysis = None
        cached_features = None
        
        # # Check cache for existing data (COMMENTED OUT - always regenerate)
        # try:
        #     existing_user = None
        #     try:
        #         existing_user = get_current_user()
        #     except Exception:
        #         existing_user = None
        #         
        #     if existing_user:
        #         cached_record = None
        #         zpid_param = params.get("zpid") if isinstance(params, dict) else None
        #         if zpid_param:
        #             cached_record = HomeUniversal.query.filter_by(user_id=str(existing_user.id), zpid=str(zpid_param)).first()
        #         
        #         if not cached_record and address:
        #             target_norm = None
        #             try:
        #                 target_norm = normalize_address(address.strip())
        #             except Exception:
        #                 target_norm = address.strip().lower()
        #             
        #             for h in HomeUniversal.query.filter_by(user_id=str(existing_user.id)).all():
        #                 if h.address:
        #                     try:
        #                         norm_existing = normalize_address(h.address)
        #                     except Exception:
        #                         norm_existing = h.address.strip().lower()
        #                     if norm_existing == target_norm:
        #                         cached_record = h
        #                         break
        #         
        #         if cached_record:
        #             details_commute_present = bool(cached_record.commute_data and isinstance(cached_record.commute_data, dict) and cached_record.commute_data)
        #             details_analysis_present = bool(cached_record.property_analysis and isinstance(cached_record.property_analysis, dict) and cached_record.property_analysis)
        #             details_features_present = bool(cached_record.features and isinstance(cached_record.features, dict))
        #             all_details_present = details_commute_present and details_analysis_present and details_features_present
        #
        #             updated_at = getattr(cached_record, 'updated_at', None)
        #             recent_cutoff = datetime.utcnow() - timedelta(days=30)
        #             unlocked_recently = bool(updated_at and updated_at >= recent_cutoff)
        #
        #             force_regen = (not all_details_present) and (not unlocked_recently)
        #
        #             if not force_regen:
        #                 if details_commute_present:
        #                     cached_commute_data = cached_record.commute_data
        #                 if details_analysis_present:
        #                     cached_property_analysis = cached_record.property_analysis
        #                 if details_features_present:
        #                     cached_features = cached_record.features
        # except Exception as cache_check_err:
        #     current_app.logger.debug(f"[PROPERTY] Error checking cache: {cache_check_err}")

        # Generate commute_data
        commute_data = cached_commute_data if cached_commute_data else {}
        property_address = None
        if address:
            property_address = address.strip()
        elif data and isinstance(data, dict):
            street = data.get('streetAddress', '')
            city = data.get('city', '')
            state = data.get('state', '')
            zipcode = data.get('zipcode', '')
            if street and city and state:
                property_address = f"{street}, {city}, {state} {zipcode}".strip()
        
        if not cached_commute_data:
            try:
                try:
                    current_user = get_current_user()
                except SecurityException:
                    current_user = None
                except Exception:
                    current_user = None
                    
                if current_user and property_address and GOOGLE_MAPS_API_KEY:
                    user_preferences = UserPreferences.query.filter_by(user_id=current_user.id).first()
                    
                    if user_preferences:
                        important_locations = []
                        locations_data = user_preferences.important_locations
                        
                        if isinstance(locations_data, str):
                            try:
                                locations_data = json.loads(locations_data)
                            except json.JSONDecodeError:
                                current_app.logger.error("🗺️ [PROPERTY] Failed to parse important_locations JSON")
                                locations_data = []
                        
                        if isinstance(locations_data, list):
                            important_locations = locations_data
                                        
                        travel_times = []
                        secondary_locations = []
                        
                        for i, location in enumerate(important_locations):
                            if isinstance(location, dict) and 'address' in location:
                                location_address = location['address']
                                location_name = location.get('name', f'Location {i+1}')
                                
                                travel_time = fetch_travel_time(property_address, location_address, GOOGLE_MAPS_API_KEY)
                                
                                travel_times.append({
                                    'name': location_name,
                                    'address': location_address,
                                    'travel_time': travel_time,
                                    'commute_tolerance': location.get('commute_tolerance', 30)
                                })
                                
                                secondary_locations.append({
                                    'name': location_name,
                                    'address': location_address
                                })
                        
                        commute_data['travel_times'] = travel_times
                        
                        if secondary_locations:
                            try:
                                map_url = generate_static_map_url(property_address, secondary_locations, GOOGLE_MAPS_API_KEY, map_id=GOOGLE_MAPS_ID)
                                commute_data['map_url'] = map_url
                            except Exception as e:
                                current_app.logger.error(f"🗺️ [PROPERTY] Error generating map URL: {e}")
                        
                        commute_data['property_address'] = property_address
                    
            except Exception as e:
                current_app.logger.error(f"🗺️ [PROPERTY] Error calculating commute data: {e}")
                commute_data = {'error': 'Failed to calculate commute data'}
        
        # Yield commute_data
        yield f"data: {json.dumps({'type': 'commute_data', 'data': commute_data})}\n\n"

        # Generate property_analysis
        property_analysis = cached_property_analysis if cached_property_analysis else None
        
        if not cached_property_analysis:
            try:
                try:
                    current_user = get_current_user()
                except SecurityException:
                    current_user = None
                except Exception:
                    current_user = None
                    
                if current_user and data and isinstance(data, dict):
                    user_preferences = UserPreferences.query.filter_by(user_id=current_user.id).first()
                    
                    if user_preferences:
                        user_prefs_dict = user_preferences.to_dict() if hasattr(user_preferences, 'to_dict') else {
                            'home_budget_min': user_preferences.home_budget_min,
                            'home_budget_max': user_preferences.home_budget_max,
                            'occupation': user_preferences.occupation,
                            'age': user_preferences.age,
                            'important_locations': user_preferences.important_locations,
                            'preferred_home_features': user_preferences.preferred_home_features,
                            'deal_breakers': user_preferences.deal_breakers,
                            'gross_income': user_preferences.gross_income,
                            'housing_type': user_preferences.housing_type,
                        }
                        
                        for field in ['important_locations', 'preferred_home_features', 'deal_breakers', 'report_section_priorities']:
                            if hasattr(user_preferences, field):
                                field_value = getattr(user_preferences, field)
                                if isinstance(field_value, str):
                                    try:
                                        user_prefs_dict[field] = json.loads(field_value)
                                    except json.JSONDecodeError:
                                        user_prefs_dict[field] = [] if field == 'report_section_priorities' else []
                                else:
                                    user_prefs_dict[field] = field_value or ([] if field == 'report_section_priorities' else [])
                        
                        home_object = {
                            'address': property_address or data.get('streetAddress', 'Unknown address'),
                            'price': data.get('price', data.get('listPrice', 0)),
                            'bedrooms': data.get('bedrooms', data.get('beds', 0)),
                            'bathrooms': data.get('bathrooms', data.get('baths', 0)),
                            'livingArea': data.get('livingArea', data.get('sqft', 0)),
                            'propertyType': data.get('propertyType', data.get('homeType', 'Unknown')),
                            'lotAreaValue': data.get('lotAreaValue'),
                            'lotAreaUnit': data.get('lotAreaUnit'),
                            'listingStatus': data.get('listingStatus'),
                            'city': data.get('city'),
                            'state': data.get('state'),
                            'zipcode': data.get('zipcode')
                        }
                        
                        # Generate pros/cons first and yield immediately
                        analysis_result = analyze_property_with_sonar_pro(user_prefs_dict, home_object)
                        
                        if analysis_result:
                            property_analysis = {
                                'pros': analysis_result.pros,
                                'cons': analysis_result.cons,
                            }
                        else:
                            property_analysis = {}
                        
                        # Yield partial analysis (pros/cons)
                        yield f"data: {json.dumps({'type': 'property_analysis_partial', 'data': property_analysis.copy()})}\n\n"
                        
                        # Generate additional sections
                        section_names = user_prefs_dict.get('report_section_priorities', [])
                        if section_names and isinstance(section_names, list):
                            additional_sections = generate_report_sections_for_property(
                                section_names=section_names,
                                address=property_address or data.get('streetAddress', 'Unknown address'),
                                user_preferences=user_prefs_dict,
                                property_data=data
                            )
                            
                            if additional_sections:
                                property_analysis.update(additional_sections)
                    
            except Exception as e:
                current_app.logger.error(f"🔍 [PROPERTY] Error during property analysis: {e}")
                import traceback
                current_app.logger.error(traceback.format_exc())
                property_analysis = {'error': 'Failed to analyze property'}
        
        # Yield full property_analysis
        yield f"data: {json.dumps({'type': 'property_analysis', 'data': property_analysis})}\n\n"

        # Fetch images
        zpid_val = None
        if isinstance(params, dict) and params.get("zpid"):
            zpid_val = str(params["zpid"]).strip()
        if not zpid_val and isinstance(data, dict) and data.get("zpid"):
            zpid_val = str(data["zpid"]).strip()
        
        zillow_api_images = []
        if zpid_val:
            try:
                images_url = f"https://{RAPI_HOST}/images"
                images_params = {"zpid": zpid_val}
                images_headers = {
                    "X-RapidAPI-Key": RAPI_KEY,
                    "X-RapidAPI-Host": RAPI_HOST
                }
                
                images_response = requests.get(images_url, headers=images_headers, params=images_params, timeout=300)
                
                if images_response.status_code == 200:
                    images_data = images_response.json()
                    
                    if isinstance(images_data, dict):
                        for key in ['images', 'photos', 'imageList', 'data']:
                            if key in images_data and isinstance(images_data[key], list):
                                for img_item in images_data[key]:
                                    if isinstance(img_item, str):
                                        zillow_api_images.append(img_item)
                                    elif isinstance(img_item, dict):
                                        for url_key in ['url', 'src', 'href', 'link']:
                                            if url_key in img_item and isinstance(img_item[url_key], str):
                                                zillow_api_images.append(img_item[url_key])
                                                break
                
            except Exception as e:
                current_app.logger.warning(f"🖼️ [PROPERTY] Failed to fetch images from Zillow API: {e}")
        
        # Yield images
        yield f"data: {json.dumps({'type': 'images', 'data': zillow_api_images})}\n\n"

        # Extract image features
        image_features = None
        try:
            if zillow_api_images and len(zillow_api_images) > 0:
                images_to_analyze = zillow_api_images[:5]
                image_features = extract_and_clean_features(images_to_analyze)
        except Exception as e:
            current_app.logger.error(f"🔍 [PROPERTY] Error during image feature extraction: {e}")
            image_features = {'error': 'Failed to extract features from images'}
        
        # Yield image_features
        yield f"data: {json.dumps({'type': 'image_features', 'data': image_features})}\n\n"

        # Extract features
        features = cached_features if cached_features else extract_property_features(data)
        
        # Yield features
        yield f"data: {json.dumps({'type': 'features', 'data': features})}\n\n"

        # Combine features and check overlap with user preferences
        combined_features_data = None
        try:
            # Get user preferences for feature overlap checking
            current_user = None
            try:
                current_user = get_current_user()
            except SecurityException:
                current_user = None
            except Exception:
                current_user = None
            
            preferred_features = []
            deal_breakers = []
            
            if current_user:
                user_preferences = UserPreferences.query.filter_by(user_id=current_user.id).first()
                if user_preferences:
                    # Parse preferred_home_features
                    pref_features_data = user_preferences.preferred_home_features
                    if isinstance(pref_features_data, str):
                        try:
                            preferred_features = json.loads(pref_features_data)
                        except json.JSONDecodeError:
                            preferred_features = []
                    elif isinstance(pref_features_data, list):
                        preferred_features = pref_features_data
                    
                    # Parse deal_breakers
                    dealbreakers_data = user_preferences.deal_breakers
                    if isinstance(dealbreakers_data, str):
                        try:
                            deal_breakers = json.loads(dealbreakers_data)
                        except json.JSONDecodeError:
                            deal_breakers = []
                    elif isinstance(dealbreakers_data, list):
                        deal_breakers = dealbreakers_data
            
            # Combine features and check overlap
            combined_features_data = combine_and_check_features(
                features=features if features else {},
                image_features=image_features if image_features else {},
                preferred_features=preferred_features,
                deal_breakers=deal_breakers
            )
            
        except Exception as e:
            current_app.logger.error(f"🔍 [PROPERTY] Error combining features and checking overlap: {e}", exc_info=True)
            # Fallback: just combine without overlap checking
            combined_features_list = []
            if features and isinstance(features, dict):
                for category_features in features.values():
                    if isinstance(category_features, list):
                        combined_features_list.extend(category_features)
            if image_features and isinstance(image_features, dict) and "error" not in image_features:
                clean_features = image_features.get("clean", [])
                if isinstance(clean_features, list):
                    combined_features_list.extend(clean_features)
            combined_features_data = {
                "combined_features": combined_features_list,
                "preferred_overlap": [],
                "dealbreaker_overlap": []
            }
        
        # Yield combined features with overlap information
        yield f"data: {json.dumps({'type': 'combined_features', 'data': combined_features_data})}\n\n"

        # Persist to database (silently)
        try:
            current_user = None
            try:
                current_user = get_current_user()
            except Exception:
                current_user = None

            if current_user:
                # Extract address fields from data
                street = city = state = ""
                zipcode = None
                addr = data.get("address") or {}
                if isinstance(addr, dict):
                    street = (addr.get("streetAddress") or "").strip()
                    city = (addr.get("city") or "").strip()
                    state = (addr.get("state") or "").strip()
                    zipcode = (addr.get("zipcode") or addr.get("zipCode") or None)
                    zipcode = (str(zipcode).strip() if zipcode else None)
                street = street or (data.get("streetAddress") or "").strip()
                city = city or (data.get("city") or "").strip()
                state = state or (data.get("state") or "").strip()
                zipcode = zipcode or (str(data.get("zipcode") or data.get("zipCode") or "").strip() or None)
                
                full_address = None
                if street and city and state:
                    full_address = f"{street}, {city}, {state} {zipcode or ''}".strip()
                else:
                    full_address = data.get('streetAddress') or address or ''

                primary_image = None
                if isinstance(zillow_api_images, list) and zillow_api_images:
                    primary_image = zillow_api_images[0]
                primary_image = primary_image or data.get('imgSrc') or data.get('image') or data.get('image_url') or data.get('imageUrl')

                target_norm = None
                try:
                    target_norm = normalize_address(full_address or '')
                except Exception:
                    target_norm = (full_address or '').strip().lower()

                existing = None
                if full_address:
                    for h in HomeUniversal.query.filter_by(user_id=str(current_user.id)).all():
                        if not h.address:
                            continue
                        try:
                            norm_existing = normalize_address(h.address)
                        except Exception:
                            norm_existing = h.address.strip().lower()
                        if norm_existing == target_norm:
                            existing = h
                            break

                # Store combined_features in features JSON as a special key for persistence
                # (since HomeUniversal model doesn't have a separate combined_features column)
                features_to_save = features.copy() if isinstance(features, dict) else {}
                if combined_features_data:
                    features_to_save['_combined_features'] = combined_features_data

                update_fields = {
                    'address': full_address,
                    'city': city or data.get('city'),
                    'state': state or data.get('state'),
                    'zipcode': zipcode or data.get('zipcode') or data.get('zipCode'),
                    'beds': str(data.get('bedrooms', data.get('beds', '') ) or ''),
                    'baths': str(data.get('bathrooms', data.get('baths', '') ) or ''),
                    'sqft': str(data.get('livingArea', data.get('sqft', '') ) or ''),
                    'lot_size': str(data.get('lotAreaValue', '') or ''),
                    'price': format_currency(data.get('price', data.get('listPrice', '') )),
                    'image_url': primary_image or '',
                    'image_urls': zillow_api_images or [],
                    'zpid': str(data.get('zpid') or (params.get('zpid') if isinstance(params, dict) else '') or ''),
                    'listing_status': data.get('listingStatus'),
                    'property_type': data.get('propertyType', data.get('homeType')),
                    'home_type': data.get('homeType'),
                    'year_built': str(data.get('yearBuilt') or ''),
                    'latitude': data.get('latitude'),
                    'longitude': data.get('longitude'),
                    'living_area': str(data.get('livingArea', '') or ''),
                    'lot_area_value': str(data.get('lotAreaValue', '') or ''),
                    'lot_area_unit': data.get('lotAreaUnit'),
                    'features': features_to_save,  # Includes _combined_features key
                    'property_analysis': property_analysis,
                    'commute_data': commute_data,
                    'raw_data': data,
                }

                if existing:
                    for k, v in update_fields.items():
                        setattr(existing, k, v)
                    # Mark as current when updating
                    existing.current = True
                else:
                    record = HomeUniversal(user_id=str(current_user.id), current=True, **update_fields)
                    db.session.add(record)

                db.session.commit()

        except Exception as persist_err:
            current_app.logger.error(f"[PROPERTY] ⚠️ Failed to persist property details: {persist_err}", exc_info=True)

        # Yield completion signal
        yield f"data: {json.dumps({'type': 'complete', 'data': {}})}\n\n"
        
    except Exception as e:
        current_app.logger.error(f"[PROPERTY] Streaming error: {e}", exc_info=True)
        import traceback
        current_app.logger.error(traceback.format_exc())
        yield f"data: {json.dumps({'type': 'error', 'data': {'error': str(e)}})}\n\n"


def generate_property_stream_compare(params: dict, address: str | None = None):
    """
    Generator function that yields SSE-formatted property data chunks for comparison.
    Same as generate_property_stream but skips pros/cons generation.
    
    Args:
        params: Query parameters for RapidAPI (zpid, property_url, or address)
        address: Optional full address string for fallback
        
    Yields:
        SSE-formatted strings with JSON data for each section (without pros/cons)
    """
    try:
        # Step 1: Fetch basic property data and yield immediately
        url = f"https://{RAPI_HOST}/property"
        headers = {
            "x-rapidapi-host": RAPI_HOST,
            "x-rapidapi-key": RAPI_KEY,
            "Accept": "application/json",
        }
        r = requests.get(url, headers=headers, params=params, timeout=300)
        
        if not r.ok:
            yield f"data: {json.dumps({'type': 'error', 'data': {'success': False, 'error': 'RAPIDAPI_ERROR', 'status_code': r.status_code, 'details': r.text[:800]}})}\n\n"
            return
        
        data = r.json()
        
        # Handle case where API returns a list instead of a dict
        if isinstance(data, list):
            if len(data) > 0:
                data = data[0]
            else:
                # Empty list - yield error and return
                yield f"data: {json.dumps({'type': 'error', 'data': {'success': False, 'error': 'RAPIDAPI_ERROR', 'status_code': 200, 'details': 'API returned empty list'}})}\n\n"
                return
        
        # Ensure data is a dict before proceeding
        if not isinstance(data, dict):
            yield f"data: {json.dumps({'type': 'error', 'data': {'success': False, 'error': 'RAPIDAPI_ERROR', 'status_code': 200, 'details': f'API returned unexpected data type: {type(data).__name__}'}})}\n\n"
            return
        
        # Yield basic data immediately
        yield f"data: {json.dumps({'type': 'basic', 'data': {'success': True, 'query': params, 'data': data}})}\n\n"
        
        # Always regenerate - skip cache checks
        cached_commute_data = None
        cached_property_analysis = None
        cached_features = None
        
        # # Check cache for existing data (COMMENTED OUT - always regenerate)
        # try:
        #     existing_user = None
        #     try:
        #         existing_user = get_current_user()
        #     except Exception:
        #         existing_user = None
        #         
        #     if existing_user:
        #         cached_record = None
        #         zpid_param = params.get("zpid") if isinstance(params, dict) else None
        #         if zpid_param:
        #             cached_record = HomeUniversal.query.filter_by(user_id=str(existing_user.id), zpid=str(zpid_param)).first()
        #         
        #         if not cached_record and address:
        #             target_norm = None
        #             try:
        #                 target_norm = normalize_address(address.strip())
        #             except Exception:
        #                 target_norm = address.strip().lower()
        #             
        #             for h in HomeUniversal.query.filter_by(user_id=str(existing_user.id)).all():
        #                 if h.address:
        #                     try:
        #                         norm_existing = normalize_address(h.address)
        #                     except Exception:
        #                         norm_existing = h.address.strip().lower()
        #                     if norm_existing == target_norm:
        #                         cached_record = h
        #                         break
        #         
        #         if cached_record:
        #             details_commute_present = bool(cached_record.commute_data and isinstance(cached_record.commute_data, dict) and cached_record.commute_data)
        #             details_analysis_present = bool(cached_record.property_analysis and isinstance(cached_record.property_analysis, dict) and cached_record.property_analysis)
        #             details_features_present = bool(cached_record.features and isinstance(cached_record.features, dict))
        #             all_details_present = details_commute_present and details_analysis_present and details_features_present
        #
        #             updated_at = getattr(cached_record, 'updated_at', None)
        #             recent_cutoff = datetime.utcnow() - timedelta(days=30)
        #             unlocked_recently = bool(updated_at and updated_at >= recent_cutoff)
        #
        #             force_regen = (not all_details_present) and (not unlocked_recently)
        #
        #             if not force_regen:
        #                 if details_commute_present:
        #                     cached_commute_data = cached_record.commute_data
        #                 if details_analysis_present:
        #                     # Remove pros/cons and neighborhood_overview from cached analysis
        #                     if isinstance(cached_record.property_analysis, dict):
        #                         cached_property_analysis = cached_record.property_analysis.copy()
        #                         cached_property_analysis.pop('pros', None)
        #                         cached_property_analysis.pop('cons', None)
        #                         cached_property_analysis.pop('neighborhood_overview', None)
        #                     else:
        #                         cached_property_analysis = {}
        #                 if details_features_present:
        #                     cached_features = cached_record.features
        # except Exception as cache_check_err:
        #     current_app.logger.debug(f"[PROPERTY] Error checking cache: {cache_check_err}")

        # Generate commute_data
        commute_data = cached_commute_data if cached_commute_data else {}
        property_address = None
        if address:
            property_address = address.strip()
        elif data and isinstance(data, dict):
            street = data.get('streetAddress', '')
            city = data.get('city', '')
            state = data.get('state', '')
            zipcode = data.get('zipcode', '')
            if street and city and state:
                property_address = f"{street}, {city}, {state} {zipcode}".strip()
        
        if not cached_commute_data:
            try:
                try:
                    current_user = get_current_user()
                except SecurityException:
                    current_user = None
                except Exception:
                    current_user = None
                    
                if current_user and property_address and GOOGLE_MAPS_API_KEY:
                    user_preferences = UserPreferences.query.filter_by(user_id=current_user.id).first()
                    
                    if user_preferences:
                        important_locations = []
                        locations_data = user_preferences.important_locations
                        
                        if isinstance(locations_data, str):
                            try:
                                locations_data = json.loads(locations_data)
                            except json.JSONDecodeError:
                                current_app.logger.error("🗺️ [PROPERTY] Failed to parse important_locations JSON")
                                locations_data = []
                        
                        if isinstance(locations_data, list):
                            important_locations = locations_data
                                        
                        travel_times = []
                        secondary_locations = []
                        
                        for i, location in enumerate(important_locations):
                            if isinstance(location, dict) and 'address' in location:
                                location_address = location['address']
                                location_name = location.get('name', f'Location {i+1}')
                                
                                travel_time = fetch_travel_time(property_address, location_address, GOOGLE_MAPS_API_KEY)
                                
                                travel_times.append({
                                    'name': location_name,
                                    'address': location_address,
                                    'travel_time': travel_time,
                                    'commute_tolerance': location.get('commute_tolerance', 30)
                                })
                                
                                secondary_locations.append({
                                    'name': location_name,
                                    'address': location_address
                                })
                        
                        commute_data['travel_times'] = travel_times
                        
                        if secondary_locations:
                            try:
                                map_url = generate_static_map_url(property_address, secondary_locations, GOOGLE_MAPS_API_KEY, map_id=GOOGLE_MAPS_ID)
                                commute_data['map_url'] = map_url
                            except Exception as e:
                                current_app.logger.error(f"🗺️ [PROPERTY] Error generating map URL: {e}")
                        
                        commute_data['property_address'] = property_address
                    
            except Exception as e:
                current_app.logger.error(f"🗺️ [PROPERTY] Error calculating commute data: {e}")
                commute_data = {'error': 'Failed to calculate commute data'}
        
        # Yield commute_data
        yield f"data: {json.dumps({'type': 'commute_data', 'data': commute_data})}\n\n"

        # Generate property_analysis WITHOUT pros/cons
        property_analysis = cached_property_analysis if cached_property_analysis else {}
        
        # Always check for sections to generate (even if cached data exists, we may need to add new sections)
        try:
            try:
                current_user = get_current_user()
            except SecurityException:
                current_user = None
            except Exception:
                current_user = None
                
            if current_user and data and isinstance(data, dict):
                user_preferences = UserPreferences.query.filter_by(user_id=current_user.id).first()
                
                if user_preferences:
                    user_prefs_dict = user_preferences.to_dict() if hasattr(user_preferences, 'to_dict') else {
                        'home_budget_min': user_preferences.home_budget_min,
                        'home_budget_max': user_preferences.home_budget_max,
                        'occupation': user_preferences.occupation,
                        'age': user_preferences.age,
                        'important_locations': user_preferences.important_locations,
                        'preferred_home_features': user_preferences.preferred_home_features,
                        'deal_breakers': user_preferences.deal_breakers,
                        'gross_income': user_preferences.gross_income,
                        'housing_type': user_preferences.housing_type,
                    }
                    
                    for field in ['important_locations', 'preferred_home_features', 'deal_breakers', 'report_section_priorities']:
                        if hasattr(user_preferences, field):
                            field_value = getattr(user_preferences, field)
                            if isinstance(field_value, str):
                                try:
                                    user_prefs_dict[field] = json.loads(field_value)
                                except json.JSONDecodeError:
                                    user_prefs_dict[field] = [] if field == 'report_section_priorities' else []
                            else:
                                user_prefs_dict[field] = field_value or ([] if field == 'report_section_priorities' else [])
                    
                    # Skip pros/cons generation - only generate additional sections
                    # Filter out neighborhood_overview from section_names
                    section_names = user_prefs_dict.get('report_section_priorities', [])
                    if section_names and isinstance(section_names, list):
                        section_names = [s for s in section_names if s != 'neighborhood_overview']
                        
                        if section_names:  # Only generate if there are sections to generate
                            # Ensure property_analysis is a dict
                            if not isinstance(property_analysis, dict):
                                property_analysis = {}
                            
                            # Check which sections already exist in property_analysis
                            existing_sections = {}
                            sections_to_generate = []
                            
                            for section_name in section_names:
                                if (section_name in property_analysis and 
                                    property_analysis[section_name] is not None and
                                    property_analysis[section_name] != {}):
                                    # Section already exists, don't regenerate
                                    existing_sections[section_name] = property_analysis[section_name]
                                    current_app.logger.info(f"⏭️ [PROPERTY] Skipping {section_name} (already exists in property_analysis)")
                                else:
                                    # Section doesn't exist, add to generation list
                                    sections_to_generate.append(section_name)
                            
                            # Yield existing sections immediately
                            for section_name, section_data in existing_sections.items():
                                yield f"data: {json.dumps({'type': 'property_analysis_section', 'data': {section_name: section_data}})}\n\n"
                            
                            # Only generate sections that don't already exist
                            if sections_to_generate:
                                # Use streaming generator to yield sections individually as they complete
                                from app.services.research.perplexity_analysis import generate_report_sections_for_property_streaming
                                
                                for section_result in generate_report_sections_for_property_streaming(
                                    section_names=sections_to_generate,
                                    address=property_address or data.get('streetAddress', 'Unknown address'),
                                    user_preferences=user_prefs_dict,
                                    property_data=data,
                                    existing_sections=property_analysis
                                ):
                                    section_name = section_result['section_name']
                                    section_data = section_result['section_data']
                                    
                                    # Update property_analysis with this section
                                    property_analysis[section_name] = section_data
                                    
                                    # Yield individual section immediately
                                    yield f"data: {json.dumps({'type': 'property_analysis_section', 'data': {section_name: section_data}})}\n\n"
                
        except Exception as e:
            current_app.logger.error(f"🔍 [PROPERTY] Error during property analysis: {e}")
            import traceback
            current_app.logger.error(traceback.format_exc())
            if not isinstance(property_analysis, dict):
                property_analysis = {}
        
        # Remove neighborhood_overview if it exists (shouldn't be there, but just in case)
        if isinstance(property_analysis, dict):
            property_analysis.pop('neighborhood_overview', None)
        
        # Yield final property_analysis (for backward compatibility and final state)
        # Note: Individual sections are already yielded above as they complete
        yield f"data: {json.dumps({'type': 'property_analysis', 'data': property_analysis})}\n\n"

        # Fetch images
        zpid_val = None
        if isinstance(params, dict) and params.get("zpid"):
            zpid_val = str(params["zpid"]).strip()
        if not zpid_val and isinstance(data, dict) and data.get("zpid"):
            zpid_val = str(data["zpid"]).strip()
        
        property_images = []
        if zpid_val:
            try:
                images_url = f"https://{RAPI_HOST}/images"
                images_params = {"zpid": zpid_val}
                images_headers = {
                    "X-RapidAPI-Key": RAPI_KEY,
                    "X-RapidAPI-Host": RAPI_HOST
                }
                
                images_response = requests.get(images_url, headers=images_headers, params=images_params, timeout=300)
                
                if images_response.status_code == 200:
                    images_data = images_response.json()
                    
                    if isinstance(images_data, dict):
                        for key in ['images', 'photos', 'imageList', 'data']:
                            if key in images_data and isinstance(images_data[key], list):
                                for img_item in images_data[key]:
                                    if isinstance(img_item, str):
                                        property_images.append(img_item)
                                    elif isinstance(img_item, dict):
                                        for url_key in ['url', 'src', 'href', 'link']:
                                            if url_key in img_item and isinstance(img_item[url_key], str):
                                                property_images.append(img_item[url_key])
                                                break
                
            except Exception as e:
                current_app.logger.warning(f"🖼️ [PROPERTY] Failed to fetch images from API: {e}")
        
        # Yield images
        yield f"data: {json.dumps({'type': 'images', 'data': property_images})}\n\n"

        # Extract image features
        image_features = None
        try:
            if property_images and len(property_images) > 0:
                images_to_analyze = property_images[:5]
                image_features = extract_and_clean_features(images_to_analyze)
        except Exception as e:
            current_app.logger.error(f"🔍 [PROPERTY] Error during image feature extraction: {e}")
            image_features = {'error': 'Failed to extract features from images'}
        
        # Extract features
        features = cached_features if cached_features else extract_property_features(data)
        
        # For compare route: combine features and check overlap with user preferences
        combined_features_data = None
        try:
            # Get user preferences for feature overlap checking
            current_user = None
            try:
                current_user = get_current_user()
            except SecurityException:
                current_user = None
            except Exception:
                current_user = None
            
            preferred_features = []
            deal_breakers = []
            
            if current_user:
                user_preferences = UserPreferences.query.filter_by(user_id=current_user.id).first()
                if user_preferences:
                    # Parse preferred_home_features
                    pref_features_data = user_preferences.preferred_home_features
                    if isinstance(pref_features_data, str):
                        try:
                            preferred_features = json.loads(pref_features_data)
                        except json.JSONDecodeError:
                            preferred_features = []
                    elif isinstance(pref_features_data, list):
                        preferred_features = pref_features_data
                    
                    # Parse deal_breakers
                    dealbreakers_data = user_preferences.deal_breakers
                    if isinstance(dealbreakers_data, str):
                        try:
                            deal_breakers = json.loads(dealbreakers_data)
                        except json.JSONDecodeError:
                            deal_breakers = []
                    elif isinstance(dealbreakers_data, list):
                        deal_breakers = dealbreakers_data
            
            # Combine features and check overlap
            combined_features_data = combine_and_check_features(
                features=features if features else {},
                image_features=image_features if image_features else {},
                preferred_features=preferred_features,
                deal_breakers=deal_breakers
            )
            
        except Exception as e:
            current_app.logger.error(f"🔍 [PROPERTY] Error combining features and checking overlap: {e}", exc_info=True)
            # Fallback: just combine without overlap checking
            combined_features_list = []
            if features and isinstance(features, dict):
                for category_features in features.values():
                    if isinstance(category_features, list):
                        combined_features_list.extend(category_features)
            if image_features and isinstance(image_features, dict) and "error" not in image_features:
                clean_features = image_features.get("clean", [])
                if isinstance(clean_features, list):
                    combined_features_list.extend(clean_features)
            combined_features_data = {
                "combined_features": combined_features_list,
                "preferred_overlap": [],
                "dealbreaker_overlap": []
            }
        
        # Yield combined features with overlap information
        yield f"data: {json.dumps({'type': 'combined_features', 'data': combined_features_data})}\n\n"
        
        # Also yield separate features and image_features for backward compatibility
        yield f"data: {json.dumps({'type': 'image_features', 'data': image_features})}\n\n"
        yield f"data: {json.dumps({'type': 'features', 'data': features})}\n\n"

        # Persist to database (silently)
        try:
            current_user = None
            try:
                current_user = get_current_user()
            except Exception:
                current_user = None

            if current_user:
                # Extract address fields from data
                street = city = state = ""
                zipcode = None
                addr = data.get("address") or {}
                if isinstance(addr, dict):
                    street = (addr.get("streetAddress") or "").strip()
                    city = (addr.get("city") or "").strip()
                    state = (addr.get("state") or "").strip()
                    zipcode = (addr.get("zipcode") or addr.get("zipCode") or None)
                    zipcode = (str(zipcode).strip() if zipcode else None)
                street = street or (data.get("streetAddress") or "").strip()
                city = city or (data.get("city") or "").strip()
                state = state or (data.get("state") or "").strip()
                zipcode = zipcode or (str(data.get("zipcode") or data.get("zipCode") or "").strip() or None)
                
                full_address = None
                if street and city and state:
                    full_address = f"{street}, {city}, {state} {zipcode or ''}".strip()
                else:
                    full_address = data.get('streetAddress') or address or ''

                primary_image = None
                if isinstance(property_images, list) and property_images:
                    primary_image = property_images[0]
                primary_image = primary_image or data.get('imgSrc') or data.get('image') or data.get('image_url') or data.get('imageUrl')

                target_norm = None
                try:
                    target_norm = normalize_address(full_address or '')
                except Exception:
                    target_norm = (full_address or '').strip().lower()

                existing = None
                if full_address:
                    for h in HomeUniversal.query.filter_by(user_id=str(current_user.id)).all():
                        if not h.address:
                            continue
                        try:
                            norm_existing = normalize_address(h.address)
                        except Exception:
                            norm_existing = h.address.strip().lower()
                        if norm_existing == target_norm:
                            existing = h
                            break

                # Store combined_features in features JSON as a special key for persistence
                # (since HomeUniversal model doesn't have a separate combined_features column)
                features_to_save = features.copy() if isinstance(features, dict) else {}
                if combined_features_data:
                    features_to_save['_combined_features'] = combined_features_data
                
                update_fields = {
                    'address': full_address,
                    'city': city or data.get('city'),
                    'state': state or data.get('state'),
                    'zipcode': zipcode or data.get('zipcode') or data.get('zipCode'),
                    'beds': str(data.get('bedrooms', data.get('beds', '') ) or ''),
                    'baths': str(data.get('bathrooms', data.get('baths', '') ) or ''),
                    'sqft': str(data.get('livingArea', data.get('sqft', '') ) or ''),
                    'lot_size': str(data.get('lotAreaValue', '') or ''),
                    'price': format_currency(data.get('price', data.get('listPrice', '') )),
                    'image_url': primary_image or '',
                    'image_urls': property_images or [],
                    'zpid': str(data.get('zpid') or (params.get('zpid') if isinstance(params, dict) else '') or ''),
                    'listing_status': data.get('listingStatus'),
                    'property_type': data.get('propertyType', data.get('homeType')),
                    'home_type': data.get('homeType'),
                    'year_built': str(data.get('yearBuilt') or ''),
                    'latitude': data.get('latitude'),
                    'longitude': data.get('longitude'),
                    'living_area': str(data.get('livingArea', '') or ''),
                    'lot_area_value': str(data.get('lotAreaValue', '') or ''),
                    'lot_area_unit': data.get('lotAreaUnit'),
                    'features': features_to_save,  # Includes _combined_features key
                    'property_analysis': property_analysis,  # Without pros/cons
                    'commute_data': commute_data,
                    'raw_data': data,
                }

                if existing:
                    for k, v in update_fields.items():
                        setattr(existing, k, v)
                    # Mark as current when updating
                    existing.current = True
                else:
                    record = HomeUniversal(user_id=str(current_user.id), current=True, **update_fields)
                    db.session.add(record)

                db.session.commit()

        except Exception as persist_err:
            current_app.logger.error(f"[PROPERTY] ⚠️ Failed to persist property details: {persist_err}", exc_info=True)

        # Yield completion signal
        yield f"data: {json.dumps({'type': 'complete', 'data': {}})}\n\n"
        
    except Exception as e:
        current_app.logger.error(f"[PROPERTY] Streaming error: {e}", exc_info=True)
        import traceback
        current_app.logger.error(traceback.format_exc())
        yield f"data: {json.dumps({'type': 'error', 'data': {'error': str(e)}})}\n\n"
