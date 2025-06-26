from flask import Blueprint, request, jsonify, send_from_directory
import logging
import os
from app.services.report_generator import generate_report, REPORTS

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Blueprint setup
report_bp = Blueprint('report', __name__, url_prefix='/api/v1/report')

@report_bp.route('/generate', methods=['POST', 'GET'])
def generate_report_endpoint():
    try:
        data = request.get_json()
        address = data.get('address')
        
        result_data = generate_report(address)

        return jsonify({
            'success': True,
            'status': 'completed',
        })
    except Exception as e:
        import traceback
        logger.exception("Unhandled error in generate_report_endpoint")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@report_bp.route('/all', methods=['GET'])
def list_reports():
    """Return a list of all generated reports with basic metadata."""
    try:
        reports_list = []
        for task_id, data in REPORTS.items():
            reports_list.append({
                'id': task_id,
                'status': data.get('status'),
                'generatedAt': data.get('timestamp'),
                'pdfUrl': data.get('pdfUrl'),
                'address': data.get('address', 'Unknown')
            })
        return jsonify({'success': True, 'reports': reports_list})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@report_bp.route('/static/reports/<path:filename>', methods=['GET'])
def serve_report(filename):
    """Serve static report files from the reports directory."""
    directory = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'static', 'reports')
    return send_from_directory(directory, filename, as_attachment=True)
