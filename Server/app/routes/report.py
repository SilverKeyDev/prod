from flask import Blueprint, request, jsonify, send_from_directory
import logging
import os
import traceback
from app.services.report_generator import generate_report, REPORTS
from app.services.s3_service import s3_service
from flask import current_app

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Blueprint setup
report_bp = Blueprint('report', __name__, url_prefix='/api/v1/report')

@report_bp.route('/generate', methods=['POST', 'GET'])
def generate_report_endpoint():
    """Generate a property report and upload PDF to S3"""
    try:
        logger.info("Report generation request received")
        
        if request.method == 'GET':
            logger.warning("GET request received for report generation endpoint")
            return jsonify({'error': 'POST method required for report generation'}), 405
        
        data = request.get_json()
        if not data:
            logger.error("No JSON data provided in request")
            return jsonify({'error': 'No data provided', 'success': False}), 400
        
        address = data.get('address')
        if not address:
            logger.error("No address provided in request data")
            return jsonify({'error': 'Address is required', 'success': False}), 400
        
        logger.info(f"Generating report for address: {address}")
        
        result_data = generate_report(address)
        
        logger.info(f"Report generation completed successfully for address: {address}")
        return jsonify({
            'success': True,
            'status': 'completed',
            'result': result_data
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
        logger.info("List reports request received")

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
                    'id': task_id,
                    'status': data.get('status'),
                    'generatedAt': data.get('timestamp'),
                    'pdfUrl': pdf_url,
                    'address': address
                }
                
                reports_list.append(report_data)

                # Track the S3 key if available
                if s3_key:
                    seen_keys.add(s3_key)

            except Exception as e:
                logger.error(f"Error processing report {task_id}: {str(e)}")
                reports_list.append({
                    'id': task_id,
                    'status': 'error',
                    'generatedAt': data.get('timestamp'),
                    'pdfUrl': None,
                    'address': data.get('address', 'Unknown Address'),
                    'error': str(e)
                })

        # Now pull directly from S3
        s3_client = s3_service.s3_client
        if s3_client:
            config = current_app.config
            bucket_name = config.get("S3_BUCKET_NAME_PDFS")

            logger.info(f"Listing objects in S3 bucket: {bucket_name}")
            response = s3_client.list_objects_v2(Bucket=bucket_name)

            for obj in response.get("Contents", []):
                s3_key = obj["Key"]
                if s3_key in seen_keys:
                    continue  # already included via REPORTS

                logger.debug(f"Found untracked file in S3: {s3_key}")

                presigned_url = s3_service.generate_presigned_url(s3_key)
                reports_list.append({
                    'id': s3_key.replace("/", "_"),
                    'status': 'completed',
                    'generatedAt': int(obj["LastModified"].timestamp()),
                    'pdfUrl': presigned_url,
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
