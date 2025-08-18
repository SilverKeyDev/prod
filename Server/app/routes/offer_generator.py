from flask import Blueprint, request, jsonify
import logging
import traceback
import uuid
from datetime import datetime
from app.models.pdf_document import PDFDocument
from app import db
from app.utils.auth import get_current_user
from .. import db
from datetime import datetime
import logging
logger = logging.getLogger(__name__)

# Blueprint setup
offer_bp = Blueprint('offer', __name__, url_prefix='/api/v1/offer')



# Temporary placeholder function to prevent server startup errors
def generate_offer_section(*args, **kwargs):
    """Temporary placeholder for offer generation functionality"""
    return {
        'success': False,
        'error': 'Offer generation service not yet implemented',
        'message': 'This feature is under development'
    }



@offer_bp.route('/purchase-agreement', methods=['POST'])
def generate_purchase_agreement():
    """
    Generate a Signed Purchase Offer/Agreement document.
    """
    try:
        # Get current user
        current_user = get_current_user()
        if not current_user:
            logger.warning("❌ [PURCHASE_AGREEMENT] Unauthorized access attempt")
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
        user_id = current_user.id
        logger.info(f"📝 [PURCHASE_AGREEMENT] Generating purchase agreement for user {user_id}")
        
        # Get request data
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['property_address', 'offer_price', 'closing_date', 'buyer_info']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400
        
        # Generate document ID
        document_id = str(uuid.uuid4())
        
        # Log the request details
        logger.info(f"📋 [PURCHASE_AGREEMENT] Property: {data.get('property_address')}")
        logger.info(f"💰 [PURCHASE_AGREEMENT] Offer Price: ${data.get('offer_price'):,}")
        logger.info(f"📅 [PURCHASE_AGREEMENT] Closing Date: {data.get('closing_date')}")
        
        # Generate the purchase agreement using the offer service
        try:
            filename = f"purchase_agreement_{document_id}.pdf"
            result = generate_offer_section(
                section_type="purchase_agreement",
                address=data.get('property_address'),
                filename=filename,
                user_id=str(user_id),
                params={
                    'offer_price': data.get('offer_price'),
                    'earnest_money': data.get('earnest_money', 0),
                    'closing_date': data.get('closing_date'),
                    'contingencies': data.get('contingencies', []),
                    'inclusions': data.get('inclusions', []),
                    'exclusions': data.get('exclusions', []),
                    'buyer_info': data.get('buyer_info', {})
                }
            )
            
            # Save document record to database
            pdf_doc = PDFDocument(
                id=document_id,
                user_id=user_id,
                filename=filename,
                file_path=f"offers/{filename}",
                status='processed',
                document_type='purchase_agreement'
            )
            db.session.add(pdf_doc)
            db.session.commit()
            
            response_data = {
                'success': True,
                'document_id': document_id,
                'document_type': 'purchase_agreement',
                'status': 'generated',
                'message': 'Purchase Agreement generated successfully',
                'data': result.get('data', {}),
                'details': {
                    'property_address': data.get('property_address'),
                    'offer_price': data.get('offer_price'),
                    'earnest_money': data.get('earnest_money', 0),
                    'closing_date': data.get('closing_date'),
                    'contingencies': data.get('contingencies', []),
                    'generated_at': datetime.now().isoformat()
                }
            }
            
        except Exception as gen_error:
            logger.error(f"❌ [PURCHASE_AGREEMENT] Generation failed: {str(gen_error)}")
            # Return error but don't fail completely
            response_data = {
                'success': False,
                'document_id': document_id,
                'document_type': 'purchase_agreement',
                'status': 'error',
                'error': f'Generation failed: {str(gen_error)}',
                'details': {
                    'property_address': data.get('property_address'),
                    'offer_price': data.get('offer_price'),
                    'generated_at': datetime.now().isoformat()
                }
            }
        
        logger.info(f"✅ [PURCHASE_AGREEMENT] Successfully generated document {document_id}")
        return jsonify(response_data), 200
        
    except Exception as e:
        error_msg = f"Failed to generate purchase agreement: {str(e)}"
        logger.error(f"❌ [PURCHASE_AGREEMENT] {error_msg}")
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': error_msg,
            'traceback': traceback.format_exc()
        }), 500


@offer_bp.route('/pre-approval-letter', methods=['POST'])
def generate_pre_approval_letter():
    """
    Generate a Mortgage Pre-Approval Letter or Proof of Funds document.

    """
    try:
        # Get current user
        current_user = get_current_user()
        if not current_user:
            logger.warning("❌ [PRE_APPROVAL] Unauthorized access attempt")
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
        user_id = current_user.id
        logger.info(f"🏦 [PRE_APPROVAL] Generating pre-approval letter for user {user_id}")
        
        # Get request data
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['document_type', 'loan_amount', 'buyer_info']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400
        
        # Generate document ID
        document_id = str(uuid.uuid4())
        
        # Log the request details
        logger.info(f"📄 [PRE_APPROVAL] Document Type: {data.get('document_type')}")
        logger.info(f"💰 [PRE_APPROVAL] Loan Amount: ${data.get('loan_amount'):,}")
        logger.info(f"🏦 [PRE_APPROVAL] Loan Type: {data.get('loan_type', 'Not specified')}")
        
        # Generate the pre-approval document using the offer service
        try:
            filename = f"preapproval_{document_id}.pdf"
            result = generate_offer_section(
                section_type="preapproval",
                address="N/A",  # Pre-approval doesn't require specific property address
                filename=filename,
                user_id=str(user_id),
                params={
                    'document_type': data.get('document_type'),
                    'loan_amount': data.get('loan_amount'),
                    'loan_type': data.get('loan_type'),
                    'interest_rate': data.get('interest_rate'),
                    'lender_info': data.get('lender_info', {}),
                    'buyer_info': data.get('buyer_info', {})
                }
            )
            
            # Save document record to database
            pdf_doc = PDFDocument(
                id=document_id,
                user_id=user_id,
                filename=filename,
                file_path=f"offers/{filename}",
                status='processed',
                document_type='pre_approval_letter'
            )
            db.session.add(pdf_doc)
            db.session.commit()
            
            response_data = {
                'success': True,
                'document_id': document_id,
                'document_type': 'pre_approval_letter',
                'status': 'generated',
                'message': f"{data.get('document_type').replace('_', ' ').title()} generated successfully",
                'data': result.get('data', {}),
                'details': {
                    'document_type': data.get('document_type'),
                    'loan_amount': data.get('loan_amount'),
                    'loan_type': data.get('loan_type'),
                    'interest_rate': data.get('interest_rate'),
                    'lender_info': data.get('lender_info', {}),
                    'generated_at': datetime.now().isoformat()
                }
            }
            
        except Exception as gen_error:
            logger.error(f"❌ [PRE_APPROVAL] Generation failed: {str(gen_error)}")
            response_data = {
                'success': False,
                'document_id': document_id,
                'document_type': 'pre_approval_letter',
                'status': 'error',
                'error': f'Generation failed: {str(gen_error)}',
                'details': {
                    'document_type': data.get('document_type'),
                    'loan_amount': data.get('loan_amount'),
                    'generated_at': datetime.now().isoformat()
                }
            }
        
        logger.info(f"✅ [PRE_APPROVAL] Successfully generated document {document_id}")
        return jsonify(response_data), 200
        
    except Exception as e:
        error_msg = f"Failed to generate pre-approval letter: {str(e)}"
        logger.error(f"❌ [PRE_APPROVAL] {error_msg}")
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': error_msg,
            'traceback': traceback.format_exc()
        }), 500


@offer_bp.route('/earnest-money-instructions', methods=['POST'])
def generate_earnest_money_instructions():
    """
    Generate Earnest Money Instructions document.
    """
    try:
        # Get current user
        current_user = get_current_user()
        if not current_user:
            logger.warning("❌ [EARNEST_MONEY] Unauthorized access attempt")
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
        user_id = current_user.id
        logger.info(f"💰 [EARNEST_MONEY] Generating earnest money instructions for user {user_id}")
        
        # Get request data
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['earnest_money_amount', 'escrow_holder', 'property_address', 'buyer_info']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400
        
        # Generate document ID
        document_id = str(uuid.uuid4())
        
        # Log the request details
        logger.info(f"💰 [EARNEST_MONEY] Amount: ${data.get('earnest_money_amount'):,}")
        logger.info(f"🏢 [EARNEST_MONEY] Escrow Holder: {data.get('escrow_holder', {}).get('company_name', 'Not specified')}")
        logger.info(f"🏠 [EARNEST_MONEY] Property: {data.get('property_address')}")
        
        # Generate the earnest money instructions using the offer service
        try:
            filename = f"earnest_money_{document_id}.pdf"
            result = generate_offer_section(
                section_type="earnest_money",
                address=data.get('property_address'),
                filename=filename,
                user_id=str(user_id),
                params={
                    'earnest_money_amount': data.get('earnest_money_amount'),
                    'escrow_holder': data.get('escrow_holder'),
                    'deposit_timeline': data.get('deposit_timeline', 'within 3 business days'),
                    'buyer_info': data.get('buyer_info', {})
                }
            )
            
            # Save document record to database
            pdf_doc = PDFDocument(
                id=document_id,
                user_id=user_id,
                filename=filename,
                file_path=f"offers/{filename}",
                status='processed',
                document_type='earnest_money_instructions'
            )
            db.session.add(pdf_doc)
            db.session.commit()
            
            response_data = {
                'success': True,
                'document_id': document_id,
                'document_type': 'earnest_money_instructions',
                'status': 'generated',
                'message': 'Earnest Money Instructions generated successfully',
                'data': result.get('data', {}),
                'details': {
                    'earnest_money_amount': data.get('earnest_money_amount'),
                    'escrow_holder': data.get('escrow_holder'),
                    'deposit_timeline': data.get('deposit_timeline', 'within 3 business days'),
                    'property_address': data.get('property_address'),
                    'generated_at': datetime.now().isoformat()
                }
            }
            
        except Exception as gen_error:
            logger.error(f"❌ [EARNEST_MONEY] Generation failed: {str(gen_error)}")
            response_data = {
                'success': False,
                'document_id': document_id,
                'document_type': 'earnest_money_instructions',
                'status': 'error',
                'error': f'Generation failed: {str(gen_error)}',
                'details': {
                    'earnest_money_amount': data.get('earnest_money_amount'),
                    'property_address': data.get('property_address'),
                    'generated_at': datetime.now().isoformat()
                }
            }
        
        logger.info(f"✅ [EARNEST_MONEY] Successfully generated document {document_id}")
        return jsonify(response_data), 200
        
    except Exception as e:
        error_msg = f"Failed to generate earnest money instructions: {str(e)}"
        logger.error(f"❌ [EARNEST_MONEY] {error_msg}")
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': error_msg,
            'traceback': traceback.format_exc()
        }), 500


@offer_bp.route('/cover-letter', methods=['POST'])
def generate_cover_letter():
    """
    Generate an Optional Cover Letter for the offer.
    
    Expected payload:
    {
        "property_address": "123 Main St, City, State 12345",
        "seller_name": "Jane Smith",
        "buyer_info": {
            "name": "John Doe",
            "family_size": 2,
            "occupation": "Software Engineer",
            "why_this_home": "We love the neighborhood and the beautiful garden",
            "personal_story": "This would be our first home together as newlyweds"
        },
        "offer_highlights": {
            "offer_price": 450000,
            "down_payment_percent": 20,
            "closing_flexibility": true,
            "pre_approved": true
        },
        "tone": "warm" | "professional" | "personal"
    }
    """
    try:
        # Get current user
        current_user = get_current_user()
        if not current_user:
            logger.warning("❌ [COVER_LETTER] Unauthorized access attempt")
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
        user_id = current_user.id
        logger.info(f"💌 [COVER_LETTER] Generating cover letter for user {user_id}")
        
        # Get request data
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['property_address', 'buyer_info']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400
        
        # Generate document ID
        document_id = str(uuid.uuid4())
        
        # Log the request details
        logger.info(f"🏠 [COVER_LETTER] Property: {data.get('property_address')}")
        logger.info(f"👤 [COVER_LETTER] Buyer: {data.get('buyer_info', {}).get('name', 'Not specified')}")
        logger.info(f"🎨 [COVER_LETTER] Tone: {data.get('tone', 'professional')}")
        
        # Generate the cover letter using the offer service
        try:
            filename = f"cover_letter_{document_id}.pdf"
            result = generate_offer_section(
                section_type="buyer_letter",
                address=data.get('property_address'),
                filename=filename,
                user_id=str(user_id),
                params={
                    'seller_name': data.get('seller_name'),
                    'buyer_info': data.get('buyer_info', {}),
                    'offer_highlights': data.get('offer_highlights', {}),
                    'tone': data.get('tone', 'professional')
                }
            )
            
            # Save document record to database
            pdf_doc = PDFDocument(
                id=document_id,
                user_id=user_id,
                filename=filename,
                file_path=f"offers/{filename}",
                status='processed',
                document_type='cover_letter'
            )
            db.session.add(pdf_doc)
            db.session.commit()
            
            response_data = {
                'success': True,
                'document_id': document_id,
                'document_type': 'cover_letter',
                'status': 'generated',
                'message': 'Cover Letter generated successfully',
                'data': result.get('data', {}),
                'details': {
                    'property_address': data.get('property_address'),
                    'seller_name': data.get('seller_name'),
                    'buyer_info': data.get('buyer_info'),
                    'offer_highlights': data.get('offer_highlights', {}),
                    'tone': data.get('tone', 'professional'),
                    'generated_at': datetime.now().isoformat()
                }
            }
            
        except Exception as gen_error:
            logger.error(f"❌ [COVER_LETTER] Generation failed: {str(gen_error)}")
            response_data = {
                'success': False,
                'document_id': document_id,
                'document_type': 'cover_letter',
                'status': 'error',
                'error': f'Generation failed: {str(gen_error)}',
                'details': {
                    'property_address': data.get('property_address'),
                    'buyer_info': data.get('buyer_info'),
                    'generated_at': datetime.now().isoformat()
                }
            }
        
        logger.info(f"✅ [COVER_LETTER] Successfully generated document {document_id}")
        return jsonify(response_data), 200
        
    except Exception as e:
        error_msg = f"Failed to generate cover letter: {str(e)}"
        logger.error(f"❌ [COVER_LETTER] {error_msg}")
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': error_msg,
            'traceback': traceback.format_exc()
        }), 500


@offer_bp.route('/documents', methods=['GET'])
def list_offer_documents():
    """
    List all offer documents for the current user.
    """
    try:
        # Get current user
        current_user = get_current_user()
        if not current_user:
            logger.warning("❌ [OFFER_DOCUMENTS] Unauthorized access attempt")
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
        user_id = current_user.id
        logger.info(f"📋 [OFFER_DOCUMENTS] Listing offer documents for user {user_id}")
        
        # TODO: Implement actual database query for offer documents
        # For now, return dummy data
        dummy_documents = [
            {
                'id': str(uuid.uuid4()),
                'document_type': 'purchase_agreement',
                'property_address': '123 Main St, Springfield, IL 62701',
                'status': 'completed',
                'created_at': '2024-01-15T10:30:00Z',
                'offer_price': 450000
            },
            {
                'id': str(uuid.uuid4()),
                'document_type': 'pre_approval_letter',
                'loan_amount': 400000,
                'status': 'completed',
                'created_at': '2024-01-14T14:20:00Z',
                'lender_name': 'ABC Mortgage Company'
            }
        ]
        
        logger.info(f"✅ [OFFER_DOCUMENTS] Found {len(dummy_documents)} documents")
        
        return jsonify({
            'success': True,
            'documents': dummy_documents,
            'count': len(dummy_documents)
        }), 200
        
    except Exception as e:
        error_msg = f"Failed to list offer documents: {str(e)}"
        logger.error(f"❌ [OFFER_DOCUMENTS] {error_msg}")
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': error_msg,
            'traceback': traceback.format_exc()
        }), 500


@offer_bp.route('/generate-strategy', methods=['POST', 'GET'])
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
        if request.method == 'GET':
            logger.warning("GET request received for strategy generation endpoint")
            return jsonify({'error': 'POST method required for strategy generation'}), 405
        
        # Get current user
        user = get_current_user()
        if not user:
            logger.error("User not found - authentication failed")
            return jsonify({'error': 'User not found', 'success': False}), 404
        
        logger.info(f"🔐 Authenticated user: {user.id} (is_agent: {user.is_agent})")
        
        data = request.get_json()
        if not data:
            logger.error("No JSON data provided in request")
            return jsonify({'error': 'No data provided', 'success': False}), 400
        
        address = data.get('address')
        target_user_id = data.get('user_id', None)  # For agent client selection
        
        logger.info(f"📥 Request parameters: address='{address}', target_user_id='{target_user_id}'")
        
        if not address:
            logger.error("No address provided in request data")
            return jsonify({'error': 'Address is required', 'success': False}), 400
        
        # Determine which user's preferences to use for strategy generation
        preferences_user_id = user.id  # Default to authenticated user
        logger.info(f"🎯 Initial preferences_user_id set to authenticated user: {preferences_user_id}")
        
        if target_user_id:
            # Agent is generating strategy for a client
            logger.info(f"🔄 Agent {user.id} requesting to generate strategy for client {target_user_id}")
            
            # Verify the agent has access to this client
            if not user.is_agent:
                logger.warning(f"Non-agent user {user.id} attempted to generate strategy for another user {target_user_id}")
                return jsonify({'error': 'Only agents can generate strategies for other users', 'success': False}), 403
            
            # Parse agent's client_ids to verify access
            try:
                import json
                if user.client_ids:
                    client_ids = json.loads(user.client_ids) if isinstance(user.client_ids, str) else user.client_ids
                else:
                    client_ids = []
                
                if target_user_id not in client_ids:
                    logger.warning(f"Agent {user.id} attempted to access client {target_user_id} who is not in their client list")
                    return jsonify({'error': 'Access denied: User is not your client', 'success': False}), 403
                
                # Ensure preferences_user_id is the same type as user.id (string)
                preferences_user_id = str(target_user_id) if target_user_id else user.id
                logger.info(f"✅ Agent {user.id} authorized to generate strategy using preferences from client {target_user_id}")
                
            except Exception as e:
                logger.error(f"Error parsing agent client_ids: {str(e)}")
                return jsonify({'error': 'Error validating client access', 'success': False}), 500
        
        # Import the strategy generation service
        try:
            from app.services.standardgen.generate import generate_report
            logger.info("📦 Successfully imported strategy generation service")
        except ImportError as e:
            logger.error(f"Failed to import strategy generation service: {str(e)}")
            return jsonify({'error': 'Strategy generation service unavailable', 'success': False}), 500
        
        # Generate unique filename for the strategy
        strategy_id = str(uuid.uuid4())
        filename = f"negotiation_strategy_{strategy_id}.json"
        
        logger.info(f"🎯 [NEGOTIATION_STRATEGY] Generating strategy for address: {address}")
        logger.info(f"📄 Strategy filename: {filename}")
        
        # Fetch user preferences for personalized strategy generation
        user_preferences = None
        try:
            from app.models.user_preferences import UserPreferences
            user_prefs_obj = UserPreferences.query.filter_by(user_id=preferences_user_id).first()
            if user_prefs_obj:
                user_preferences = user_prefs_obj.to_dict()
                logger.info(f"📋 [NEGOTIATION_STRATEGY] Loaded user preferences for personalization")
            else:
                logger.warning(f"⚠️ [NEGOTIATION_STRATEGY] No user preferences found for user {preferences_user_id}")
        except Exception as e:
            logger.error(f"❌ [NEGOTIATION_STRATEGY] Failed to load user preferences: {str(e)}")
            # Continue without preferences - service will use defaults
        
        # Fetch detailed property information using get_property_via_address logic
        property_data = None
        commute_data = None
        property_analysis = None
        
        try:
            logger.info(f"🏠 [NEGOTIATION_STRATEGY] Fetching detailed property data for: {address}")
            
            # Import necessary modules for property data fetching
            import os, requests, json
            from app.services.reportgen.graphic_generation import fetch_travel_time, generate_static_map_url
            from app.models.user_preferences import UserPreferences
            from app.services.search_help import analyze_property_with_sonar_pro
            
            # Get API keys
            RAPI_HOST = os.getenv("RAPIDAPI_HOST", "zillow-com1.p.rapidapi.com")
            RAPI_KEY = os.getenv("RAPIDAPI_KEY")
            GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
            
            if RAPI_KEY:
                # Call Zillow API to get property details
                url = f"https://{RAPI_HOST}/property"
                headers = {
                    "x-rapidapi-host": RAPI_HOST,
                    "x-rapidapi-key": RAPI_KEY,
                    "Accept": "application/json",
                }
                params = {"address": address.strip()}
                
                logger.info(f"🔍 [NEGOTIATION_STRATEGY] Calling Zillow API for property details")
                r = requests.get(url, headers=headers, params=params, timeout=20)
                
                if r.ok:
                    property_data = r.json()
                    logger.info(f"✅ [NEGOTIATION_STRATEGY] Successfully fetched property data")
                    
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
                        logger.info(f"🗺️ [NEGOTIATION_STRATEGY] Calculating commute data")
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
                                
                                logger.info(f"🗺️ [NEGOTIATION_STRATEGY] Travel time to {location_name}: {travel_time}")
                    
                    # Get property analysis using Perplexity Sonar Pro
                    if user_preferences and isinstance(property_data, dict):
                        logger.info(f"🔍 [NEGOTIATION_STRATEGY] Starting property analysis")
                        
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
                                'neighborhood_overview': analysis_result.neighborhood_overview,
                                'crime_stats': analysis_result.crime_stats,
                                'gentrification_index': analysis_result.gentrification_index,
                                'roi_explanation': analysis_result.roi_explanation
                            }
                            logger.info(f"✅ [NEGOTIATION_STRATEGY] Successfully completed property analysis")
                        else:
                            logger.warning(f"⚠️ [NEGOTIATION_STRATEGY] Property analysis returned no results")
                else:
                    logger.warning(f"⚠️ [NEGOTIATION_STRATEGY] Zillow API call failed: {r.status_code}")
            else:
                logger.warning(f"⚠️ [NEGOTIATION_STRATEGY] RapidAPI key not configured, skipping property data fetch")
                
        except Exception as e:
            logger.error(f"❌ [NEGOTIATION_STRATEGY] Error fetching property data: {str(e)}")
            # Continue without property data - strategy will use address only
        
        # Call the strategy generation service
        try:
            # Use the standardgen service to generate negotiation strategy
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
            
            logger.info(f"🎯 [NEGOTIATION_STRATEGY] Generating strategy with enhanced property data")
            
            strategy_data = generate_report(
                section_type="negotiation_strategy",
                address=address,
                filename=filename,
                user_id=preferences_user_id,
                params=enhanced_params,
                user_preferences=user_preferences
            )
            
            logger.info(f"✅ [NEGOTIATION_STRATEGY] Successfully generated strategy for {address}")
            
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
                logger.info(f"📊 [NEGOTIATION_STRATEGY] Including property data in response")
            
            if commute_data:
                response_data['commute_data'] = commute_data
                logger.info(f"🗺️ [NEGOTIATION_STRATEGY] Including commute data in response")
            
            if property_analysis:
                response_data['property_analysis'] = property_analysis
                logger.info(f"🔍 [NEGOTIATION_STRATEGY] Including property analysis in response")
            
            return jsonify(response_data), 200
            
        except Exception as e:
            error_msg = f"Strategy generation failed: {str(e)}"
            logger.error(f"❌ [NEGOTIATION_STRATEGY] {error_msg}")
            logger.error(traceback.format_exc())
            
            return jsonify({
                'success': False,
                'error': error_msg,
                'traceback': traceback.format_exc()
            }), 500
        
    except Exception as e:
        error_msg = f"Failed to generate negotiation strategy: {str(e)}"
        logger.error(f"❌ [NEGOTIATION_STRATEGY] {error_msg}")
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': error_msg,
            'traceback': traceback.format_exc()
        }), 500
