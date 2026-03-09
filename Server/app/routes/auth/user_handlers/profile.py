"""User profile and closing-mode handlers."""

from __future__ import annotations

import os
import time
from typing import TYPE_CHECKING

from flask import Response, current_app, jsonify, request

from app import db
from app.utils.common_patterns import handle_exceptions_with_logging, require_authenticated_user
from app.utils.security.security import rate_limit

if TYPE_CHECKING:
    from app.models.user import User


def _get_profile_picture_url(user):
    """Return presigned profile picture URL if user has one; else None. Does not raise."""
    from app.services.documents import s3_service

    if not getattr(user, "profile_picture", None):
        return None
    try:
        return s3_service.generate_view_url(user.profile_picture)
    except Exception as e:
        current_app.logger.warning(
            "Profile picture URL generation failed",
            extra={"user_id": str(user.id), "error": str(e)},
        )
        return None


@rate_limit(max_requests=200, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def get_user_profile(user: User) -> Response | tuple[Response, int]:
    """Get the current user's profile information"""
    request_id = getattr(request, "request_id", f"profile_{int(time.time() * 1000)}")
    start_time = time.time()
    current_app.logger.info(
        "BACKEND_PROFILE_REQUEST",
        extra={
            "request_id": request_id,
            "user_id": str(user.id),
            "email": (user.email[:3] + "***" + user.email[-3:]) if user.email else "missing",
            "is_agent": getattr(user, "is_agent", False),
            "endpoint": "profile",
            "method": "GET",
        },
    )
    user_data = user.to_dict()
    # Include roles from user_roles for admin/permission checks (e.g. AdminGuard).
    # To grant admin access: add a row to user_roles, e.g. in Flask shell:
    #   from app.models import User, UserRole
    #   u = User.query.filter_by(email="your@email.com").first()
    #   if u and not any(r.role == "admin" for r in u.user_roles): db.session.add(UserRole(user_id=u.id, role="admin")); db.session.commit()
    user_data["roles"] = [ur.role for ur in user.user_roles]
    profile_picture_url = _get_profile_picture_url(user)
    if profile_picture_url is not None:
        user_data["profile_picture_url"] = profile_picture_url
    duration_ms = int((time.time() - start_time) * 1000)
    current_app.logger.debug(
        "BACKEND_PROFILE_RESPONSE",
        extra={
            "request_id": request_id,
            "user_id": str(user.id),
            "duration_ms": duration_ms,
            "has_user_data": bool(user_data),
        },
    )
    return jsonify({"success": True, "data": user_data})


@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def update_closing_mode(user: User) -> Response | tuple[Response, int]:
    """Update the user's closing mode status"""
    data = request.get_json(force=True)
    if "is_closing_mode" not in data:
        return jsonify({"success": False, "error": "is_closing_mode is required"}), 400
    is_closing_mode = data.get("is_closing_mode")
    if not isinstance(is_closing_mode, bool):
        return jsonify({"success": False, "error": "is_closing_mode must be a boolean"}), 400
    user.is_closing_mode = is_closing_mode
    db.session.commit()
    return jsonify({"success": True, "data": {"is_closing_mode": user.is_closing_mode}})


# Allowed image types for profile picture (JPEG, PNG, GIF)
_PROFILE_PICTURE_ALLOWED_TYPES = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/gif": [".gif"],
}


@rate_limit(max_requests=20, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
def upload_profile_picture(user: User) -> Response | tuple[Response, int]:
    """
    Upload profile picture: validate image, upload to S3, update user.profile_picture,
    return presigned URL.
    """
    from app.services.documents import s3_service
    from app.utils.security.app_logging import get_logger
    from app.utils.security.file_security import (
        FileSecurityError,
        create_secure_upload_directory,
        validate_file_upload,
    )
    from app.utils.security.secure_errors import SecureErrorHandler

    logger = get_logger()

    if "file" not in request.files:
        return SecureErrorHandler.create_secure_response(
            "file_upload_error", 400, additional_info={"message": "No file provided"}
        )

    file = request.files["file"]
    if not file or file.filename == "":
        return SecureErrorHandler.create_secure_response(
            "file_upload_error", 400, additional_info={"message": "No file selected"}
        )

    try:
        safe_filename, validated_mime_type = validate_file_upload(
            file, allowed_types=_PROFILE_PICTURE_ALLOWED_TYPES
        )
    except FileSecurityError as e:
        logger.warning(
            "Profile picture validation failed",
            extra={"user_id": str(user.id), "error": str(e)},
        )
        return SecureErrorHandler.handle_file_upload_error(
            e, {"user_id": str(user.id), "original_filename": file.filename}
        )

    upload_dir = create_secure_upload_directory(
        current_app.config.get("UPLOAD_FOLDER", "/tmp/uploads"), user.id
    )
    temp_file_path = os.path.join(upload_dir, safe_filename)
    file.seek(0)
    file.save(temp_file_path)

    try:
        if not s3_service or not s3_service.s3_client:
            return SecureErrorHandler.create_secure_response(
                "configuration_error",
                503,
                additional_info={"message": "File storage not available"},
            )

        _, ext = os.path.splitext(safe_filename.lower())
        s3_key = f"profile_pictures/{user.id}/avatar{ext}"

        if getattr(user, "profile_picture", None):
            try:
                s3_service.delete_pdf(user.profile_picture)
            except Exception as e:
                logger.warning(
                    "Failed to delete old profile picture",
                    extra={"user_id": str(user.id), "error": str(e)},
                )

        uploaded_key = s3_service.upload_file(
            temp_file_path, s3_key, content_type=validated_mime_type
        )
        if not uploaded_key:
            return SecureErrorHandler.create_secure_response("server_error", 500)

        user.profile_picture = uploaded_key
        db.session.commit()

        profile_picture_url = s3_service.generate_view_url(uploaded_key)
        return jsonify(
            {
                "success": True,
                "profile_picture_url": profile_picture_url,
                "data": {
                    "profile_picture": uploaded_key,
                    "profile_picture_url": profile_picture_url,
                },
            }
        ), 201
    except Exception as e:
        logger.error("Profile picture upload failed: %s", str(e))
        return SecureErrorHandler.create_secure_response("server_error", 500)
    finally:
        try:
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
        except OSError:
            pass
