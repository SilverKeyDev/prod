from flask import Blueprint, request, jsonify, send_from_directory, current_app
import logging
import os
import traceback
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.report_generator import generate_report, REPORTS
from app.services.s3_service import s3_service
from flask import current_app
from app import db
from flask_cors import cross_origin
from jose import jwt
import requests
import os
from app.models.user import User
from app.models.pdf_document import PDFDocument


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
            audience=COGNITO_CLIENT_ID
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
            logger.error(f"User not found with ID: {current_user_id}")
            return jsonify({'error': 'User not found', 'success': False}), 404
        
        # Check if user has an active subscription
        has_active_subscription = user.subscription and user.subscription.status == 'active'
        
        # If no active subscription, check available reports
        if not has_active_subscription:
            if user.reports_available <= 0:
                logger.warning(f"User {user.id} has no active subscription and no reports available")
                return jsonify({
                    'success': False,
                    'error': 'NO_REPORTS_AVAILABLE',
                    'message': 'No reports available. Please purchase a subscription or more reports.'
                }), 402  # Payment Required
            
            # Deduct one report for non-subscription users
            user.reports_available -= 1
            db.session.commit()
            logger.info(f"Deducted 1 report from user {user.id}. Remaining: {user.reports_available}")
        
        data = request.get_json()
        if not data:
            logger.error("No JSON data provided in request")
            return jsonify({'error': 'No data provided', 'success': False}), 400
        
        address = data.get('address')
        if not address:
            logger.error("No address provided in request data")
            return jsonify({'error': 'Address is required', 'success': False}), 400
        
        # Generate the report
        result_data = generate_report(address)
        
        logger.info(f"Report generated for user {user.id}. Reports remaining: {user.reports_available}")
        
        return jsonify({
            'success': True,
            'status': 'completed',
            'result': result_data,
            'reports_remaining': user.reports_available
        })
        
    except ValueError as e:
        logger.error(f"Validation error in report generation: {str(e)}")
        return jsonify({'error': str(e), 'success': False}), 400
    except Exception as e:
        logger.error(f"Unhandled error in generate_report_endpoint: {str(e)}")
        logger.error(f"Exception type: {type(e).__name__}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': 'Internal server error', 'success': False}), 500

@report_bp.route('/all', methods=['GET'])
def list_reports():
    """
    Return a list of all generated reports with basic metadata,
    combining in-memory REPORTS plus any PDFs directly found in S3.
    """
    try:
        reports_list = []
        seen_names = set()

        # First add the in-memory reports
        for task_id, data in REPORTS.items():
            try:
                pdf_url = data.get('pdfUrl')
                address = data.get('address', 'Unknown Address')
                s3_key = None

                if pdf_url and not pdf_url.startswith(('http', '/')):
                    s3_key = pdf_url
                    pdf_url = s3_service.generate_presigned_url(s3_key)
                elif pdf_url and pdf_url.startswith('http'):
                    # extract filename from presigned url
                    s3_key = os.path.basename(pdf_url.split('?')[0])

                # store just the file name for deduplication
                if s3_key:
                    seen_names.add(os.path.basename(s3_key))

                reports_list.append({
                    'id': task_id,
                    'status': data.get('status'),
                    'generatedAt': data.get('timestamp'),
                    'pdfUrl': pdf_url,
                    'address': address,
                    's3Key': s3_key
                })

            except Exception as e:
                logger.error(f"Error processing report {task_id}: {str(e)}")
                reports_list.append({
                    'id': task_id,
                    'status': 'error',
                    'generatedAt': data.get('timestamp'),
                    'pdfUrl': None,
                    'address': address,
                    'error': str(e)
                })

        # Now list S3 objects
        s3_client = s3_service.s3_client
        if s3_client:
            bucket_name = current_app.config.get("S3_BUCKET_NAME_PDFS")
            response = s3_client.list_objects_v2(Bucket=bucket_name)

            for obj in response.get("Contents", []):
                s3_key = obj["Key"]
                file_name = os.path.basename(s3_key)

                if file_name in seen_names:
                    continue  # skip duplicate

                presigned_url = s3_service.generate_presigned_url(s3_key)
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

        logger.info(f"Returning {len(reports_list)} reports combined from memory + S3")
        return jsonify({'success': True, 'reports': reports_list})

    except Exception as e:
        logger.error(f"Error listing reports: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Internal server error'}), 500

@report_bp.route('/allnames', methods=['GET'])
def list_report_names():
    """
    Return a list of all generated reports with basic metadata,
    combining in-memory REPORTS plus any PDFs directly found in S3.
    """
    try:
        reports_list = []
        seen_keys = set()

        # First add the in-memory reports
        logger.debug(f"Processing {len(REPORTS)} in-memory reports")

        for task_id, data in REPORTS.items():
            try:
                pdf_url = data.get('pdfUrl')
                original_pdf_url = pdf_url
                address = data.get('address', 'Unknown Address')
                
                # Extract the S3 key if this is an S3 URL
                s3_key = None
                if pdf_url and not pdf_url.startswith('http') and not pdf_url.startswith('/'):
                    s3_key = pdf_url
                    # This is an S3 key, generate a presigned URL
                    fresh_url = s3_service.generate_presigned_url(s3_key)
                    if fresh_url:
                        pdf_url = fresh_url
                    else:
                        logger.warning(f"Failed to generate presigned URL for {original_pdf_url}")

                report_data = {
                    'address': address
                }
                
                reports_list.append(report_data)

                # Track the S3 key if available
                if s3_key:
                    seen_keys.add(s3_key)

            except Exception as e:
                logger.error(f"Error processing report {task_id}: {str(e)}")
                reports_list.append({
                    'address': data.get('address', 'Unknown Address')
                })

        # Now pull directly from S3
        s3_client = s3_service.s3_client
        if s3_client:
            config = current_app.config
            bucket_name = config.get("S3_BUCKET_NAME_PDFS")
            response = s3_client.list_objects_v2(Bucket=bucket_name)

            for obj in response.get("Contents", []):
                s3_key = obj["Key"]
                if s3_key in seen_keys:
                    continue  # already included via REPORTS

                reports_list.append({
                    'address': os.path.splitext(os.path.basename(s3_key))[0]
                })

        else:
            logger.warning("S3 client not initialized, cannot list bucket")

        logger.info(f"Returning {len(reports_list)} reports combined from memory + S3")
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
        
        if report_id not in REPORTS:
            logger.error(f"Report not found: {report_id}")
            return jsonify({'error': 'Report not found'}), 404
        
        report_data = REPORTS[report_id]
        pdf_url = report_data.get('pdfUrl')
        
        if not pdf_url:
            logger.error(f"PDF not found for report: {report_id}")
            return jsonify({'error': 'PDF not found for this report'}), 404
        
        logger.debug(f"Processing PDF URL for report {report_id}: {pdf_url}")
        
        # If it's already a presigned URL, return it
        if pdf_url.startswith('http'):
            logger.debug(f"PDF URL is already a presigned URL: {pdf_url[:100]}...")
            return jsonify({
                'success': True,
                'downloadUrl': pdf_url
            })
        
        # If it's an S3 key, generate a fresh presigned URL
        if not pdf_url.startswith('/'):
            logger.info(f"Generating fresh presigned URL for S3 key: {pdf_url}")
            fresh_url = s3_service.generate_presigned_url(pdf_url)
            if fresh_url:
                logger.info(f"Successfully generated presigned URL for report {report_id}")
                return jsonify({
                    'success': True,
                    'downloadUrl': fresh_url
                })
            else:
                logger.error(f"Failed to generate presigned URL for S3 key: {pdf_url}")
                return jsonify({'error': 'Failed to generate download URL'}), 500
        
        # If it's a local file path, return the static URL
        logger.debug(f"PDF URL is a local file path: {pdf_url}")
        return jsonify({
            'success': True,
            'downloadUrl': pdf_url
        })
        
    except Exception as e:
        logger.error(f"Error generating download URL for report {report_id}: {str(e)}")
        logger.error(f"Exception type: {type(e).__name__}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': 'Internal server error'}), 500

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
                            
                            # Perform the deletion
                            delete_response = s3_service.s3_client.delete_object(
                                Bucket=bucket_name, 
                                Key=s3_key
                            )
                            
                            logger.info(f"[DELETE] Successfully deleted from S3. Response: {delete_response}")
                            
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
        
        # Delete from in-memory storage
        logger.info(f"[DELETE] Attempting to delete from in-memory storage: {report_id}")
        if report_id in REPORTS:
            del REPORTS[report_id]
            logger.info(f"[DELETE] Successfully removed report from memory: {report_id}")
        else:
            logger.warning(f"[DELETE] Report ID {report_id} not found in memory storage")
        
        logger.info(f"[DELETE] Successfully completed deletion for report {report_id}")
        return jsonify({
            'success': True, 
            'message': 'Report deleted successfully',
            'deleted_from_s3': bool(s3_key and s3_service.s3_client)
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