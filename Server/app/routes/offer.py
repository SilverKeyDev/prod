from __future__ import annotations

from flask import Blueprint, request, jsonify, current_app
from ..services.auth import get_current_user
from ..utils.security.secure_errors import SecureErrorHandler
import requests
import os
import json
import uuid
import traceback
from datetime import datetime
from typing import Dict, Any, Optional
import logging

# Initialize logger
logger = logging.getLogger(__name__)

# Create Blueprint
offer_bp = Blueprint('offer', __name__, url_prefix='/api/v1/offer')

@offer_bp.route('/generate-strategy', methods=['POST'])
def generate_negotiation_strategy():
    """
    Generate a negotiation strategy for a specific property.
    
    Follows the same pattern as the report generation endpoint with proper
    authentication, user/agent logic, and service layer integration.
    
    Expected payload:
    {
        "user_id": "user-uuid",  # Optional - for agent client selection
        "address": "123 Main St, City, State 12345"
    }
    """
    try:
        # Get current user with proper error handling
        from app.services.auth import SecurityException
        try:
            user = get_current_user()
        except SecurityException as se:
            current_app.logger.error(f"🔐 [NEGOTIATION_STRATEGY] Authentication failed: {se.error_tuple}")
            return SecureErrorHandler.security_error_response(se.error_tuple)
        except Exception as e:
            current_app.logger.error(f"🔐 [NEGOTIATION_STRATEGY] Unexpected auth error: {e}")
            return jsonify({'error': 'Authentication failed', 'success': False}), 401
        
        
        data = request.get_json()
        if not data:
            current_app.logger.error("No JSON data provided in request")
            return jsonify({'error': 'No data provided', 'success': False}), 400
        
        address = data.get('address')
        target_user_id = data.get('user_id', None)  # For agent client selection
        
        
        if not address:
            current_app.logger.error("No address provided in request data")
            return jsonify({'error': 'Address is required', 'success': False}), 400
        
        # Determine which user's preferences to use for strategy generation
        preferences_user_id = user.id  # Default to authenticated user
        
        if target_user_id:
            # Agent is generating strategy for a client
            
            # Verify the agent has access to this client
            if not user.is_agent:
                current_app.logger.warning(f"Non-agent user {user.id} attempted to generate strategy for another user {target_user_id}")
                return jsonify({'error': 'Only agents can generate strategies for other users', 'success': False}), 403
            
            # Parse agent's client_ids to verify access
            try:
                import json
                if user.client_ids:
                    client_ids = json.loads(user.client_ids) if isinstance(user.client_ids, str) else user.client_ids
                else:
                    client_ids = []
                
                if target_user_id not in client_ids:
                    current_app.logger.warning(f"Agent {user.id} attempted to access client {target_user_id} who is not in their client list")
                    return jsonify({'error': 'Access denied: User is not your client', 'success': False}), 403
                
                # Ensure preferences_user_id is the same type as user.id (string)
                preferences_user_id = str(target_user_id) if target_user_id else user.id
                
            except Exception as e:
                current_app.logger.error(f"Error parsing agent client_ids: {str(e)}")
                return jsonify({'error': 'Error validating client access', 'success': False}), 500
        
        # Import the strategy generation service
        try:
            from ..services.negotiation import generate_negotiation_strategy
        except ImportError as e:
            current_app.logger.error(f"Failed to import strategy generation service: {str(e)}")
            return SecureErrorHandler.handle_external_api_error(
                e, 'Strategy Generation Service', {'operation': 'import_service'}
            )
        
        # Generate unique filename for the strategy
        strategy_id = str(uuid.uuid4())
        filename = f"negotiation_strategy_{strategy_id}.json"
        
        
        # Fetch user preferences for personalized strategy generation
        user_preferences = None
        try:
            from ..models import UserPreferences
            user_prefs_obj = UserPreferences.query.filter_by(user_id=preferences_user_id).first()
            if user_prefs_obj:
                user_preferences = user_prefs_obj.to_dict()
            else:
                current_app.logger.warning(f"⚠️ [NEGOTIATION_STRATEGY] No user preferences found for user {preferences_user_id}")
        except Exception as e:
            current_app.logger.error(f"❌ [NEGOTIATION_STRATEGY] Failed to load user preferences: {str(e)}")
            # Continue without preferences - service will use defaults
        
        # Fetch detailed property information using get_property_via_address logic
        property_data = None
        commute_data = None
        property_analysis = None
        
        try:
            
            # Import necessary modules for property data fetching
            from ..services.research.graphs.graphic_generation import fetch_travel_time, generate_static_map_url, GOOGLE_MAPS_ID
            from ..models import UserPreferences
            from app.services.research.perplexity_analysis import analyze_property_with_sonar_pro
            
            # Get API keys
            RAPI_HOST = os.getenv("RAPIDAPI_HOST", "us-housing-market-data1.p.rapidapi.com")
            RAPI_KEY = os.getenv("RAPIDAPI_KEY")
            GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
            
            if RAPI_KEY:
                # Call property API to get property details
                url = f"https://{RAPI_HOST}/property"
                headers = {
                    "x-rapidapi-host": RAPI_HOST,
                    "x-rapidapi-key": RAPI_KEY,
                    "Accept": "application/json",
                }
                params = {"address": address.strip()}
                
                r = requests.get(url, headers=headers, params=params, timeout=120)
                
                if r.ok:
                    property_data = r.json()
                    
                    # Extract property address for commute calculations
                    property_address = address.strip()
                    if isinstance(property_data, dict):
                        street = property_data.get('streetAddress', '')
                        city = property_data.get('city', '')
                        state = property_data.get('state', '')
                        zipcode = property_data.get('zipcode', '')
                        if street and city and state:
                            property_address = f"{street}, {city}, {state} {zipcode}".strip()
                    
                    # Get commute data if user preferences and Google Maps API available
                    if user_preferences and GOOGLE_MAPS_API_KEY:
                        commute_data = {'travel_times': [], 'property_address': property_address}
                        
                        # Parse important locations from user preferences
                        important_locations = []
                        locations_data = user_preferences.get('important_locations', [])
                        
                        if isinstance(locations_data, str):
                            try:
                                locations_data = json.loads(locations_data)
                            except json.JSONDecodeError:
                                locations_data = []
                        
                        if isinstance(locations_data, list):
                            important_locations = locations_data
                        
                        # Prepare secondary locations for map generation
                        secondary_locations = []
                        
                        # Calculate travel times for each important location
                        for i, location in enumerate(important_locations):
                            if isinstance(location, dict) and 'address' in location:
                                location_address = location['address']
                                location_name = location.get('name', f'Location {i+1}')
                                
                                travel_time = fetch_travel_time(property_address, location_address, GOOGLE_MAPS_API_KEY)
                                
                                commute_data['travel_times'].append({
                                    'name': location_name,
                                    'address': location_address,
                                    'travel_time': travel_time,
                                    'commute_tolerance': location.get('commute_tolerance', 30)
                                })
                                
                                # Prepare for map generation
                                secondary_locations.append({
                                    'name': location_name,
                                    'address': location_address
                                })
                        
                        # Generate static map URL with commute routes
                        map_url = None
                        if secondary_locations:
                            try:
                                map_url = generate_static_map_url(property_address, secondary_locations, GOOGLE_MAPS_API_KEY, map_id=GOOGLE_MAPS_ID)
                            except Exception as e:
                                current_app.logger.error(f"🗺️ [OFFER] Error generating map URL: {e}")
                        
                        commute_data['map_url'] = map_url
                    
                    # Get property analysis using Perplexity Sonar Pro
                    if user_preferences and isinstance(property_data, dict):
                        
                        # Prepare home object for analysis
                        home_object = {
                            'address': property_address,
                            'price': property_data.get('price', property_data.get('listPrice', 0)),
                            'bedrooms': property_data.get('bedrooms', property_data.get('beds', 0)),
                            'bathrooms': property_data.get('bathrooms', property_data.get('baths', 0)),
                            'livingArea': property_data.get('livingArea', property_data.get('sqft', 0)),
                            'propertyType': property_data.get('propertyType', property_data.get('homeType', 'Unknown')),
                            'lotAreaValue': property_data.get('lotAreaValue'),
                            'lotAreaUnit': property_data.get('lotAreaUnit'),
                            'listingStatus': property_data.get('listingStatus'),
                            'city': property_data.get('city'),
                            'state': property_data.get('state'),
                            'zipcode': property_data.get('zipcode')
                        }
                        
                        # Call the property analysis function
                        analysis_result = analyze_property_with_sonar_pro(user_preferences, home_object)
                        
                        if analysis_result:
                            property_analysis = {
                                'pros': analysis_result.pros,
                                'cons': analysis_result.cons,
                            }

                        else:
                            current_app.logger.warning(f"⚠️ [NEGOTIATION_STRATEGY] Property analysis returned no results")
                else:
                    current_app.logger.warning(f"⚠️ [NEGOTIATION_STRATEGY] Property API call failed: {r.status_code}")
            else:
                current_app.logger.warning(f"⚠️ [NEGOTIATION_STRATEGY] RapidAPI key not configured, skipping property data fetch")
                
        except Exception as e:
            current_app.logger.error(f"❌ [NEGOTIATION_STRATEGY] Error fetching property data: {str(e)}")
            # Continue without property data - strategy will use address only
        
        # Call the strategy generation service
        try:
            # Use the research service to generate negotiation strategy
            # Enhanced with property data, commute info, and property analysis
            enhanced_params = {
                'strategy_type': 'comprehensive',
                'include_market_analysis': True,
                'include_tactics': True,
                'temperature': 0.2,
                'max_tokens': 3000,
                'property_data': property_data,
                'commute_data': commute_data,
                'property_analysis': property_analysis
            }
            
            
            strategy_data = generate_negotiation_strategy(
                address=address,
                user_preferences=user_preferences,
                property_data=property_data,
                commute_data=commute_data,
                property_analysis=property_analysis,
                params=enhanced_params
            )
            
            
            # Return the generated strategy data with enhanced property information
            response_data = {
                'success': True,
                'strategy': strategy_data,
                'property_address': address,
                'strategy_id': strategy_id,
                'filename': filename,
                'generated_at': datetime.utcnow().isoformat(),
                'generated_for_user': preferences_user_id
            }
            
            # Include enhanced property data if available
            if property_data:
                response_data['property_data'] = property_data
            
            if commute_data:
                response_data['commute_data'] = commute_data
            
            if property_analysis:
                response_data['property_analysis'] = property_analysis
            
            return jsonify(response_data), 200
            
        except Exception as e:
            error_msg = f"Strategy generation failed: {str(e)}"
            current_app.logger.error(f"❌ [NEGOTIATION_STRATEGY] {error_msg}")
            current_app.logger.error(traceback.format_exc())
            
            return jsonify({
                'success': False,
                'error': error_msg,
                'traceback': traceback.format_exc()
            }), 500
        
    except Exception as e:
        error_msg = f"Failed to generate negotiation strategy: {str(e)}"
        current_app.logger.error(f"❌ [NEGOTIATION_STRATEGY] {error_msg}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': error_msg,
            'traceback': traceback.format_exc()
        }), 500