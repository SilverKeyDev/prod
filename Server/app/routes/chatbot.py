# routes/chatbot.py

from flask import Blueprint, request, jsonify, current_app
from app.models.user_preferences import UserPreferences
from app.services.chatbot.chatbot_utils import get_chat_response, get_preferences, summarize_user_message
from app.models.chat_history import ChatHistory
from app.models.user import User
from app import db
from datetime import datetime
import logging
import traceback
import requests
import os
import json
from jose import jwt

# Configure logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Cognito configuration (matching report routes)
COGNITO_REGION = os.getenv("S3_REGION", "us-east-2")
COGNITO_POOL_ID = os.getenv("COGNITO_USER_POOL_ID")
COGNITO_CLIENT_ID = os.getenv("COGNITO_CLIENT_ID")

if not COGNITO_POOL_ID or not COGNITO_CLIENT_ID:
    raise RuntimeError("COGNITO_POOL_ID and COGNITO_CLIENT_ID must be set in environment variables.")

COGNITO_KEYS_URL = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_POOL_ID}/.well-known/jwks.json"

# Cache the JWKS
JWKS = requests.get(COGNITO_KEYS_URL).json()

def get_current_user():
    """Get current user from Cognito JWT token"""
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

# Authentication handled directly in route functions

chatbot_bp = Blueprint('chatbot', __name__)

@chatbot_bp.route('/api/v1/chat/address/<string:report_id>', methods=['POST'])
def chat_for_address(report_id):
    logger.info(f"[CHAT_ROUTE] Received chat request for report_id: {report_id}")
    try:
        try:
            user = get_current_user()
            user_id = user.id
        except Exception as auth_error:
            logger.error(f"[CHAT_ROUTE] Authentication failed: {str(auth_error)}")
            return jsonify({"error": "Authentication required"}), 401

        user_message = request.json.get('message', '').strip() if request.json else ''

        if not user_message:
            logger.warning(f"[CHAT_ROUTE] Empty message received from user {user_id}")
            return jsonify({"error": "Message cannot be empty"}), 400

        logger.info(f"[CHAT_ROUTE] User {user_id} sending message to report {report_id}")
        logger.info(f"[CHAT_ROUTE] Message length: {len(user_message)} characters")

        # Generate 3-word summary of user message
        logger.info(f"[CHAT_ROUTE] Generating summary for user message")
        message_summary = summarize_user_message(user_message)
        logger.info(f"[CHAT_ROUTE] Generated summary: '{message_summary}'")

        # Store summary in user_preferences.chat_sessions
        try:
            user_prefs = UserPreferences.query.filter_by(user_id=user_id).first()
            if not user_prefs:
                logger.info(f"[CHAT_ROUTE] Creating new user preferences for user {user_id}")
                user_prefs = UserPreferences(user_id=user_id)
                db.session.add(user_prefs)
                db.session.flush()

            # Get existing chat sessions or initialize empty list
            existing_sessions = []
            if user_prefs.chat_sessions:
                try:
                    existing_sessions = json.loads(user_prefs.chat_sessions)
                    if not isinstance(existing_sessions, list):
                        existing_sessions = []
                except json.JSONDecodeError:
                    logger.warning(f"[CHAT_ROUTE] Invalid JSON in chat_sessions, resetting to empty list")
                    existing_sessions = []

            # Add new summary with timestamp
            session_entry = {
                "summary": message_summary,
                "timestamp": datetime.utcnow().isoformat(),
                "report_id": report_id
            }
            existing_sessions.append(session_entry)

            # Keep only the last 100 sessions to prevent unlimited growth
            if len(existing_sessions) > 100:
                existing_sessions = existing_sessions[-100:]

            # Update user preferences
            user_prefs.chat_sessions = json.dumps(existing_sessions)
            user_prefs.updated_at = datetime.utcnow()
            
            logger.info(f"[CHAT_ROUTE] Stored chat summary in user preferences. Total sessions: {len(existing_sessions)}")

        except Exception as prefs_error:
            logger.error(f"[CHAT_ROUTE] Error storing chat summary: {str(prefs_error)}")
            # Continue with chat processing even if summary storage fails

        address = report_id.replace("_", " ").replace(".pdf", "") if report_id else "Unknown Address"
        logger.info(f"[CHAT_ROUTE] Report address: {address}")

        # Fetch complete report data from S3
        report_data = None
        try:
            # Construct S3 key for the JSON report data
            json_s3_key = f"reports/{report_id.replace('.pdf', '.json')}"
            logger.info(f"[CHAT_ROUTE] Attempting to fetch full report data from S3 key: {json_s3_key}")
            
            from app.services.report_comparator import _download_json_from_s3
            report_data = _download_json_from_s3(json_s3_key)
            logger.info(f"[CHAT_ROUTE] Successfully fetched complete report data with {len(report_data)} keys")
            logger.debug(f"[CHAT_ROUTE] Report data keys: {list(report_data.keys())}")
            
        except Exception as report_error:
            logger.warning(f"[CHAT_ROUTE] Failed to fetch full report data: {str(report_error)}")
            # Fallback to basic metadata if full report unavailable
            report_data = {
                "report_id": report_id,
                "address": address,
                "type": "property_report",
                "status": "completed",
                "error": "Full report data unavailable"
            }

        # Fetch complete user preferences
        user_profile = get_preferences(user_id)
        logger.info(f"[CHAT_ROUTE] Retrieved user preferences: {len(user_profile) if user_profile else 0} fields")
        if user_profile:
            logger.debug(f"[CHAT_ROUTE] User preference categories: {list(user_profile.keys())}")

        user_chat = ChatHistory(
            user_id=user_id,
            report_id=report_id,
            role='user',
            message=user_message
        )
        db.session.add(user_chat)
        db.session.flush()
        logger.info(f"[CHAT_ROUTE] User message saved with ID: {user_chat.id}")

        try:
            reply, function_call = get_chat_response(
                report_data=report_data,
                user_profile=user_profile,
                user_message=user_message,
                address=address
            )
        except Exception as ai_error:
            logger.error(f"[CHAT_ROUTE] AI service error: {str(ai_error)}")
            reply = "I'm sorry, the AI service is currently unavailable. Please try again later."
            function_call = None

        logger.info(f"[CHAT_ROUTE] Received AI response with {len(reply)} characters")

        ai_chat = ChatHistory(
            user_id=user_id,
            report_id=report_id,
            role='assistant',
            message=reply
        )
        db.session.add(ai_chat)
        db.session.commit()
        logger.info(f"[CHAT_ROUTE] AI response saved with ID: {ai_chat.id}")

        return jsonify({
            "response": reply,
            "function_call": function_call,
            "message_id": ai_chat.id,
            "message_summary": message_summary  # Include summary in response for debugging
        })

    except Exception as e:
        db.session.rollback()
        logger.error(f"[CHAT_ROUTE] Error in chat_for_address for report {report_id}: {str(e)}")
        logger.error(f"[CHAT_ROUTE] Traceback: {traceback.format_exc()}")
        return jsonify({"error": "Internal server error"}), 500


@chatbot_bp.route('/api/v1/chat/history/<string:report_id>', methods=['GET'])
def get_chat_history(report_id):
    """Get chat history for a specific property report"""
    logger.info(f"[HISTORY_ROUTE] Received chat history request for report_id: {report_id}")
    try:
        # Authenticate user first
        try:
            user = get_current_user()
            user_id = user.id
        except Exception as auth_error:
            logger.error(f"[HISTORY_ROUTE] Authentication failed: {str(auth_error)}")
            return jsonify({"error": "Authentication required"}), 401
        
        logger.info(f"[HISTORY_ROUTE] User {user_id} requesting history for report {report_id}")
        
        # Get chat history for this user and report
        logger.info(f"[HISTORY_ROUTE] Querying chat history from database")
        chat_history = ChatHistory.query.filter_by(
            user_id=user_id,
            report_id=report_id
        ).order_by(ChatHistory.timestamp.asc()).all()
        
        logger.info(f"[HISTORY_ROUTE] Found {len(chat_history)} messages in history")
        
        messages = [{
            "id": chat.id,
            "role": chat.role,
            "message": chat.message,
            "timestamp": chat.timestamp.isoformat()
        } for chat in chat_history]
        
        logger.debug(f"[HISTORY_ROUTE] Formatted {len(messages)} messages for response")
        logger.info(f"[HISTORY_ROUTE] Successfully retrieved chat history for {report_id}")
        
        return jsonify({"messages": messages})
        
    except Exception as e:
        logger.error(f"[HISTORY_ROUTE] Error getting chat history for report {report_id}: {str(e)}")
        logger.error(f"[HISTORY_ROUTE] Exception type: {type(e).__name__}")
        logger.error(f"[HISTORY_ROUTE] Traceback: {traceback.format_exc()}")
        return jsonify({"error": "Internal server error"}), 500
