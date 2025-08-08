from flask import Blueprint, request, jsonify, send_from_directory, current_app
import logging
import os
import traceback
import uuid
from app.models.pdf_document import PDFDocument
from app import db
import time
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.report_generator import generate_report

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
report_bp = Blueprint('report', __name__, url_prefix='/api/v1/report')

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

@report_bp.route('/generate', methods=['POST', 'GET'])
@cross_origin(**cors_config)
def generate_report_endpoint():
    """
    Generate a property report and upload PDF to S3
    
    Checks if user has an active subscription or available reports before generating.
    If user has a subscription, report is generated without consuming reports.
    If no subscription but has reports, consumes one report on generation.
    """
    try:
        if request.method == 'GET':
            logger.warning("GET request received for report generation endpoint")
            return jsonify({'error': 'POST method required for report generation'}), 405
        
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
        comparison_address = data.get('comparisonAddress', None)  # Default to None if not provided
        target_user_id = data.get('user_id', None)  # For agent client selection
        marketing_model = data.get('marketing_model', False)  # For marketing model selection
        
        logger.info(f"📥 Request parameters: address='{address}', comparison_address='{comparison_address}', target_user_id='{target_user_id}', marketing_model={marketing_model}")
        
        if not address:
            logger.error("No address provided in request data")
            return jsonify({'error': 'Address is required', 'success': False}), 400
        
        # Determine which user's preferences to use for report generation
        preferences_user_id = user.id  # Default to authenticated user
        logger.info(f"🎯 Initial preferences_user_id set to authenticated user: {preferences_user_id}")
        logger.info(f"🔍 preferences_user_id type: {type(preferences_user_id)}, target_user_id type: {type(target_user_id)}")
        
        if target_user_id:
            # Agent is generating report for a client
            logger.info(f"🔄 Agent {user.id} requesting to generate report for client {target_user_id}")
            logger.info(f"🔍 target_user_id received as: '{target_user_id}' (type: {type(target_user_id)})")
            
            # Verify the agent has access to this client
            if not user.is_agent:
                logger.warning(f"Non-agent user {user.id} attempted to generate report for another user {target_user_id}")
                return jsonify({'error': 'Only agents can generate reports for other users', 'success': False}), 403
            
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
                logger.info(f"✅ Agent {user.id} authorized to generate report using preferences from client {target_user_id}")
                logger.info(f"🎯 preferences_user_id updated to client: {preferences_user_id} (type: {type(preferences_user_id)})")
                
            except (json.JSONDecodeError, TypeError) as e:
                logger.error(f"Failed to parse agent's client_ids: {str(e)}")
                return jsonify({'error': 'Invalid agent client configuration', 'success': False}), 500
        
        # Check if this is a comparison report
        is_comparison = bool(comparison_address and comparison_address.strip())
        
        logger.info(f"📊 FINAL DECISION - Using preferences from user_id: {preferences_user_id}")
        if preferences_user_id == user.id:
            logger.info(f"📋 Will use AUTHENTICATED USER's preferences (user_id: {user.id})")
        else:
            logger.info(f"📋 Will use CLIENT's preferences (client_id: {preferences_user_id}, agent_id: {user.id})")
        
        if is_comparison:
            logger.info(f" Generating comparison report for: {address} vs {comparison_address} using preferences from user_id: {preferences_user_id}")
        else:
            logger.info(f" Generating detailed report for: {address} using preferences from user_id: {preferences_user_id}")

        safe_address = "".join(c for c in address if c.isalnum() or c in (' ', '-', '_')).rstrip().replace(' ', '_')
        
        # Create simplified filename with just address and random code
        random_code = uuid.uuid4().hex[:17]
        
        if is_comparison:
            safe_comparison_address = "".join(c for c in comparison_address if c.isalnum() or c in (' ', '-', '_')).rstrip().replace(' ', '_')
            simple_filename = f"{safe_address}_vs_{safe_comparison_address}.pdf"
            filenamee = f"{user.id}/reports/comparison/{random_code}_{simple_filename}"
        elif marketing_model:
            simple_filename = f"{safe_address}.pdf"
            filenamee = f"{user.id}/reports/marketing/{random_code}_{simple_filename}"
        else:
            simple_filename = f"{safe_address}.pdf"
            filenamee = f"{user.id}/reports/standard/{random_code}_{simple_filename}"

        pdf_doc = PDFDocument(
                id=str(uuid.uuid4()),
                user_id=user.id,
                filename=filenamee,
                file_path=filenamee,  # Use the same path since it's stored in S3
                status='generating',
                primary_address=address,
                comparison_address=comparison_address if is_comparison else None,
                report_type='comparison' if is_comparison else 'detailed',
            )
        db.session.add(pdf_doc)
        db.session.commit()
        
        # Start async task (lazy import to avoid circular import)
        # Always use the unified generate_report_async task, passing comparison_address (None for detailed reports)
        # Use preferences_user_id for report generation (could be agent's client or agent themselves)
        logger.info(f"🚀 Starting async task with preferences_user_id: {preferences_user_id} (type: {type(preferences_user_id)})")
        from app.celery.tasks import generate_report_async
        task = generate_report_async.delay(address, comparison_address, filenamee, pdf_doc.id, preferences_user_id, marketing_model)
        
        if is_comparison:
            logger.info(f"Started comparison report task {task.id} for addresses: {address} vs {comparison_address} using preferences from user {preferences_user_id}")
        else:
            logger.info(f"Started detailed report task {task.id} for address: {address} using preferences from user {preferences_user_id}")
        
        return jsonify({
            'success': True,
            'status': 'started',
            'task_id': task.id,
            'document_id': pdf_doc.id,
            'report_type': 'comparison' if is_comparison else 'detailed',
            'addresses': {
                'primary': address,
                'comparison': comparison_address if is_comparison else None
            }
        })

    except Exception as e:
        logger.error(f"Unhandled error in generate_report_endpoint: {str(e)}")
        logger.error(f"Exception type: {type(e).__name__}")
        logger.error(f"Traceback: {traceback.format_exc()}")

        # Update the report status to 'error'
        if 'pdf_doc' in locals() and pdf_doc:
            try:
                pdf_doc.status = 'error'
                db.session.commit()
                logger.info(f"Updated report {pdf_doc.id} status to 'error'")
            except Exception as db_err:
                logger.error(f"Failed to update report status to 'error': {db_err}")
                db.session.rollback()

        # Determine the correct status code and error message
        if isinstance(e, ValueError):
            return jsonify({'error': str(e), 'success': False}), 400
        else:
            return jsonify({'error': 'Internal server error', 'success': False}), 500

@report_bp.route('/all', methods=['POST', 'GET'])
@cross_origin(**cors_config)
def list_reports():
    try:
        reports_list = []
        seen_names = set()
        user = get_current_user()
        if not user:
            logger.error(f"User not found with ID: {current_user_id}")
            return jsonify({'error': 'User not found', 'success': False}), 404

        # Get generating and processed reports from database
        generating_reports = PDFDocument.query.filter(
            PDFDocument.user_id == user.id,
            or_(
                PDFDocument.status == 'generating',
                PDFDocument.status == 'error'
            )
        ).all()
        
        for report in generating_reports:
            # Map 'processed' status to 'completed' for frontend compatibility
            status = 'completed' if report.status == 'processed' else report.status
            reports_list.append({
                'id': report.id,
                'status': status,
                'generatedAt': int(report.created_at.timestamp()),
                'address': os.path.splitext(os.path.basename(report.filename))[0],
                's3Key': report.file_path
            })
            logger.info(f"Found {report.status} report for user {user.id}: {report.id}")

        # Get completed reports from S3 using prefix filtering for new tree structure
        s3_client = s3_service.s3_client
        if s3_client:
            bucket_name = current_app.config.get("S3_BUCKET_NAME_PDFS")
            # Use prefix to only list objects under this user's directory
            user_prefix = f"{user.id}/reports/"
            response = s3_client.list_objects_v2(Bucket=bucket_name, Prefix=user_prefix)

            for obj in response.get("Contents", []):
                s3_key = obj["Key"]
                file_name = os.path.basename(s3_key)

                if file_name in seen_names:
                    continue  # skip duplicate

                if not file_name.endswith('.pdf'):
                    continue

                presigned_url = s3_service.generate_presigned_url(s3_key, download_filename=file_name)
                reports_list.append({
                    'id': file_name,
                    'status': 'completed',
                    'generatedAt': int(obj["LastModified"].timestamp()),
                    'pdfUrl': presigned_url,
                    'address': os.path.splitext(file_name)[0],
                    's3Key': s3_key
                })

        else:
            logger.warning("S3 client not initialized, cannot list bucket")

        # Sort reports with generating ones first, using default timestamp if missing
        reports_list.sort(key=lambda x: (x['status'] != 'generating', x.get('generatedAt', 0)), reverse=True)

        return jsonify({'success': True, 'reports': reports_list})

    except Exception as e:
        logger.error(f"Error listing reports: {str(e)}")
        logger.error(traceback.format_exc())

        # Optionally mark generating reports as errored
        if 'generating_reports' in locals():
            try:
                for report in generating_reports:
                    report.status = 'error'
                db.session.commit()
            except Exception as db_err:
                logger.error(f"Failed to update report statuses: {db_err}")
                db.session.rollback()

        return jsonify({'error': 'Internal server error', 'success': False}), 500

@report_bp.route('/poll/<document_id>', methods=['GET'])
@cross_origin(**cors_config)
def poll_report_status(document_id):
    """
    Poll for a specific report's status by document ID.
    Returns only the specific report data or null if not found/completed.
    More efficient than fetching all reports for polling purposes.
    """
    try:
        # Get current user
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found', 'success': False}), 404

        # Look for the report in the database first
        report = PDFDocument.query.filter(
            PDFDocument.id == document_id,
            PDFDocument.user_id == user.id
        ).first()

        if not report:
            logger.info(f"Report {document_id} not found in database for user {user.id}")
            return jsonify({
                'success': True,
                'report': None,
                'message': 'Report not found'
            }), 200

        # Map status for frontend compatibility
        status = 'completed' if report.status == 'processed' else report.status
        
        report_data = {
            'id': report.id,
            'status': status,
            'generatedAt': int(report.created_at.timestamp()),
            'address': os.path.splitext(os.path.basename(report.filename))[0],
            's3Key': report.file_path
        }
        
        return jsonify({
            'success': True,
            'report': report_data
        }), 200

    except Exception as e:
        logger.error(f"Error polling report {document_id}: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Internal server error', 'success': False}), 500

@report_bp.route('/almostall', methods=['POST', 'GET'])
@cross_origin(**cors_config)
def list_reports_almostall():
    try:
        reports_list = []
        seen_names = set()
        user = get_current_user()
        if not user:
            logger.error(f"User not found with ID: {current_user_id}")
            return jsonify({'error': 'User not found', 'success': False}), 404

        # Get only standard ('detailed') reports from database for comparison functionality
        standard_reports = PDFDocument.query.filter(
            PDFDocument.user_id == user.id,
            PDFDocument.report_type == 'detailed',
            or_(PDFDocument.status == 'processed', PDFDocument.status == 'completed')
        ).all()

        # Create a set of valid filenames from database
        valid_filenames = {doc.filename for doc in standard_reports}

        # Get completed reports from S3 using prefix filtering for new tree structure
        s3_client = s3_service.s3_client
        if s3_client:
            bucket_name = current_app.config.get("S3_BUCKET_NAME_PDFS")
            # Use prefix to only list objects under this user's directory
            user_prefix = f"{user.id}/reports/"
            response = s3_client.list_objects_v2(Bucket=bucket_name, Prefix=user_prefix)

            for obj in response.get("Contents", []):
                s3_key = obj["Key"]
                file_name = os.path.basename(s3_key)

                if file_name in seen_names:
                    continue  # skip duplicate

                if not file_name.endswith('.pdf'):
                    continue

                # Only include files that are standard reports according to database
                if file_name not in valid_filenames:
                    continue

                presigned_url = s3_service.generate_presigned_url(s3_key, download_filename=file_name)
                reports_list.append({
                    'id': file_name.replace("/", "_"),
                    'status': 'completed',
                    'generatedAt': int(obj["LastModified"].timestamp()),
                    'pdfUrl': presigned_url,
                    'address': os.path.splitext(file_name)[0],
                    's3Key': s3_key
                })

        else:
            logger.warning("S3 client not initialized, cannot list bucket")

        # Sort reports with generating ones first, using default timestamp if missing
        reports_list.sort(key=lambda x: (x['status'] != 'generating', x.get('generatedAt', 0)), reverse=True)

        return jsonify({'success': True, 'reports': reports_list})

    except Exception as e:
        logger.error(f"Error listing reports: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Internal server error'}), 500

@report_bp.route('/<report_id>/download-url', methods=['GET'])
def get_download_url(report_id):
    """Generate a fresh presigned URL for downloading a specific report."""
    try:
        logger.info(f"Download URL request received for report: {report_id}")

        if not report_id:
            logger.error("No report ID provided")
            return jsonify({'error': 'Report ID is required'}), 400

        # Fetch report from DB
        report = PDFDocument.query.filter_by(id=report_id).first()
        if not report:
            logger.error(f"Report not found for ID: {report_id}")
            return jsonify({'error': 'Report not found'}), 404

        pdf_url = report.pdf_url or report.file_path
        if not pdf_url:
            logger.error(f"PDF URL or S3 key missing for report: {report_id}")
            return jsonify({'error': 'PDF not found for this report'}), 404

        logger.debug(f"Processing PDF URL for report {report_id}: {pdf_url}")

        # If already a full presigned URL, return it
        if pdf_url.startswith("http"):
            logger.debug(f"PDF URL is already a presigned URL: {pdf_url[:100]}...")
            return jsonify({
                'success': True,
                'downloadUrl': pdf_url
            })

        # Generate new presigned URL with attachment download disposition
        if not pdf_url.startswith("/"):
            filename = os.path.basename(pdf_url)
            logger.info(f"Generating fresh presigned URL for S3 key: {pdf_url}")
            fresh_url = s3_service.generate_presigned_url(pdf_url, download_filename=filename)
            if fresh_url:
                logger.info(f"Successfully generated presigned URL for report {report_id}")
                return jsonify({'success': True, 'downloadUrl': fresh_url})
            else:
                logger.error(f"Failed to generate presigned URL for {pdf_url}")
                return jsonify({'error': 'Failed to generate download URL'}), 500

        # Local static path fallback (if used)
        logger.debug(f"PDF URL is a local file path: {pdf_url}")
        return jsonify({'success': True, 'downloadUrl': pdf_url})

    except Exception as e:
        logger.error(f"Error generating download URL for report {report_id}: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': 'Internal server error'}), 500

@report_bp.route('/<report_id>/view-url', methods=['GET'])
def get_view_url(report_id):
    """Generate a fresh presigned URL for viewing a specific report inline in browser."""
    try:
        logger.info(f"View URL request received for report: {report_id}")

        if not report_id:
            logger.error("No report ID provided")
            return jsonify({'error': 'Report ID is required'}), 400

        # Fetch report from DB
        report = PDFDocument.query.filter(
            func.lower(PDFDocument.file_path).like(f"%{report_id.lower()}")
        ).first()
        if not report:
            logger.error(f"Report not found for ID: {report_id}")
            return jsonify({'error': 'Report not found'}), 404

        pdf_url = report.file_path
        if not pdf_url:
            logger.error(f"PDF URL or S3 key missing for report: {report_id}")
            return jsonify({'error': 'PDF not found for this report'}), 404

        logger.info(f"Generating fresh view URL for S3 key: {pdf_url}")
        fresh_url = s3_service.generate_view_url(pdf_url)
        if fresh_url:
            logger.info(f"Successfully generated view URL for report {report_id}")
            return jsonify({'success': True, 'viewUrl': fresh_url})
        else:
            logger.error(f"Failed to generate view URL for {pdf_url}")
            return jsonify({'error': 'Failed to generate view URL'}), 500

    except Exception as e:
        logger.error(f"Error generating view URL for report {report_id}: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': 'Internal server error'}), 500

@report_bp.route('/compare', methods=['POST'])
@cross_origin(**cors_config)
def compare_reports_endpoint():
    """Compare multiple report JSON files and return flattened table data."""
    try:
        data = request.get_json() or {}
        s3_keys = data.get('s3Keys')
        if not s3_keys or not isinstance(s3_keys, list):
            return jsonify({'success': False, 'error': 's3Keys (list) is required'}), 400

        from app.services.report_comparator import compare_reports
        df = compare_reports(s3_keys)
        table = df.reset_index().to_dict(orient='records')  # include address in index column
        return jsonify({'success': True, 'table': table})
    except Exception as e:
        logger.error(f"Error comparing reports: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@report_bp.route('/static/reports/<path:filename>', methods=['GET'])
def serve_report(filename):
    """Serve static report files from the reports directory (fallback for local files)."""
    try:
        logger.info(f"Serving static report file: {filename}")
        
        if not filename:
            logger.error("No filename provided for static file serving")
            return jsonify({'error': 'Filename is required'}), 400
        
        # Validate filename to prevent directory traversal
        if '..' in filename or '/' in filename:
            logger.error(f"Invalid filename provided: {filename}")
            return jsonify({'error': 'Invalid filename'}), 400
        
        directory = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'static', 'reports')
        
        # Check if file exists
        file_path = os.path.join(directory, filename)
        if not os.path.exists(file_path):
            logger.error(f"Static file not found: {file_path}")
            return jsonify({'error': 'File not found'}), 404
        
        logger.info(f"Serving static file: {file_path}")
        return send_from_directory(directory, filename, as_attachment=False, mimetype='application/pdf')
        
    except Exception as e:
        logger.error(f"Error serving static file {filename}: {str(e)}")
        logger.error(f"Exception type: {type(e).__name__}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': 'Internal server error'}), 500

@report_bp.route('/<report_id>', methods=['DELETE'])
def delete_report(report_id):
    """Delete a report from S3 and in-memory storage"""
    logger.info(f"[DELETE] Received delete request for report_id: {report_id}")
    
    try:
        # Log request data
        data = request.get_json() or {}
        s3_key = data.get('s3Key')
        logger.info(f"[DELETE] Request data - s3Key: {s3_key}")
        
        # Delete from S3 if s3_key is provided and s3_client is available
        if s3_key:
            if not s3_service.s3_client:
                logger.warning("[DELETE] S3 client not available, skipping S3 deletion")
            else:
                try:
                    config = current_app.config
                    bucket_name = config.get("S3_BUCKET_NAME_PDFS")
                    
                    if not bucket_name:
                        logger.error("[DELETE] S3_BUCKET_NAME_PDFS not configured")
                    else:
                        # Ensure the key doesn't start with a slash
                        s3_key = s3_key.lstrip('/')
                        logger.info(f"[DELETE] Attempting to delete from S3 - Bucket: {bucket_name}, Key: {s3_key}")
                        
                        # Check if the object exists before trying to delete
                        try:
                            logger.info("[DELETE] Checking if object exists in S3...")
                            s3_service.s3_client.head_object(Bucket=bucket_name, Key=s3_key)
                            logger.info("[DELETE] Object exists, proceeding with deletion...")
                            
                            # Delete the main PDF
                            delete_response = s3_service.s3_client.delete_object(
                                Bucket=bucket_name, 
                                Key=s3_key
                            )
                            logger.info(f"[DELETE] Successfully deleted from S3. Response: {delete_response}")
                            
                            # Also delete the JSON version using the simplified tree structure
                            if '/' in s3_key:
                                # New tree structure: userid/reports/type/filename.pdf -> userid/json/type/filename.json
                                path_parts = s3_key.split('/')
                                if len(path_parts) >= 3 and path_parts[1] == 'reports':
                                    user_id = path_parts[0]
                                    report_type = path_parts[2]
                                    pdf_filename = path_parts[3]
                                    raw_s3_key = f"{user_id}/json/{report_type}/{pdf_filename.removesuffix('.pdf')}.json"
                                else:
                                    # Fallback for unexpected structure
                                    raw_s3_key = s3_key.replace('.pdf', '.json')
                            else:
                                # Old flat structure fallback
                                raw_s3_key = s3_key.replace('.pdf', '.json')
                            try:
                                s3_service.s3_client.head_object(Bucket=bucket_name, Key=raw_s3_key)
                                raw_delete_response = s3_service.s3_client.delete_object(
                                    Bucket=bucket_name,
                                    Key=raw_s3_key
                                )
                                logger.info(f"[DELETE] Successfully deleted RAW version from S3: {raw_s3_key}")
                            except s3_service.s3_client.exceptions.ClientError as e:
                                if e.response['Error']['Code'] == '404':
                                    logger.info(f"[DELETE] No RAW version found at {raw_s3_key}, skipping")
                                else:
                                    logger.error(f"[DELETE] Error checking/deleting RAW version: {str(e)}")
                            except Exception as e:
                                logger.error(f"[DELETE] Unexpected error with RAW version: {str(e)}")
                            
                        except s3_service.s3_client.exceptions.ClientError as e:
                            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
                            if error_code == '404':
                                logger.warning(f"[DELETE] S3 object not found (404): {s3_key}")
                            elif error_code == '403':
                                logger.error("[DELETE] Permission denied when accessing S3. Check IAM permissions.")
                                logger.error(f"[DELETE] Error details: {str(e)}")
                            else:
                                logger.error(f"[DELETE] S3 client error: {str(e)}")
                                logger.error(f"[DELETE] Response: {e.response}")
                            # Continue execution to delete from in-memory
                        except Exception as e:
                            logger.error(f"[DELETE] Unexpected error during S3 deletion: {str(e)}")
                            logger.error(traceback.format_exc())
                            # Continue execution to delete from in-memory
                except Exception as e:
                    logger.error(f"[DELETE] Error in S3 deletion process: {str(e)}")
                    logger.error(traceback.format_exc())
        
        # Delete from database
        db_deleted = False
        try:
            pdf_doc = None
            
            # Strategy 1: If we have s3_key, try to find by filename first (most reliable)
            if s3_key:
                filename = os.path.basename(s3_key)
                logger.info(f"[DELETE] Searching for PDF document by filename: {filename}")
                pdf_doc = PDFDocument.query.filter_by(filename=filename).first()
                
                # Also try to find by file_path (s3_key)
                if not pdf_doc:
                    logger.info(f"[DELETE] Not found by filename, trying by file_path: {s3_key}")
                    pdf_doc = PDFDocument.query.filter_by(file_path=s3_key).first()
            
            # Strategy 2: Try to find the document by its UUID (report_id) as fallback
            if not pdf_doc:
                logger.info(f"[DELETE] Trying to find PDF document by ID: {report_id}")
                pdf_doc = PDFDocument.query.get(report_id)
            
            # Strategy 3: If still not found and we have s3_key, try partial matches
            if not pdf_doc and s3_key:
                logger.info(f"[DELETE] Trying partial file_path match for: {s3_key}")
                # Try to find by partial file_path match (in case of URL encoding issues)
                pdf_doc = PDFDocument.query.filter(
                    PDFDocument.file_path.like(f"%{os.path.basename(s3_key)}%")
                ).first()

            if pdf_doc:
                logger.info(f"[DELETE] Found PDF document in DB - ID: {pdf_doc.id}, filename: {pdf_doc.filename}, file_path: {pdf_doc.file_path}")
                db.session.delete(pdf_doc)
                db.session.commit()
                db_deleted = True
                logger.info(f"[DELETE] Successfully deleted PDF document from database: {pdf_doc.id}")
            else:
                logger.warning(f"[DELETE] PDF document not found in database for report_id: {report_id}, s3_key: {s3_key}")
                # Log all PDF documents for this user to help debug
                user = get_current_user()
                if user:
                    user_docs = PDFDocument.query.filter_by(user_id=user.id).all()
                    logger.info(f"[DELETE] User {user.id} has {len(user_docs)} PDF documents:")
                    for doc in user_docs:
                        logger.info(f"[DELETE]   - ID: {doc.id}, filename: {doc.filename}, file_path: {doc.file_path}")
        except Exception as e:
            db.session.rollback()
            logger.error(f"[DELETE] Error deleting from database: {str(e)}")
            logger.error(traceback.format_exc())
        
        logger.info(f"[DELETE] Successfully completed deletion for report {report_id}")
        return jsonify({
            'success': True, 
            'message': 'Report deleted successfully',
            'deleted_from_s3': bool(s3_key and s3_service.s3_client),
            'deleted_from_db': db_deleted
        })
        
    except Exception as e:
        error_msg = f"[DELETE] Critical error in delete_report: {str(e)}"
        logger.error(error_msg)
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False, 
            'error': error_msg,
            'traceback': traceback.format_exc()
        }), 500


@report_bp.route('/documents', methods=['GET'])
@cross_origin(**cors_config)
def get_user_documents():
    """
    Get all documents from a user's documents directory.
    Returns all PDF documents and their metadata for the authenticated user.
    """
    try:
        # Get current user from JWT token
        current_user = get_current_user()
        if not current_user:
            logger.warning("❌ [USER_DOCUMENTS] Unauthorized access attempt")
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
        user_id = current_user.id
        logger.info(f"📁 [USER_DOCUMENTS] Fetching all documents for user {user_id}")
        
        # Query all PDF documents for the user and type
        documents = PDFDocument.query.filter(
            PDFDocument.user_id == user_id,
            PDFDocument.report_type == 'detailed',
        ).all()
        
        logger.info(f"📊 [USER_DOCUMENTS] Found {len(documents)} documents for user {user_id}")
        
        # Convert documents to dictionary format
        documents_data = []
        for doc in documents:
            doc_data = {
                'id': doc.id,
                'filename': doc.filename,
                'file_path': doc.file_path,
                'status': doc.status,
                'created_at': doc.created_at.isoformat() if doc.created_at else None,
                'updated_at': doc.updated_at.isoformat() if doc.updated_at else None,
                'user_id': doc.user_id,
                'report_type': getattr(doc, 'report_type', None),
                'address': getattr(doc, 'address', None),
                'city': getattr(doc, 'city', None),
                'state': getattr(doc, 'state', None),
                'zip_code': getattr(doc, 'zip_code', None)
            }
            documents_data.append(doc_data)
        
        logger.info(f"✅ [USER_DOCUMENTS] Successfully retrieved {len(documents_data)} documents")
        
        return jsonify({
            'success': True,
            'documents': documents_data,
            'count': len(documents_data)
        }), 200
        
    except Exception as e:
        error_msg = f"Failed to retrieve user documents: {str(e)}"
        logger.error(f"❌ [USER_DOCUMENTS] {error_msg}")
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': error_msg,
            'traceback': traceback.format_exc()
        }), 500