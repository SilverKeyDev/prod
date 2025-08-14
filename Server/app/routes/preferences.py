from flask import Blueprint, request, jsonify, current_app
from app.models.user import User
from app.models.user_preferences import UserPreferences
from app import db
from app.services.chatbot.chatbot_utils import generate_action_plan
from jose import jwk, jwt as jose_jwt
from jose.exceptions import JWTError, JWTClaimsError, ExpiredSignatureError
import json
import logging
import os
import requests

logger = logging.getLogger(__name__)
preferences_bp = Blueprint('preferences', __name__, url_prefix='/api/v1/preferences')

# JWT Configuration
COGNITO_REGION = os.getenv("S3_REGION", "us-east-2")
COGNITO_POOL_ID = os.getenv("COGNITO_USER_POOL_ID")
COGNITO_CLIENT_ID = os.getenv("COGNITO_CLIENT_ID")

if not COGNITO_POOL_ID or not COGNITO_CLIENT_ID:
    raise RuntimeError("COGNITO_POOL_ID and COGNITO_CLIENT_ID must be set in environment variables.")

COGNITO_ISSUER = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_POOL_ID}"
COGNITO_KEYS_URL = f"{COGNITO_ISSUER}/.well-known/jwks.json"

# JWKS cache
jwks_cache = None

def get_jwks():
    global jwks_cache
    if jwks_cache is None:
        try:
            current_app.logger.info(f"Fetching JWKS from URL: {COGNITO_KEYS_URL}")
            jwks_response = requests.get(COGNITO_KEYS_URL)
            jwks_cache = jwks_response.json()
            current_app.logger.info(f"JWKS response status: {jwks_response.status_code}")
            current_app.logger.info(f"JWKS keys: {list(jwks_cache.keys()) if isinstance(jwks_cache, dict) else 'Not a dict'}")
            if jwks_response.status_code != 200:
                current_app.logger.error(f"JWKS response body: {jwks_cache}")
        except Exception as e:
            current_app.logger.error(f"Failed to fetch JWKS: {str(e)}")
            jwks_cache = {}
    return jwks_cache

def get_signing_key(token):
    try:
        headers = jose_jwt.get_unverified_header(token)
        key_id = headers.get('kid')
        
        # Get JWKS
        jwks = get_jwks()
        
        # Check if jwks has keys
        if 'keys' not in jwks:
            current_app.logger.error(f"JWKS missing 'keys' field. Available keys: {list(jwks.keys())}")
            raise JWTError('JWKS format error: missing keys field')
        
        # Find the key with matching kid
        key = None
        for k in jwks['keys']:
            if k['kid'] == key_id:
                key = k
                break
        
        if not key:
            available_kids = [k.get('kid', 'no-kid') for k in jwks['keys']]
            current_app.logger.error(f"Public key not found. Looking for kid: {key_id}, Available kids: {available_kids}")
            raise JWTError('Public key not found in jwks')
            
        return jwk.construct(key)
    except Exception as e:
        current_app.logger.error(f"Error getting signing key: {str(e)}")
        raise JWTError('Invalid token header')

def get_current_user():
    auth_header = request.headers.get('Authorization', None)
    
    if not auth_header:
        current_app.logger.error("❌ Authorization header missing")
        raise Exception("Authorization header missing")
    
    # Check if header starts with 'Bearer '
    if not auth_header.startswith('Bearer '):
        current_app.logger.error(f"❌ Invalid Authorization header format. Expected 'Bearer <token>', got: {auth_header[:50]}...")
        raise Exception("Invalid Authorization header format")
    
    token = auth_header.replace("Bearer ", "")
    
    # Check if token has the expected JWT format (3 parts separated by dots)
    token_parts = token.split('.')
    if len(token_parts) != 3:
        current_app.logger.error(f"❌ Invalid JWT format. Expected 3 parts, got {len(token_parts)} parts: {token_parts}")
        raise Exception(f"Invalid JWT format: token has {len(token_parts)} parts instead of 3")
    
    try:
        # Get the proper signing key for this token
        key = get_signing_key(token)
        claims = jose_jwt.decode(
            token,
            key=key,
            algorithms=["RS256"],
            audience=COGNITO_CLIENT_ID,
            issuer=COGNITO_ISSUER,
            options={
                "leeway": 30,
                "verify_aud": True,
                "verify_iss": True,
                "verify_signature": True
            }
        )
        user = User.query.filter_by(cognito_id=claims['sub']).first()
        if not user:
            current_app.logger.warning(f"User not found for cognito_id: {claims['sub']}")
            # Try to find user by email as fallback
            user_email = claims.get('email')
            if user_email:
                current_app.logger.info(f"Attempting fallback lookup by email: {user_email}")
                user = User.query.filter_by(email=user_email).first()
                if user:
                    current_app.logger.info(f"Found user by email, updating cognito_id from {user.cognito_id} to {claims['sub']}")
                    # Update the user's cognito_id to match the JWT
                    user.cognito_id = claims['sub']
                    db.session.commit()
                else:
                    current_app.logger.error(f"User not found by email either: {user_email}")
            
            if not user:
                raise Exception("User not found or not properly registered")
        return user
    except Exception as e:
        current_app.logger.error(f"Token validation failed: {str(e)}")
        raise

@preferences_bp.route('', methods=['POST'])
def create_or_update_preferences():
    logger = current_app.logger
    logger.info("🔐 [POST] /api/v1/preferences - Start processing user preferences")

    try:
        user = get_current_user()
        if not user:
            logger.warning("🚫 Unauthorized request: user not found in token")
            return jsonify({'error': 'Unauthorized', 'success': False}), 401
    except Exception as e:
        logger.error(f"🔥 Failed to get current user: {str(e)}", exc_info=True)
        return jsonify({'success': False, 'error': 'Authorization failure'}), 500

    try:
        data = request.get_json()
        if not data:
            logger.warning("⚠️ No JSON data received in request body")
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        logger.debug(f"📦 Received data: {json.dumps(data, indent=2)}")
    except Exception as e:
        logger.error(f"🔥 Failed to parse JSON body: {str(e)}", exc_info=True)
        return jsonify({'success': False, 'error': 'Invalid JSON format'}), 400

    try:
        preferences = UserPreferences.query.filter_by(user_id=user.id).first()
        if preferences:
            logger.info("✏️ Existing preferences found — will update")
        else:
            preferences = UserPreferences(user_id=user.id)
            db.session.add(preferences)
            logger.info("🆕 No preferences found — creating new record")
    except Exception as e:
        logger.error(f"🔥 Error accessing UserPreferences from DB: {str(e)}", exc_info=True)
        return jsonify({'success': False, 'error': 'Database access error'}), 500

    try:
        # List of all JSON/text fields (array/object fields in model)
        json_fields = {
            'children_ages', 'preferred_home_features',
            'hobbies_interests', 'dining_preferences', 'fitness_activities',
            'deal_breakers', 'content_feedback_log',
            'agent_interaction_history', 'personality_insights', 'quote_bubbles',
            'deal_makers', 'solo_reports_addresses',
            'group_reports_addresses', 'chat_sessions', 'data_sources',
            'report_section_priorities', 'important_locations',
            'property_features_priority'
        }

        updated_fields = []
        skipped_fields = []
        json_encoded_fields = []

        # Get all model columns to ensure only valid fields are set
        model_columns = set(c.name for c in UserPreferences.__table__.columns)

        logger.info(f"🔍 Processing {len(data)} incoming fields...")
        for field, value in data.items():
            logger.debug(f"🌾 Processing field: '{field}' with type: {type(value).__name__} and value: {value}")
            model_field = field
            # Alias handling for frontend/backend mismatches
            if field == 'preferred_housing_type':
                model_field = 'housing_type'
            if field == 'preferred_bathrooms':
                model_field = 'preferred_bathrooms'
            if field == 'preferred_bedrooms':
                model_field = 'preferred_bedrooms'
            if field == 'preferred_lot_size':
                model_field = 'preferred_lot_size'
            if field == 'preferred_home_age':
                model_field = 'preferred_home_age'
            if field == 'preferred_architectural_style':
                model_field = 'preferred_architectural_style'
            if field == 'renovation_willingness':
                model_field = 'renovation_preference'
            if field == 'architectural_style_preference':
                model_field = 'architectural_style_preference'
            if field == 'intended_property_use':
                model_field = 'intended_property_use'
            if field == 'property_features_priority':
                model_field = 'property_features_priority'
            # Add more aliases as needed for new fields

            if model_field in model_columns or model_field in json_fields:
                try:
                    # JSON/text fields
                    if model_field in json_fields:
                        if isinstance(value, (list, dict)):
                            json_value = json.dumps(value)
                            setattr(preferences, model_field, json_value)
                            json_encoded_fields.append(model_field)
                            logger.debug(f"📝 JSON-encoded field '{model_field}': {json_value[:100]}...")
                        else:
                            setattr(preferences, model_field, value)
                            logger.debug(f"📝 Set field '{model_field}' as-is (string): {str(value)[:100]}...")
                    else:
                        setattr(preferences, model_field, value)
                        logger.debug(f"📝 Set regular field '{model_field}': {value}")
                    updated_fields.append(model_field)
                except Exception as field_error:
                    logger.error(f"🔥 Failed to set field '{model_field}': {field_error}", exc_info=True)
                    skipped_fields.append(f"{model_field} (error: {field_error})")
            else:
                logger.warning(f"❓ Field '{field}' not found on UserPreferences model — skipping")
                skipped_fields.append(f"{field} (not found)")

        logger.info(f"🛠 Successfully updated {len(updated_fields)} fields: {updated_fields}")
        if json_encoded_fields:
            logger.info(f"📦 JSON-encoded {len(json_encoded_fields)} fields: {json_encoded_fields}")
        if skipped_fields:
            logger.warning(f"⏭️ Skipped {len(skipped_fields)} fields: {skipped_fields}")

        # Set has_preferences flag on user
        user.has_preferences = True
        logger.debug(f"🏷️ Set has_preferences=True for user {user.id}")

        # Log what we're about to commit
        logger.debug(f"💾 About to commit preferences for user {user.id}")
        db.session.commit()
        logger.info(f"✅ Database commit succeeded - preferences {'updated' if preferences else 'created'} for user {user.id}")

        return jsonify({
            'success': True,
            'message': 'Preferences saved successfully',
            'preferences': preferences.to_dict()
        })

    except Exception as e:
        db.session.rollback()
        logger.error(f"🔥 Exception during preference save: {str(e)}", exc_info=True)
        return jsonify({'success': False, 'error': str(e)}), 500


@preferences_bp.route('', methods=['GET'])
def get_preferences():
    logger = current_app.logger
    logger.info("📥 [GET] /api/v1/preferences - Fetching user preferences")

    try:
        user = get_current_user()
        if not user:
            logger.warning("🚫 Unauthorized request: user not found in token")
            return jsonify({'error': 'Unauthorized', 'success': False}), 401
    except Exception as e:
        logger.error(f"🔥 Failed to get current user: {str(e)}", exc_info=True)
        return jsonify({'success': False, 'error': 'Authorization failure'}), 500

    try:
        preferences = UserPreferences.query.filter_by(user_id=user.id).first()
        if not preferences:
            logger.info(f"ℹ️ No preferences found for user {user.id}")
            return jsonify({
                'success': True,
                'preferences': None,
                'has_preferences': False
            })

        return jsonify({
            'success': True,
            'preferences': preferences.to_dict(),
            'has_preferences': True
        })

    except Exception as e:
        logger.error(f"🔥 Failed to fetch preferences from DB: {str(e)}", exc_info=True)
        return jsonify({'success': False, 'error': 'Failed to get preferences'}), 500


@preferences_bp.route('/user/<user_id>', methods=['GET'])
def get_user_preferences_by_id(user_id):
    """
    Get preferences for a specific user by user ID.
    Used by agents to view client preferences in ClientIntel.
    Requires JWT authentication.
    """
    try:
        # Get current user (agent)
        current_user = get_current_user()
        if not current_user:
            return jsonify({'success': False, 'error': 'Authentication required'}), 401

        logger.info(f"🔍 Agent {current_user.id} requesting preferences for user {user_id}")

        # Verify the requested user is in the agent's client list
        if not hasattr(current_user, 'client_ids') or not current_user.client_ids:
            logger.warning(f"⚠️ Agent {current_user.id} has no clients assigned")
            return jsonify({'success': False, 'error': 'No clients assigned to this agent'}), 403

        try:
            client_ids = json.loads(current_user.client_ids) if isinstance(current_user.client_ids, str) else current_user.client_ids
        except (json.JSONDecodeError, TypeError):
            client_ids = []

        if user_id not in client_ids:
            logger.warning(f"⚠️ Agent {current_user.id} attempted to access preferences for user {user_id} who is not their client")
            return jsonify({'success': False, 'error': 'Access denied: User is not your client'}), 403

        # Fetch the user's preferences
        preferences = UserPreferences.query.filter_by(user_id=user_id).first()
        
        if preferences:
            logger.info(f"✅ Found preferences for user {user_id}")
            return jsonify({
                'success': True,
                'preferences': preferences.to_dict()
            })
        else:
            logger.info(f"ℹ️ No preferences found for user {user_id}")
            return jsonify({
                'success': True,
                'preferences': None
            })

    except Exception as e:
        logger.error(f"🔥 Failed to fetch user preferences: {str(e)}", exc_info=True)
        return jsonify({'success': False, 'error': 'Failed to get user preferences'}), 500


@preferences_bp.route('/clients', methods=['GET'])
def get_clients_preferences():
    logger = current_app.logger
    logger.info("📥 [GET] /api/v1/preferences/clients - Fetching preferences for client users")

    try:
        user = get_current_user()
        if not user:
            logger.warning("🚫 Unauthorized request: user not found in token")
            return jsonify({'error': 'Unauthorized', 'success': False}), 401
    except Exception as e:
        logger.error(f"🔥 Failed to get current user: {str(e)}", exc_info=True)
        return jsonify({'success': False, 'error': 'Authorization failure'}), 500

    try:
        # Parse client_ids JSON string
        if user.client_ids:
            clients = json.loads(user.client_ids) if isinstance(user.client_ids, str) else user.client_ids
        else:
            clients = []
        logger.info(f"🔗 Client IDs: {clients}")
    except (json.JSONDecodeError, TypeError) as e:
        logger.error(f"🔥 Failed to parse client IDs JSON: {str(e)}", exc_info=True)
        return jsonify({'success': True, 'preferences': [], 'has_preferences': False}), 500

    preferences_list = []
    user_list = []
    try:
        for client_id in clients:
            pref = UserPreferences.query.filter_by(user_id=client_id).first()
            user = User.query.filter_by(id=client_id).first()
            if pref:
                preferences_list.append(pref.to_dict())
                user_list.append(user.to_dict())
            else:
                logger.info(f"ℹ️ No preferences found for client user {client_id}")

        logger.info(f"✅ Retrieved {len(preferences_list)} preferences out of {len(clients)} clients")

        return jsonify({
            'success': True,
            'preferences': preferences_list,
            'user_information': user_list
        })

    except Exception as e:
        logger.error(f"🔥 Failed to fetch client preferences from DB: {str(e)}", exc_info=True)
        return jsonify({'success': False, 'error': 'Failed to get client preferences'}), 500


@preferences_bp.route('/agents', methods=['GET'])
def get_agents():
    """
    Get all agents whose names start with the provided search string.
    Query parameter: search (optional) - string to search for at the beginning of agent names
    """
    try:
        # Get the search parameter from query string
        search_term = request.args.get('search', '').strip()
        
        logger.info(f"[GET_AGENTS] Searching for agents with name starting with: '{search_term}'")
        
        # Build the query to find agents
        query = User.query.filter(User.is_agent == True)
        
        # If search term is provided, filter by name starting with the search term (case-insensitive)
        if search_term:
            query = query.filter(User.name.ilike(f'{search_term}%'))
        
        # Execute query and get results
        agents = query.all()
        
        # Format the response
        agent_list = []
        for agent in agents:
            agent_data = {
                'id': agent.id,
                'name': agent.name,
                'email': agent.email,
                'phone': agent.phone,
                'created_at': agent.created_at.isoformat() if agent.created_at else None
            }
            agent_list.append(agent_data)
        
        logger.info(f"[GET_AGENTS] Found {len(agent_list)} agents matching search criteria")
        
        return jsonify({
            'success': True,
            'agents': agent_list,
            'count': len(agent_list)
        }), 200
        
    except Exception as e:
        logger.error(f"🔥 Failed to fetch agents: {str(e)}", exc_info=True)
        return jsonify({
            'success': False, 
            'error': 'Failed to fetch agents'
        }), 500


@preferences_bp.route('/add', methods=['GET'])
def set_as_agent():
    """
    Add the current user to an agent's client list and set the user's agent_id.
    Query parameter: agent_id (required) - ID of the agent to assign to the user
    """
    try:
        # Get JWT token and verify user
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            logger.warning("🚫 No valid authorization header found")
            return jsonify({'success': False, 'error': 'Authorization required'}), 401

        token = auth_header.split(' ')[1]


        try:
            # Get the signing key for this token
            key = get_signing_key(token)
            
            # Decode and verify the token
            decoded_token = jose_jwt.decode(
                token,
                key=key,
                algorithms=['RS256'],
                issuer=COGNITO_ISSUER,
                options={
                    'verify_signature': True,
                    'verify_aud': False,  # We're not verifying audience
                    'verify_iss': True,
                    'verify_exp': True
                }
            )
            
            user_id = decoded_token.get('sub')
            if not user_id:
                logger.error("🚫 No user ID found in token")
                return jsonify({'success': False, 'error': 'Invalid token'}), 401
                
            
        except ExpiredSignatureError:
            logger.error("🚫 Token has expired")
            return jsonify({'success': False, 'error': 'Token expired'}), 401
        except JWTClaimsError as e:
            logger.error(f"🚫 JWT claims error: {str(e)}")
            return jsonify({'success': False, 'error': 'Invalid token claims'}), 401
        except JWTError as e:
            logger.error(f"🚫 JWT verification failed: {str(e)}")
            return jsonify({'success': False, 'error': 'Token verification failed'}), 401

        # Get the agent_id parameter from query string
        agent_id = request.args.get('agent_id')
        if not agent_id:
            logger.warning("🚫 No agent_id provided in request")
            return jsonify({'success': False, 'error': 'agent_id parameter is required'}), 400

        logger.info(f"[SET_AS_AGENT] Adding user {user_id} to agent {agent_id}'s client list")

        # Find the current user
        current_user = User.query.filter_by(cognito_id=user_id).first()
        if not current_user:
            logger.error(f"🚫 User not found with cognito_id: {user_id}")
            return jsonify({'success': False, 'error': 'User not found'}), 404

        # Find the agent
        agent = User.query.filter_by(id=agent_id, is_agent=True).first()
        if not agent:
            logger.error(f"🚫 Agent not found with id: {agent_id}")
            return jsonify({'success': False, 'error': 'Agent not found'}), 404

        # Parse the agent's current client_ids (JSON array)
        try:
            if agent.client_ids:
                client_ids = json.loads(agent.client_ids) if isinstance(agent.client_ids, str) else agent.client_ids
            else:
                client_ids = []
        except (json.JSONDecodeError, TypeError):
            logger.warning(f"⚠️ Invalid client_ids format for agent {agent_id}, resetting to empty list")
            client_ids = []

        # Add the current user to the agent's client list if not already present
        if current_user.id not in client_ids:
            client_ids.append(current_user.id)
            agent.client_ids = json.dumps(client_ids)
            logger.info(f"✅ Added user {current_user.id} to agent {agent_id}'s client list")
        else:
            logger.info(f"ℹ️ User {current_user.id} already in agent {agent_id}'s client list")

        # Parse the user's current agent_ids (JSON array like client_ids)
        try:
            if current_user.agent_id:
                agent_ids = json.loads(current_user.agent_id) if isinstance(current_user.agent_id, str) else current_user.agent_id
            else:
                agent_ids = []
        except (json.JSONDecodeError, TypeError):
            logger.warning(f"⚠️ Invalid agent_id format for user {current_user.id}, resetting to empty list")
            agent_ids = []

        # Add the agent to the user's agent list if not already present
        if agent_id not in agent_ids:
            agent_ids.append(agent_id)
            current_user.agent_id = json.dumps(agent_ids)
            logger.info(f"✅ Added agent {agent_id} to user {current_user.id}'s agent list")
        else:
            logger.info(f"ℹ️ Agent {agent_id} already in user {current_user.id}'s agent list")

        # Save changes to database
        db.session.commit()
        logger.info(f"💾 Successfully saved agent assignment for user {current_user.id}")

        return jsonify({
            'success': True,
            'message': f'Successfully assigned agent {agent.name} to user {current_user.name}',
            'agent': {
                'id': agent.id,
                'name': agent.name,
                'email': agent.email,
                'phone': agent.phone
            }
        }), 200

    except Exception as e:
        logger.error(f"🔥 Failed to assign agent: {str(e)}", exc_info=True)
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': 'Failed to assign agent'
        }), 500

@preferences_bp.route('/users_agents', methods=['GET'])
def get_user_agents():
    """
    Get all agents assigned to the authenticated user from their agent_id array.
    Requires JWT authentication.
    """
    try:
        # Find the current user
        current_user = get_current_user()
        if not current_user:
            logger.error(f"🚫 User not found")
            return jsonify({'success': False, 'error': 'User not found'}), 404

        logger.info(f"[GET_USER_AGENTS] Getting agents for user {current_user.id}")

        # Parse the user's agent_ids (JSON array)
        try:
            if current_user.agent_id:
                agent_ids = json.loads(current_user.agent_id) if isinstance(current_user.agent_id, str) else current_user.agent_id
            else:
                agent_ids = []
        except (json.JSONDecodeError, TypeError):
            logger.warning(f"⚠️ Invalid agent_id format for user {current_user.id}, treating as empty")
            agent_ids = []

        # If no agents assigned, return empty list
        if not agent_ids:
            logger.info(f"[GET_USER_AGENTS] No agents assigned to user {current_user.id}")
            return jsonify({
                'success': True,
                'agents': [],
                'count': 0
            }), 200

        # Get all assigned agents
        agents = User.query.filter(User.id.in_(agent_ids), User.is_agent == True).all()
        
        # Format the response
        agent_list = []
        for agent in agents:
            agent_data = {
                'id': agent.id,
                'name': agent.name,
                'email': agent.email,
                'phone': agent.phone,
                'created_at': agent.created_at.isoformat() if agent.created_at else None
            }
            agent_list.append(agent_data)
        
        logger.info(f"[GET_USER_AGENTS] Found {len(agent_list)} assigned agents for user {current_user.id}")
        
        return jsonify({
            'success': True,
            'agents': agent_list,
            'count': len(agent_list)
        }), 200
        
    except Exception as e:
        logger.error(f"🔥 Failed to fetch user agents: {str(e)}", exc_info=True)
        return jsonify({
            'success': False, 
            'error': 'Failed to fetch user agents'
        }), 500

@preferences_bp.route('/remove', methods=['GET'])
def remove_agent_relationship():
    """
    Remove the current user from an agent's client list and remove the agent from the user's agent_id list.
    Query parameter: agent_id (required) - ID of the agent to disassociate from the user
    """
    try:
        # Get JWT token and verify user
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            logger.warning("🚫 No valid authorization header found")
            return jsonify({'success': False, 'error': 'Authorization required'}), 401

        token = auth_header.split(' ')[1]
      
        try:
            key = get_signing_key(token)
            decoded_token = jose_jwt.decode(
                token,
                key=key,
                algorithms=['RS256'],
                issuer=COGNITO_ISSUER,
                options={
                    'verify_signature': True,
                    'verify_aud': False,
                    'verify_iss': True,
                    'verify_exp': True
                }
            )
            user_id = decoded_token.get('sub')
            if not user_id:
                logger.error("🚫 No user ID found in token")
                return jsonify({'success': False, 'error': 'Invalid token'}), 401

        except ExpiredSignatureError:
            logger.error("🚫 Token has expired")
            return jsonify({'success': False, 'error': 'Token expired'}), 401
        except JWTClaimsError as e:
            logger.error(f"🚫 JWT claims error: {str(e)}")
            return jsonify({'success': False, 'error': 'Invalid token claims'}), 401
        except JWTError as e:
            logger.error(f"🚫 JWT verification failed: {str(e)}")
            return jsonify({'success': False, 'error': 'Token verification failed'}), 401

        agent_id = request.args.get('agent_id')
        if not agent_id:
            logger.warning("🚫 No agent_id provided in request")
            return jsonify({'success': False, 'error': 'agent_id parameter is required'}), 400

        logger.info(f"[REMOVE_AGENT_RELATIONSHIP] Removing user {user_id} from agent {agent_id}'s client list")

        current_user = User.query.filter_by(cognito_id=user_id).first()
        if not current_user:
            logger.error(f"🚫 User not found with cognito_id: {user_id}")
            return jsonify({'success': False, 'error': 'User not found'}), 404

        agent = User.query.filter_by(id=agent_id, is_agent=True).first()
        if not agent:
            logger.error(f"🚫 Agent not found with id: {agent_id}")
            return jsonify({'success': False, 'error': 'Agent not found'}), 404

        try:
            client_ids = json.loads(agent.client_ids) if agent.client_ids else []
        except (json.JSONDecodeError, TypeError):
            logger.warning(f"⚠️ Invalid client_ids format for agent {agent_id}, resetting to empty list")
            client_ids = []

        if current_user.id in client_ids:
            client_ids.remove(current_user.id)
            agent.client_ids = json.dumps(client_ids)
            logger.info(f"🗑️ Removed user {current_user.id} from agent {agent_id}'s client list")
        else:
            logger.info(f"ℹ️ User {current_user.id} not in agent {agent_id}'s client list")

        try:
            agent_ids = json.loads(current_user.agent_id) if current_user.agent_id else []
        except (json.JSONDecodeError, TypeError):
            logger.warning(f"⚠️ Invalid agent_id format for user {current_user.id}, resetting to empty list")
            agent_ids = []

        if agent_id in agent_ids:
            agent_ids.remove(agent_id)
            current_user.agent_id = json.dumps(agent_ids)
            logger.info(f"🗑️ Removed agent {agent_id} from user {current_user.id}'s agent list")
        else:
            logger.info(f"ℹ️ Agent {agent_id} not in user {current_user.id}'s agent list")

        db.session.commit()
        logger.info(f"💾 Successfully removed agent relationship for user {current_user.id}")

        return jsonify({
            'success': True,
            'message': f'Successfully removed agent {agent.name} from user {current_user.name}',
            'agent': {
                'id': agent.id,
                'name': agent.name,
                'email': agent.email,
                'phone': agent.phone
            }
        }), 200

    except Exception as e:
        logger.error(f"🔥 Failed to remove agent: {str(e)}", exc_info=True)
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to remove agent'}), 500


@preferences_bp.route('/action-plan/<client_id>', methods=['POST'])
def generate_client_action_plan(client_id):
    """
    Generate a personalized action plan for a client using OpenAI.
    Requires JWT authentication and agent permissions.
    """
    try:
        # Get current user (agent)
        current_user = get_current_user()
        if not current_user:
            return jsonify({'success': False, 'error': 'Authentication required'}), 401
        
        # Verify the current user is an agent
        if not current_user.is_agent:
            return jsonify({'success': False, 'error': 'Agent access required'}), 403
        
        # Get the client user
        client_user = User.query.filter_by(id=client_id).first()
        if not client_user:
            return jsonify({'success': False, 'error': 'Client not found'}), 404
        
        # Verify the client is assigned to this agent
        try:
            client_ids = json.loads(current_user.client_ids) if current_user.client_ids else []
        except (json.JSONDecodeError, TypeError):
            client_ids = []
        
        if client_id not in client_ids:
            return jsonify({'success': False, 'error': 'Client not assigned to this agent'}), 403
        
        # Get client preferences
        client_preferences = UserPreferences.query.filter_by(user_id=client_id).first()
        if not client_preferences:
            return jsonify({
                'success': False, 
                'error': 'Client preferences not found. Client needs to complete onboarding first.'
            }), 404
        
        # Generate action plan using OpenAI
        logger.info(f"[ACTION_PLAN] Generating action plan for client {client_user.name} by agent {current_user.name}")
        action_plan = generate_action_plan(client_preferences, client_user.name)
        
        if action_plan.startswith("AI service unavailable") or action_plan.startswith("Unable to generate"):
            return jsonify({
                'success': False,
                'error': action_plan
            }), 500
        
        from datetime import datetime
        
        return jsonify({
            'success': True,
            'action_plan': action_plan,
            'client_name': client_user.name,
            'generated_at': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"🔥 Failed to generate action plan: {str(e)}", exc_info=True)
        return jsonify({'success': False, 'error': 'Failed to generate action plan'}), 500
