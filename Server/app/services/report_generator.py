import os
import json
import logging
import re
from typing import Dict
import requests
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry
import uuid
import time
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from flask import jsonify
import json5
import traceback
from .pdf_creator import _create_pdf
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from .schema_generator import generate_report_schema
from ..models.report_models import FullReport
from ..models.user_preferences import UserPreferences
from ..services.s3_service import s3_service
from flask import current_app
from app import db

# Configure verbose logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Perplexity API configuration
PERPLEXITY_API_KEY = os.getenv('PERPLEXITY_API_KEY')
if not PERPLEXITY_API_KEY:
    logger.critical("PERPLEXITY_API_KEY environment variable is not set.")
    raise ValueError("PERPLEXITY_API_KEY environment variable is not set")

HEADERS = {
    "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
    "Content-Type": "application/json"
}


# -------------------- UTILS --------------------

def create_placeholder_pdf() -> bytes:
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    c.drawString(100, 750, "Report is generating...")
    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer.read()


def validate_address(address: str) -> bool:
    """Validate that the address is provided and is a string"""
    if not address:
        logger.error("❌ Address is empty or None")
        return False
    
    if len(address.strip()) == 0:
        logger.error("❌ Address is empty after stripping whitespace")
        return False
    
    logger.debug(f"✅ Address validation passed: {address}")
    return True

def _safe_parse_json(text: str, report_customization: dict = None) -> dict:
    try:
        logger.debug("🔧 Attempting to parse model output as structured JSON")
        logger.debug(f"📝 Raw model output (first 500 chars): {text[:500]}...")
        logger.info(f"🎛️ Report customization passed to FullReport: {json.dumps(report_customization, indent=2) if report_customization else 'None'}")

        # Strip any non-JSON hallucinated wrappers just in case
        cleaned = re.sub(r'(<think>.*?</think>|&lt;think&gt;.*?&lt;/think&gt;)', '', text, flags=re.DOTALL | re.IGNORECASE).strip()

        # Parse the raw output directly
        parsed = json.loads(cleaned)
        logger.debug("✅ Parsed with json.loads")
        logger.info(f"📊 Parsed JSON keys: {list(parsed.keys()) if isinstance(parsed, dict) else 'Not a dict'}")

        # Validate with FullReport schema
        try:
            logger.info("🏗️ Instantiating FullReport with report_customization...")
            validated = FullReport(report_customization=report_customization, **parsed)
            logger.info("🎯 FullReport validation with Pydantic successful")
            
            # Log the final validated report structure using custom dict() method
            validated_dict = validated.dict()  # Use custom dict() method that filters by priorities
            logger.info(f"📋 Final FullReport sections: {list(validated_dict.keys())}")
            logger.debug(f"📋 Full validated FullReport JSON:\n{json.dumps(validated_dict, indent=2)}")
            
            return validated_dict
        except Exception as ve:
            logger.error(f"❌ FullReport validation failed: {ve}")
            logger.error(f"❌ Validation error type: {type(ve).__name__}")
            logger.error(f"❌ Full traceback:\n{traceback.format_exc()}")
            logger.warning("📋 Returning unvalidated parsed JSON")
            return parsed

    except Exception as e:
        logger.error(f"🛑 Failed to parse structured JSON: {e}")
        logger.error(f"🧵 Traceback:\n{traceback.format_exc()}")
        raise ValueError("Failed to parse structured JSON from model output") from e

# -------------------- HELPER FUNCTIONS --------------------

def get_preferences(user_id: str) -> Dict:
    """Get user preferences by user_id"""
    try:
        logger.info(f"🔍 PREFERENCES: Looking up preferences for user_id: {user_id}")
        preferences = UserPreferences.query.filter_by(user_id=user_id).first()
        if preferences:
            logger.info(f"✅ PREFERENCES: Found preferences for user_id {user_id}")
            prefs_dict = preferences.to_dict()
            logger.info(f"📊 PREFERENCES: Preferences keys: {list(prefs_dict.keys()) if prefs_dict else 'None'}")
            if prefs_dict and 'report_customization' in prefs_dict:
                logger.info(f"🎯 PREFERENCES: report_customization found with keys: {list(prefs_dict['report_customization'].keys()) if prefs_dict['report_customization'] else 'None'}")
            else:
                logger.warning(f"⚠️ PREFERENCES: No report_customization found in preferences for user_id {user_id}")
            return prefs_dict
        else:
            logger.warning(f"⚠️ PREFERENCES: No preferences record found for user_id {user_id}")
            return None
    except Exception as e:
        logger.error(f"🔥 PREFERENCES: Failed to fetch preferences for user_id {user_id}: {str(e)}")
        logger.error(f"🔥 PREFERENCES: Exception traceback: {traceback.format_exc()}")
        return None
        return None

# -------------------- HELPER FUNCTIONS --------------------

def _get_or_generate_report_json(address: str, user_id: int, filename: str) -> Dict:
    """Get existing JSON report from S3 or generate a new one if it doesn't exist"""
    try:
        logger.info(f"🔍 Checking for existing JSON report for address: {address}")
        
        # Create a safe filename for S3 lookup
        safe_address = "".join(c for c in address if c.isalnum() or c in (' ', '-', '_')).rstrip().replace(' ', '_')
        user_id_short = str(user_id)[:8] if len(str(user_id)) >= 8 else str(user_id)
        filenamee = f"reports/{safe_address}_{user_id_short}_{uuid.uuid4().hex[:8]}.pdf"
        
        # Try to find existing JSON report in S3
        # Look for reports with this address pattern
        from app.models.pdf_document import PDFDocument
        from app.models.user import User
        
        # Get user object from user_id (no HTTP context needed)
        user = User.query.get(user_id)
        if not user:
            raise Exception(f"User not found with ID: {user_id}")
        
        existing_report = PDFDocument.query.filter(
            PDFDocument.user_id == user_id,
            PDFDocument.primary_address == address,
            PDFDocument.report_type == 'detailed',
        ).first()
        
        if existing_report:
            logger.info(f"📄 Found existing report for {address}, attempting to retrieve JSON")
            
            # Try to get the JSON from S3 using the existing report's file path
            try:
                from app.services.s3_service import s3_service
                from flask import current_app
                from io import BytesIO
                
                # Construct JSON file path (assuming JSON is stored alongside PDF)
                json_file_path = existing_report.file_path.replace('.pdf', '.json')
                
                # Try to download JSON from S3 using the same method as report_comparator
                if s3_service.s3_client is None:
                    raise RuntimeError("S3 client not initialised")
                
                bucket_name = current_app.config.get("S3_BUCKET_NAME_PDFS")
                if not bucket_name:
                    raise RuntimeError("S3_BUCKET_NAME_PDFS config missing")
                
                logger.debug(f"🔽 Attempting to download JSON: Bucket={bucket_name}, Key={json_file_path}")
                buffer = BytesIO()
                
                s3_service.s3_client.download_fileobj(bucket_name, json_file_path, buffer)
                buffer.seek(0)
                raw_json = buffer.read().decode("utf-8")
                
                logger.info(f"✅ Retrieved existing JSON report from S3 for {address}")
                return json.loads(raw_json)
            except Exception as e:
                logger.error(f"No JSON found for {address}: {str(e)}, will generate new report")

        else:
            pdf_doc = PDFDocument(
                    id=str(uuid.uuid4()),
                    user_id=user.id,
                    filename=filenamee,
                    file_path=filenamee,  # Use the same path since it's stored in S3
                    status='generating',
                    primary_address=address,
                    report_type='detailed',
                )
            try:
                db.session.add(pdf_doc)
                db.session.commit()
                logger.info(f"✅ Successfully created PDF document record: {pdf_doc.id}")
            except Exception as e:
                logger.error(f"❌ Database error when creating PDF document: {str(e)}")
                logger.error(f"Traceback: {traceback.format_exc()}")
                try:
                    db.session.rollback()
                    logger.info("🔄 Database session rolled back successfully")
                except Exception as rollback_error:
                    logger.error(f"❌ Failed to rollback session: {str(rollback_error)}")
                finally:
                    try:
                        db.session.remove()
                        logger.debug("🧹 Database session cleaned up")
                    except Exception as cleanup_error:
                        logger.error(f"❌ Failed to clean up session: {str(cleanup_error)}")
                raise e
            
            
            if user.reports_available <= 0:
                logger.warning(f"User {user.id} has no active subscription and no reports available")
                return jsonify({
                    'success': False,
                    'error': 'NO_REPORTS_AVAILABLE',
                    'message': 'No reports available. Please purchase a subscription or more reports.'
                }), 402  # Payment Required
                
            # Decrement reports_available for non-subscription users
            user.reports_available -= 1
            try:
                db.session.commit()
                logger.info(f"✅ Successfully decremented reports_available for user {user.id}: {user.reports_available}")
            except Exception as e:
                logger.error(f"❌ Database error when updating user reports: {str(e)}")
                logger.error(f"Traceback: {traceback.format_exc()}")
                try:
                    db.session.rollback()
                    logger.info("🔄 Database session rolled back successfully")
                except Exception as rollback_error:
                    logger.error(f"❌ Failed to rollback session: {str(rollback_error)}")
                finally:
                    try:
                        db.session.remove()
                        logger.debug("🧹 Database session cleaned up")
                    except Exception as cleanup_error:
                        logger.error(f"❌ Failed to clean up session: {str(cleanup_error)}")
                raise e
            
            # Start async task (lazy import to avoid circular import)
            # Always use the unified generate_report_async task, passing comparison_address (None for detailed reports)
            from app.celery.tasks import generate_report_async
            task = generate_report_async.delay(address, None, filenamee, pdf_doc.id, user_id)
            try:
                from app.services.s3_service import s3_service
                from flask import current_app
                from io import BytesIO
                
                # Construct JSON file path (assuming JSON is stored alongside PDF)
                json_file_path = existing_report.file_path.replace('.pdf', '.json')
                
                # Try to download JSON from S3 using the same method as report_comparator
                if s3_service.s3_client is None:
                    raise RuntimeError("S3 client not initialised")
                
                bucket_name = current_app.config.get("S3_BUCKET_NAME_PDFS")
                if not bucket_name:
                    raise RuntimeError("S3_BUCKET_NAME_PDFS config missing")
                
                logger.debug(f"🔽 Attempting to download JSON: Bucket={bucket_name}, Key={json_file_path}")
                buffer = BytesIO()
                
                s3_service.s3_client.download_fileobj(bucket_name, json_file_path, buffer)
                buffer.seek(0)
                raw_json = buffer.read().decode("utf-8")
                
                logger.info(f"✅ Retrieved existing JSON report from S3 for {address}")
                return json.loads(raw_json)
            except Exception as e:
                logger.error(f"No JSON found for {address}: {str(e)}, will generate new report")
                
            
    except Exception as e:
        logger.error(f"❌ Failed to get or generate report JSON for {address}: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise

# -------------------- MAIN FUNCTION --------------------

def generate_report(address: str, comparison_address: str, filename: str, user_id: str) -> Dict:
    """Generate a comprehensive property report and upload PDF to S3"""
    task_id = str(uuid.uuid4())
    logger.info(f"📝 REPORT_GEN: Starting report generation for address: {address}")
    logger.info(f"🆔 REPORT_GEN: Task ID: {task_id}")
    logger.info(f"🎯 REPORT_GEN: Using user_id for preferences: {user_id}")
    
    # Get user preferences
    logger.info(f"🔍 REPORT_GEN: Calling get_preferences with user_id: {user_id}")
    user_preferences = get_preferences(user_id)
    logger.info(f"📊 REPORT_GEN: get_preferences returned: {user_preferences is not None}")
    
    if user_preferences:
        logger.info(f"✅ REPORT_GEN: Successfully retrieved preferences for user_id {user_id}")
        logger.info(f"📋 REPORT_GEN: Preferences summary: {len(user_preferences)} keys found")
    else:
        logger.error(f"❌ REPORT_GEN: No preferences found for user_id {user_id} - this will cause report generation to fail")
    
    # Handle report customization preferences
    if user_preferences and 'report_customization' in user_preferences:
        report_customization = user_preferences['report_customization']
        logger.info(f"✅ REPORT_GEN: Using report_customization from user_id {user_id}")
        logger.info(f"🎯 REPORT_GEN: Customization options: {list(report_customization.keys()) if report_customization else 'None'}")
    else:
        # Default all to True if no preferences found
        logger.error(f"❌ REPORT_GEN: No report_customization found for user_id {user_id}")
        if user_preferences:
            logger.error(f"❌ REPORT_GEN: Available preference keys: {list(user_preferences.keys())}")
        else:
            logger.error(f"❌ REPORT_GEN: user_preferences is None for user_id {user_id}")
        raise Exception(f"No report customization found for user_id {user_id}")

    # Create FullReport schema with error handling
    try:
        # Use the dedicated schema generator for clean, maintainable code
        # Pass user preferences for interpolation in example fields
        # Note: user_preferences is already a dict from get_preferences()
        if comparison_address is not None and comparison_address != "":
            schema = generate_report_schema(report_customization, user_preferences, compare=True)
        else:
            schema = generate_report_schema(report_customization, user_preferences)

    except Exception as e:
        logger.error(f"❌ Failed to create FullReport schema: {str(e)}")
        logger.exception("FullReport schema creation error details:")
        raise Exception(f"FullReport schema creation failed: {str(e)}")

    try:
        # Validate address
        if not validate_address(address):
            logger.error("🚫 Address validation failed")
            raise ValueError("Invalid address format")
        if comparison_address is None or comparison_address == "":
            payload = {
            "model": "sonar-deep-research",
            "messages": [
                {
                    "role": "system",
                    "content": (
                        f"You are a comprehensive PERSONALIZED property research assistant. Given an address, {address}, you must provide a detailed property report in valid JSON format.\n\n"

                        "Use the examples in the schema to determine how to structure your response.\n\n"
                        "Use the descriptions to figure out how to formulate a response unique to this address and user preferences.\n\n"
                        "Use the guidance schema to determine where to find different data sources and how to use them.\n\n"

                        "CRITICAL REQUIREMENTS:\n"
                        "1. Follow all instrucions EXACTLY for ALL fields exactly as in the given guidance - if you don't know a value, research until you find one\n"
                        "2. Be  critical and honest - expose both good and bad aspects of locations\n"
                        "3. If no data exists for a field, provide your best educated estimate based on similar areas\n"
                        "4. All ratings should be out of 10 and realistic, do not be afraid to rate somewhere very low or high\n"
                        "5. You MUST respond with ONLY valid JSON (no markdown, no explanation). Do not wrap your response in ``` or any code fences.\n"
                        "6. Use the recommended sources first in research. If a decent answer is found, do not continue to search the web for that field\n"
                        "7. Do not include citations in the response\n"
                        "8. MANDATORY: You MUST provide ALL required fields in the schema. NEVER return null or omit any field. Every field must have a meaningful value.\n"
                        "9. MANDATORY: If you cannot find specific data for a field, provide a reasonable estimate or placeholder value instead of null.\n"
                    )
                }, {"role": "user", "content": f"Sell me the property at {address}"}
            ],
            "search_mode": "web",
            "reasoning_effort": "low",
            "temperature": 0.1,
            "max_tokens": 10000,
            "stream": False,
            "return_images": False,
            "return_citations": False,
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "schema": schema
                }
            }
        }
        if comparison_address is not None and comparison_address != "":
            # Comparison report logic - need to get JSON data for both properties
            logger.info(f"🔄 Generating comparison report for {address} vs {comparison_address}")
            
            # Generate ComparisonReport schema with user preference interpolation
            from ..models.duel_report_models import ComparisonReport
            comparison_report = ComparisonReport(report_customization=report_customization)
            comparison_schema = comparison_report.schema(report_customization=report_customization)
            
            # Add schema metadata
            comparison_schema["$schema"] = "https://json-schema.org/draft/2020-12/schema"
            comparison_schema["title"] = "Property Comparison Report Schema"
            comparison_schema["description"] = "Structured schema for generating personalized neighborhood comparison reports"
            
            # Get or generate JSON reports for both addresses
            primary_report_json = _get_or_generate_report_json(address, user_id, filename)
            comparison_report_json = _get_or_generate_report_json(comparison_address, user_id, filename)
            
            logger.info(f"✅ Retrieved/generated JSON reports for both properties")
            
            payload = {
                "model": "sonar-deep-research",
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            f"You are a critical, strategic, and personalized PROPERTY COMPARISON EXPERT. "
                            f"Help me make a decision on which property to move in to based on my priorities and user preferences.\n\n"

                            "Use the examples in the schema to determine how to structure your response.\n\n"
                            "Use the descriptions to figure out how to formulate a response unique to this address and user preferences.\n\n"
                            "Use the guidance schema to determine where to find different data sources and how to use them.\n\n"

                            "CRITICAL OBJECTIVES:\n"
                            "1. Be honest, critical, and balanced. Highlight both strengths and weaknesses for each.\n"
                            "2. Do not favor both equally—make a persuasive recommendation based on user preferences.\n"
                            "3. Add a clear winner for each category and overall, along with justification.\n\n"

                            "FORMATTING:\n"
                            "- _demographics: caption: percentage (total 100%)\n"
                            "- _rating: number out of 10 (e.g., 6.8/10)\n\n"

                        )
                    },
                    {
                        "role": "user",
                        "content": (
                            f"Based on my priorities and user preferences, for each field, tell me which porperty is better, worse, or the same FOR ME:\n\n"
                            f"Property A ({address}):\n{json.dumps(primary_report_json, indent=2)}\n\n"
                            f"Property B ({comparison_address}):\n{json.dumps(comparison_report_json, indent=2)}"
                        )
                    }
                ],
                "search_mode": "web",
                "reasoning_effort": "medium",
                "temperature": 0.1,
                "max_tokens": 10000,
                "stream": False,
                "return_images": False,
                "return_citations": False,
                "response_format": {
                    "type": "json_schema",
                    "json_schema": {
                        "schema": comparison_schema
                    }
                }
            }

        # Enhanced retry logic with exponential backoff
        max_retries = 2
        base_delay = 1  # Start with 1 second delay
        
        for attempt in range(max_retries + 1):  # +1 to include the initial attempt
            try:
                # Configure session with retry adapter for connection-level retries
                session = requests.Session()
                retries = Retry(
                    total=1,  # Lower since we're doing manual retries
                    backoff_factor=0.5,
                    status_forcelist=[429, 500, 502, 503, 504],
                    raise_on_status=False  # We'll handle status codes manually
                )
                session.mount("https://", HTTPAdapter(max_retries=retries))
                
                logger.info(f"📨 Sending request to Perplexity API (attempt {attempt + 1}/{max_retries + 1})...")
                start_time = time.perf_counter()
                
                response = session.post(
                    "https://api.perplexity.ai/chat/completions", 
                    headers=HEADERS, 
                    json=payload,
                    timeout=500  # 500 second timeout
                )
                
                duration = time.perf_counter() - start_time
                logger.info(f"📊 API request completed in {duration:.2f} seconds with status {response.status_code}")
                
                # Handle successful response
                if response.status_code == 200:
                    logger.info(f"✅ API request successful on attempt {attempt + 1}")
                    
                    try:
                        content = response.json()
                    except json.JSONDecodeError as je:
                        logger.error(f"❌ Failed to parse JSON response: {str(je)}")
                        logger.error(f"📄 Raw response: {response.text[:1000]}...")
                        if attempt < max_retries:
                            delay = base_delay * (2 ** attempt)
                            logger.warning(f"⏳ Retrying in {delay} seconds due to JSON parse error...")
                            time.sleep(delay)
                            continue
                        raise Exception(f"Failed to parse API response as JSON after {max_retries + 1} attempts")
                    
                    # Validate response structure
                    if "choices" not in content or not content["choices"]:
                        logger.error("❌ Missing or empty 'choices' key in API response")
                        logger.error(f"❌ Available keys in response: {list(content.keys())}")
                        if attempt < max_retries:
                            delay = base_delay * (2 ** attempt)
                            logger.warning(f"⏳ Retrying in {delay} seconds due to malformed response...")
                            time.sleep(delay)
                            continue
                        raise KeyError("Missing or empty 'choices' key in API response")
                    
                    # Extract and process the response
                    raw_json_text = content["choices"][0]["message"]["content"]
                    logger.info(f"📝 Received response content ({len(raw_json_text)} characters)")
                    
                    # Parse the JSON response
                    try:
                        report = _safe_parse_json(raw_json_text, report_customization)
                        logger.info("✅ Successfully parsed report JSON")
                    except Exception as pe:
                        logger.error(f"❌ Failed to parse report JSON: {str(pe)}")
                        if attempt < max_retries:
                            delay = base_delay * (2 ** attempt)
                            logger.warning(f"⏳ Retrying in {delay} seconds due to parsing error...")
                            time.sleep(delay)
                            continue
                        raise Exception(f"Failed to parse report JSON after {max_retries + 1} attempts: {str(pe)}")
                    
                    # Generate PDF
                    logger.debug("🖨️ Calling PDF generation helper...")
                    try:
                        _create_pdf(report, address, filename)
                        logger.info(f"✅ Report generation completed successfully for task {task_id}")
                        return report
                    except Exception as pdf_error:
                        logger.error(f"❌ PDF generation failed: {str(pdf_error)}")
                        # PDF generation failure is not retryable, so we raise immediately
                        raise Exception(f"PDF generation failed: {str(pdf_error)}")
                
                # Handle retryable errors (5xx server errors)
                elif response.status_code >= 500:
                    logger.warning(f"⚠️ Perplexity API returned server error {response.status_code}")
                    logger.warning(f"📄 Error response: {response.text[:500]}...")
                    
                    if attempt < max_retries:
                        delay = base_delay * (2 ** attempt)  # Exponential backoff: 1s, 2s, 4s
                        logger.warning(f"⏳ Retrying in {delay} seconds (attempt {attempt + 1}/{max_retries + 1})...")
                        time.sleep(delay)
                        continue
                    else:
                        logger.error(f"🔥 Perplexity API failed with {response.status_code} after {max_retries + 1} attempts")
                        raise Exception(f"Perplexity API server error {response.status_code} after {max_retries + 1} attempts: {response.text}")
                
                # Handle rate limiting (429)
                elif response.status_code == 429:
                    logger.warning(f"⚠️ Rate limited by Perplexity API (429)")
                    
                    if attempt < max_retries:
                        # For rate limiting, use a longer delay
                        delay = base_delay * (3 ** attempt)  # More aggressive backoff: 1s, 3s, 9s
                        logger.warning(f"⏳ Retrying in {delay} seconds due to rate limiting...")
                        time.sleep(delay)
                        continue
                    else:
                        logger.error(f"🔥 Rate limited by Perplexity API after {max_retries + 1} attempts")
                        raise Exception(f"Rate limited by Perplexity API after {max_retries + 1} attempts")
                
                # Handle non-retryable client errors (4xx except 429)
                elif 400 <= response.status_code < 500:
                    logger.error(f"❌ Perplexity API returned client error {response.status_code}")
                    logger.error(f"📄 Full response: {response.text}")
                    # Client errors are not retryable
                    raise Exception(f"Perplexity API client error {response.status_code}: {response.text}")
                
                # Handle other unexpected status codes
                else:
                    logger.error(f"❌ Perplexity API returned unexpected status {response.status_code}")
                    logger.error(f"📄 Full response: {response.text}")
                    raise Exception(f"Perplexity API unexpected status {response.status_code}: {response.text}")
                    
            except requests.exceptions.Timeout as te:
                logger.warning(f"⚠️ Request timeout on attempt {attempt + 1}: {str(te)}")
                if attempt < max_retries:
                    delay = base_delay * (2 ** attempt)
                    logger.warning(f"⏳ Retrying in {delay} seconds due to timeout...")
                    time.sleep(delay)
                    continue
                else:
                    logger.error(f"🔥 Request timed out after {max_retries + 1} attempts")
                    raise Exception(f"Request timed out after {max_retries + 1} attempts")
                    
            except requests.exceptions.ConnectionError as ce:
                logger.warning(f"⚠️ Connection error on attempt {attempt + 1}: {str(ce)}")
                if attempt < max_retries:
                    delay = base_delay * (2 ** attempt)
                    logger.warning(f"⏳ Retrying in {delay} seconds due to connection error...")
                    time.sleep(delay)
                    continue
                else:
                    logger.error(f"🔥 Connection failed after {max_retries + 1} attempts")
                    raise Exception(f"Connection failed after {max_retries + 1} attempts: {str(ce)}")
                    
            except requests.exceptions.RequestException as re:
                logger.warning(f"⚠️ Request exception on attempt {attempt + 1}: {str(re)}")
                if attempt < max_retries:
                    delay = base_delay * (2 ** attempt)
                    logger.warning(f"⏳ Retrying in {delay} seconds due to request exception...")
                    time.sleep(delay)
                    continue
                else:
                    logger.error(f"🔥 Request failed after {max_retries + 1} attempts")
                    raise Exception(f"Request failed after {max_retries + 1} attempts: {str(re)}")
                    
            except Exception as e:
                # For unexpected errors, log and re-raise without retry
                logger.error(f"❌ Unexpected error during API call: {str(e)}")
                logger.error(f"Exception type: {type(e).__name__}")
                logger.error(f"Traceback:\n{traceback.format_exc()}")
                raise Exception(f"Unexpected error during API call: {str(e)}")
        
        # This should never be reached due to the logic above, but just in case
        raise Exception(f"Failed to complete API request after {max_retries + 1} attempts")

    except Exception as e:
        logger.error(f"❌ Unhandled error in generate_report: {str(e)}")
        logger.error(f"Exception type: {type(e).__name__}")
        logger.error(f"Traceback:\n{traceback.format_exc()}")
        raise


