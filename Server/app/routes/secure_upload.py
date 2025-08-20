"""
Secure file upload route with enhanced validation and virus scanning.
"""
from flask import Blueprint, request, jsonify, current_app
from werkzeug.datastructures import FileStorage
from ..utils.auth import get_current_user, require_auth
from ..utils.file_security import validate_file_upload, FileSecurityError, create_secure_upload_directory, get_file_hash
from ..utils.secure_errors import SecureErrorHandler
from ..services.s3_service import s3_service
from .. import db
import os
import tempfile
from ..utils.app_logging import get_logger

logger = get_logger()
secure_upload_bp = Blueprint('secure_upload', __name__, url_prefix='/api/v1/upload')

@secure_upload_bp.route('/document', methods=['POST'])
@require_auth
def upload_document(user):
    """
    Secure document upload endpoint with comprehensive validation.
    
    Supports PDF, DOCX, and image files with content validation and virus scanning.
    """
    try:
        # Check if file is present in request
        if 'file' not in request.files:
            return SecureErrorHandler.create_secure_response(
                'file_upload_error',
                400,
                additional_info={'message': 'No file provided'}
            )
        
        file = request.files['file']
        
        if not file or file.filename == '':
            return SecureErrorHandler.create_secure_response(
                'file_upload_error',
                400,
                additional_info={'message': 'No file selected'}
            )
                
        # Validate file upload with security checks
        try:
            safe_filename, validated_mime_type = validate_file_upload(file)
        except FileSecurityError as e:
            logger.warning(f"File validation failed for user {user.id}: {str(e)}")
            return SecureErrorHandler.handle_file_upload_error(e, {
                'user_id': user.id,
                'original_filename': file.filename
            })
        
        # Create secure upload directory
        upload_dir = create_secure_upload_directory(
            current_app.config.get('UPLOAD_FOLDER', '/tmp/uploads'),
            user.id
        )
        
        # Save file temporarily for processing
        temp_file_path = os.path.join(upload_dir, safe_filename)
        
        # Reset file pointer (it was read during validation)
        file.seek(0)
        file.save(temp_file_path)
        
        # Generate file hash for integrity checking
        file_hash = get_file_hash(temp_file_path)
        
        # Upload to S3 if configured
        s3_url = None
        if s3_service and s3_service.s3_client:
            try:
                s3_key = f"documents/{user.id}/{safe_filename}"
                s3_url = s3_service.upload_file(temp_file_path, s3_key)
            except Exception as e:
                logger.error(f"S3 upload failed: {str(e)}")
                return SecureErrorHandler.handle_external_api_error(e, 'S3', {
                    'user_id': user.id,
                    'filename': safe_filename
                })
        
        # Store file metadata in database
        from ..models.pdf_document import PDFDocument
        
        document = PDFDocument(
            user_id=user.id,
            filename=safe_filename,
            original_filename=file.filename,
            file_path=temp_file_path if not s3_url else None,
            s3_url=s3_url,
            file_size=os.path.getsize(temp_file_path),
            mime_type=validated_mime_type,
            file_hash=file_hash
        )
        
        db.session.add(document)
        db.session.commit()
        
        # Clean up temporary file if uploaded to S3
        if s3_url:
            try:
                os.unlink(temp_file_path)
            except OSError:
                pass
                
        return jsonify({
            'success': True,
            'message': 'File uploaded successfully',
            'document': {
                'id': document.id,
                'filename': safe_filename,
                'size': document.file_size,
                'type': validated_mime_type,
                'hash': file_hash,
                'uploaded_at': document.created_at.isoformat()
            }
        }), 201
        
    except Exception as e:
        logger.error(f"Unexpected error in file upload: {str(e)}")
        return SecureErrorHandler.create_secure_response('server_error', 500)

@secure_upload_bp.route('/image', methods=['POST'])
@require_auth
def upload_image(user):
    """
    Secure image upload endpoint with content validation.
    
    Supports JPEG, PNG, and GIF files with size and content validation.
    """
    try:
        if 'file' not in request.files:
            return SecureErrorHandler.create_secure_response(
                'file_upload_error',
                400,
                additional_info={'message': 'No file provided'}
            )
        
        file = request.files['file']
        
        if not file or file.filename == '':
            return SecureErrorHandler.create_secure_response(
                'file_upload_error',
                400,
                additional_info={'message': 'No file selected'}
            )
        
        # Define allowed image types
        allowed_image_types = {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/gif': ['.gif']
        }
                
        # Validate image upload
        try:
            safe_filename, validated_mime_type = validate_file_upload(file, allowed_image_types)
        except FileSecurityError as e:
            logger.warning(f"Image validation failed for user {user.id}: {str(e)}")
            return SecureErrorHandler.handle_file_upload_error(e, {
                'user_id': user.id,
                'original_filename': file.filename
            })
        
        # Process and store image similar to document upload
        upload_dir = create_secure_upload_directory(
            current_app.config.get('UPLOAD_FOLDER', '/tmp/uploads'),
            user.id
        )
        
        temp_file_path = os.path.join(upload_dir, safe_filename)
        file.seek(0)
        file.save(temp_file_path)
        
        file_hash = get_file_hash(temp_file_path)
        
        # Upload to S3
        s3_url = None
        if s3_service and s3_service.s3_client:
            try:
                s3_key = f"images/{user.id}/{safe_filename}"
                s3_url = s3_service.upload_file(temp_file_path, s3_key)
            except Exception as e:
                logger.error(f"S3 upload failed: {str(e)}")
                return SecureErrorHandler.handle_external_api_error(e, 'S3', {
                    'user_id': user.id,
                    'filename': safe_filename
                })
        
        # Clean up temporary file
        if s3_url:
            try:
                os.unlink(temp_file_path)
            except OSError:
                pass
                
        return jsonify({
            'success': True,
            'message': 'Image uploaded successfully',
            'image': {
                'filename': safe_filename,
                'size': os.path.getsize(temp_file_path) if not s3_url else None,
                'type': validated_mime_type,
                'hash': file_hash,
                'url': s3_url
            }
        }), 201
        
    except Exception as e:
        logger.error(f"Unexpected error in image upload: {str(e)}")
        return SecureErrorHandler.create_secure_response('server_error', 500)
