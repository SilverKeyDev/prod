from flask import Blueprint, request, jsonify, Response
from ..services.auth.current_user import get_current_user, SecurityException
from ..utils.common_patterns import require_authenticated_user
from ..utils.security import rate_limit
from jose.exceptions import JWTError, ExpiredSignatureError
from ..models import PDFDocument
from .. import db
import os
from sqlalchemy import or_
from ..services.documents import s3_service, DocumentService
from app.utils.security.app_logging import get_logger
import traceback
import time

# Get logger using centralized utility
logger = get_logger()

# Blueprint setup
report_bp = Blueprint('report', __name__, url_prefix='/api/v1/report')


@report_bp.route('/list', methods=['GET'])
@rate_limit(max_requests=50, window_seconds=60)
def list_reports():
    try:
        reports_list = []
        seen_names = set()
        user = get_current_user()
        if not user:
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

        # Get completed reports from S3 using service layer
        s3_objects = DocumentService.list_user_reports(user.id)
        
        for obj in s3_objects:
            s3_key = obj.get("Key") if isinstance(obj, dict) else getattr(obj, 'Key', None)
            if not s3_key:
                continue
            file_name = os.path.basename(s3_key)

            if file_name in seen_names:
                continue  # skip duplicate

            if not file_name.endswith('.pdf'):
                continue

            # Try to find the corresponding database record to get the proper UUID
            db_report = PDFDocument.query.filter(
                PDFDocument.user_id == user.id,
                PDFDocument.file_path == s3_key
            ).first()
            
            # Use database ID if found, otherwise fall back to filename (for legacy reports)
            report_id = db_report.id if db_report else file_name
            
            presigned_url = s3_service.generate_presigned_url(s3_key, download_filename=file_name)
            
            # Handle LastModified timestamp
            last_modified = obj.get("LastModified") if isinstance(obj, dict) else getattr(obj, 'LastModified', None)
            if last_modified and hasattr(last_modified, 'timestamp'):
                generated_at = int(last_modified.timestamp())
            else:
                generated_at = int(time.time())
            
            reports_list.append({
                'id': report_id,
                'status': 'completed',
                'generatedAt': generated_at,
                'pdfUrl': presigned_url,
                'address': os.path.splitext(file_name)[0],
                's3Key': s3_key
            })

        if not s3_objects and not s3_service.s3_client:
            logger.warning("S3 client not initialized, cannot list bucket")

        # Sort reports with generating ones first, using default timestamp if missing
        reports_list.sort(key=lambda x: (x['status'] != 'generating', x.get('generatedAt', 0)), reverse=True)

        return jsonify({'success': True, 'reports': reports_list})

    except (SecurityException, ExpiredSignatureError, JWTError) as e:
        return jsonify({'success': False, 'error': 'Authentication required'}), 401
    except Exception as e:
        logger.error(f"Error listing reports: {str(e)}")
        logger.error(traceback.format_exc())

        return jsonify({'error': 'Internal server error', 'success': False}), 500

@report_bp.route('/<report_id>/download-url', methods=['GET'])
@require_authenticated_user
def get_download_url(user, report_id):
    """Generate a fresh presigned URL for downloading a specific report."""
    try:
        report = PDFDocument.query.filter_by(id=report_id, user_id=user.id).first()
        if not report or not report.file_path:
            return jsonify({'error': 'Report not found'}), 404

        pdf_url = report.file_path
        if pdf_url.startswith("http"):
            return jsonify({'success': True, 'downloadUrl': pdf_url})

        filename = os.path.basename(pdf_url)
        fresh_url = s3_service.generate_presigned_url(pdf_url, download_filename=filename)
        if not fresh_url:
            return jsonify({'error': 'Failed to generate download URL'}), 500

        return jsonify({'success': True, 'downloadUrl': fresh_url})

    except (SecurityException, ExpiredSignatureError, JWTError):
        return jsonify({'success': False, 'error': 'Authentication required'}), 401
    except Exception as e:
        logger.error(f"Error generating download URL: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@report_bp.route('/<report_id>/view-url', methods=['GET'])
@require_authenticated_user
def get_view_url(user, report_id):
    """Generate a fresh presigned URL for viewing a specific report inline in browser."""
    try:
        report = PDFDocument.query.filter_by(id=report_id, user_id=user.id).first()
        if not report or not report.file_path:
            return jsonify({'error': 'Report not found'}), 404

        fresh_url = s3_service.generate_view_url(report.file_path)
        if not fresh_url:
            return jsonify({'error': 'Failed to generate view URL'}), 500

        return jsonify({'success': True, 'viewUrl': fresh_url})

    except (SecurityException, ExpiredSignatureError, JWTError):
        return jsonify({'success': False, 'error': 'Authentication required'}), 401
    except Exception as e:
        logger.error(f"Error generating view URL: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@report_bp.route('/<report_id>/view', methods=['GET'])
@require_authenticated_user
def view_pdf_inline(user, report_id):
    """Serve PDF with iframe-friendly headers for inline viewing."""
    try:
        report = PDFDocument.query.filter_by(id=report_id, user_id=user.id).first()
        if not report or not report.file_path:
            return jsonify({'error': 'Report not found'}), 404

        pdf_url = report.file_path
        if pdf_url.startswith("http"):
            import requests
            response = requests.get(pdf_url, timeout=30)
            if response.status_code != 200:
                return jsonify({'error': 'Failed to fetch PDF content'}), 500
            pdf_data = response.content
        else:
            pdf_data = s3_service.get_pdf(pdf_url)
            if not pdf_data:
                return jsonify({'error': 'Failed to retrieve PDF content'}), 500

        return Response(
            pdf_data,
            mimetype='application/pdf',
            headers={
                'Content-Disposition': f'inline; filename="{report.filename}"',
                'Content-Security-Policy': "frame-ancestors 'self'",
                'Cache-Control': 'public, max-age=3600',
            }
        )

    except (SecurityException, ExpiredSignatureError, JWTError):
        return jsonify({'success': False, 'error': 'Authentication required'}), 401
    except Exception as e:
        logger.error(f"Error serving PDF: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@report_bp.route('/<report_id>', methods=['DELETE'])
@require_authenticated_user
def delete_report(user, report_id):
    """Delete a report from S3 and database."""
    try:
        data = request.get_json() or {}
        s3_key = (data.get('s3_key') or data.get('file_path') or '').lstrip('/')
        
        # Delete from S3
        s3_deleted = False
        if s3_key:
            deletion_result = DocumentService.delete_report_and_json(s3_key)
            s3_deleted = deletion_result['pdf_deleted'] or deletion_result['json_deleted']
        
        # Delete from database
        pdf_doc = PDFDocument.query.get(report_id)
        if not pdf_doc or pdf_doc.user_id != user.id:
            return jsonify({'error': 'Report not found'}), 404
        
        db.session.delete(pdf_doc)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Report deleted successfully',
            'deleted_from_s3': s3_deleted,
            'deleted_from_db': True
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting report: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@report_bp.route('/documents', methods=['GET'])
@require_authenticated_user
def get_user_documents(user):
    """Get all documents for the authenticated user."""
    try:
        documents = PDFDocument.query.filter_by(user_id=user.id).all()
        
        documents_data = [{
            'id': doc.id,
            'filename': doc.filename,
            'file_path': doc.file_path,
            'status': doc.status,
            'created_at': doc.created_at.isoformat() if doc.created_at else None,
            'updated_at': doc.updated_at.isoformat() if doc.updated_at else None,
            'user_id': doc.user_id,
            'report_type': getattr(doc, 'report_type', None),
            'address': getattr(doc, 'primary_address', None),
        } for doc in documents]
                
        return jsonify({
            'success': True,
            'documents': documents_data,
            'count': len(documents_data)
        }), 200
        
    except (SecurityException, ExpiredSignatureError, JWTError):
        return jsonify({'success': False, 'error': 'Authentication required'}), 401
    except Exception as e:
        logger.error(f"Error retrieving documents: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500