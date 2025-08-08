from flask import Blueprint, request, jsonify, send_from_directory, current_app
import logging
import os
import traceback
import uuid
from datetime import datetime
from app.models.pdf_document import PDFDocument
from app import db
import time
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.report_generator import generate_report
from app.services.offer.generate import generate_report as generate_offer_section

from app.services.s3_service import s3_service
from flask import current_app
from app import db
from flask_cors import cross_origin
from jose import jwt
import requests
import os
from sqlalchemy import or_, func
from app.models.user import User
from app.models.pdf_document import PDFDocument
from app.services.s3_service import s3_service


# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Blueprint setup
offer_bp = Blueprint('offer', __name__, url_prefix='/api/v1/offer')

# CORS settings
cors_config = {
    'origins': [
        "*"
    ],
    'supports_credentials': True
}

COGNITO_REGION = os.getenv("S3_REGION", "us-east-2")
COGNITO_POOL_ID = os.getenv("COGNITO_USER_POOL_ID")
COGNITO_CLIENT_ID = os.getenv("COGNITO_CLIENT_ID")

if not COGNITO_POOL_ID or not COGNITO_CLIENT_ID:
    raise RuntimeError("COGNITO_POOL_ID and COGNITO_CLIENT_ID must be set in environment variables.")

COGNITO_KEYS_URL = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_POOL_ID}/.well-known/jwks.json"


# cache the JWKS
JWKS = requests.get(COGNITO_KEYS_URL).json()

def get_current_user():
    auth_header = request.headers.get('Authorization', None)
    if not auth_header:
        raise Exception("Authorization header missing")
    
    token = auth_header.replace("Bearer ", "")
    
    try:
        claims = jwt.decode(
            token,
            JWKS,
            algorithms=["RS256"],
            audience=COGNITO_CLIENT_ID,
            options={
                "leeway": 30
            }
        )
        user = User.query.filter_by(cognito_id=claims['sub']).first()
        if not user:
            current_app.logger.warning(f"User not found for cognito_id: {claims['sub']}")
            raise Exception("User not found or not properly registered")
        return user
    except Exception as e:
        current_app.logger.error(f"Token validation failed: {str(e)}")
        raise


@offer_bp.route('/purchase-agreement', methods=['POST'])
@cross_origin(**cors_config)
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
@cross_origin(**cors_config)
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
@cross_origin(**cors_config)
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
@cross_origin(**cors_config)
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
@cross_origin(**cors_config)
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
