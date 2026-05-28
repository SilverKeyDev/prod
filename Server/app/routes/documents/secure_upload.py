"""
Secure file upload route with enhanced validation and virus scanning.
"""

import os
import uuid

from flask import Blueprint, current_app, jsonify, request

from app.config.constants import UPLOAD_FOLDER_DEFAULT

from ... import db
from ...schemas import UploadResponse
from ...services.documents import s3_service
from ...utils.common_patterns import require_authenticated_user
from ...utils.security.app_logging import get_logger
from ...utils.security.file_security import (
    FileSecurityError,
    create_secure_upload_directory,
    get_file_hash,
    validate_file_upload,
)
from ...utils.security.secure_errors import SecureErrorHandler
from ...utils.validation import sanitize_optional_address, validate_response

logger = get_logger()
secure_upload_bp = Blueprint("secure_upload", __name__, url_prefix="/api/v1/upload")


@secure_upload_bp.route("/document", methods=["POST"])
@require_authenticated_user
@validate_response(UploadResponse)
def upload_document(user):
    """
    Secure document upload endpoint with comprehensive validation.

    Supports PDF, DOCX, and image files with content validation and virus scanning.
    """
    try:
        # Check if file is present in request
        if "file" not in request.files:
            return SecureErrorHandler.create_secure_response(
                "file_upload_error", 400, additional_info={"message": "No file provided"}
            )

        file = request.files["file"]

        if not file or file.filename == "":
            return SecureErrorHandler.create_secure_response(
                "file_upload_error", 400, additional_info={"message": "No file selected"}
            )

        # Validate file upload with security checks
        try:
            safe_filename, validated_mime_type = validate_file_upload(file)
        except FileSecurityError as e:
            logger.warning(f"File validation failed for user {user.id}: {str(e)}")
            return SecureErrorHandler.handle_file_upload_error(
                e, {"user_id": user.id, "original_filename": file.filename}
            )

        # Create secure upload directory
        upload_dir = create_secure_upload_directory(
            current_app.config.get("UPLOAD_FOLDER", UPLOAD_FOLDER_DEFAULT), user.id
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
                return SecureErrorHandler.handle_external_api_error(
                    e, "S3", {"user_id": user.id, "filename": safe_filename}
                )

        # Store file metadata in database
        from ...models import Document

        # Generate UUID for document ID
        document_id = str(uuid.uuid4())

        # Use S3 URL if available, otherwise use temp file path
        # Note: file_path is required, so we store the S3 URL there if S3 is used
        final_file_path = s3_url if s3_url else temp_file_path

        try:
            address = sanitize_optional_address(request.form.get("address"))
        except ValueError as exc:
            return SecureErrorHandler.create_secure_response(
                "file_upload_error", 400, additional_info={"message": str(exc)}
            )

        document = Document(
            id=document_id,
            user_id=user.id,
            filename=safe_filename,
            file_path=final_file_path,
            file_size=os.path.getsize(temp_file_path),
            status="uploaded",
            address=address,
        )

        db.session.add(document)
        db.session.flush()
        from app.services.documents.document_library_items import attach_library_item_to_document

        attach_library_item_to_document(document)
        db.session.commit()

        # Clean up temporary file if uploaded to S3
        if s3_url:
            try:
                os.unlink(temp_file_path)
            except OSError:
                pass

        return jsonify(
            {
                "success": True,
                "message": "File uploaded successfully",
                "document": {
                    "id": document.id,
                    "filename": safe_filename,
                    "size": document.file_size,
                    "type": validated_mime_type,
                    "hash": file_hash,
                    "uploaded_at": document.created_at.isoformat(),
                },
            }
        ), 201

    except Exception as e:
        logger.error(f"Unexpected error in file upload: {str(e)}")
        return SecureErrorHandler.create_secure_response("server_error", 500)


@secure_upload_bp.route("/image", methods=["POST"])
@require_authenticated_user
@validate_response(UploadResponse)
def upload_image(user):
    """
    Secure image upload endpoint with content validation.

    Supports JPEG, PNG, and GIF files with size and content validation.
    """
    try:
        if "file" not in request.files:
            return SecureErrorHandler.create_secure_response(
                "file_upload_error", 400, additional_info={"message": "No file provided"}
            )

        file = request.files["file"]

        if not file or file.filename == "":
            return SecureErrorHandler.create_secure_response(
                "file_upload_error", 400, additional_info={"message": "No file selected"}
            )

        # Define allowed image types
        allowed_image_types = {
            "image/jpeg": [".jpg", ".jpeg"],
            "image/png": [".png"],
            "image/gif": [".gif"],
        }

        # Validate image upload
        try:
            safe_filename, validated_mime_type = validate_file_upload(file, allowed_image_types)
        except FileSecurityError as e:
            logger.warning(f"Image validation failed for user {user.id}: {str(e)}")
            return SecureErrorHandler.handle_file_upload_error(
                e, {"user_id": user.id, "original_filename": file.filename}
            )

        # Process and store image similar to document upload
        upload_dir = create_secure_upload_directory(
            current_app.config.get("UPLOAD_FOLDER", UPLOAD_FOLDER_DEFAULT), user.id
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
                return SecureErrorHandler.handle_external_api_error(
                    e, "S3", {"user_id": user.id, "filename": safe_filename}
                )

        # Clean up temporary file
        if s3_url:
            try:
                os.unlink(temp_file_path)
            except OSError:
                pass

        return jsonify(
            {
                "success": True,
                "message": "Image uploaded successfully",
                "image": {
                    "filename": safe_filename,
                    "size": os.path.getsize(temp_file_path) if not s3_url else None,
                    "type": validated_mime_type,
                    "hash": file_hash,
                    "url": s3_url,
                },
            }
        ), 201

    except Exception as e:
        logger.error(f"Unexpected error in image upload: {str(e)}")
        return SecureErrorHandler.create_secure_response("server_error", 500)
