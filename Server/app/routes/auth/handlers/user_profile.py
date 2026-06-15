"""User profile handlers."""

from __future__ import annotations

import json
import os
import time
from typing import TYPE_CHECKING

from flask import Response, current_app, jsonify, request

from app.dtos.user import UserDTO
from app.schemas import EmptyRequest, ProfilePictureResponse, UserResponse
from app.services.auth.user_profile import persist_profile_picture_key
from app.services.auth.user_role_helpers import user_is_agent
from app.utils.common_patterns import (
    configuration_unavailable,
    handle_exceptions_with_logging,
    require_authenticated_user,
    server_error,
    validation,
)
from app.utils.security import rate_limit
from app.utils.validation import validate_request, validate_response
from logger import log

if TYPE_CHECKING:
    from app.models.user import User


_AGENT_DEBUG_LOG = "/Users/jaycewalzer/Desktop/SilverKey/.cursor/debug-244579.log"


def _agent_debug_log(message: str, data: dict, hypothesis_id: str) -> None:
    """Append one NDJSON line for debug session (no PII / no presigned URLs)."""
    try:
        payload = {
            "sessionId": "244579",
            "timestamp": int(time.time() * 1000),
            "location": "profile.py",
            "message": message,
            "data": data,
            "hypothesisId": hypothesis_id,
        }
        with open(_AGENT_DEBUG_LOG, "a", encoding="utf-8") as log_f:
            log_f.write(json.dumps(payload) + "\n")
    except OSError:
        pass


@rate_limit(max_requests=200, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
@validate_response(UserResponse)
def get_user_profile(user: User) -> Response | tuple[Response, int]:
    """Get the current user's profile information"""
    request_id = getattr(request, "request_id", f"profile_{int(time.time() * 1000)}")
    start_time = time.time()
    log.info(
        "AUTH",
        "profile_request",
        {
            "request_id": request_id,
            "user_id": str(user.id),
            "email": (user.email[:3] + "***" + user.email[-3:]) if user.email else "missing",
            "has_agent_role": user_is_agent(user),
            "endpoint": "profile",
            "method": "GET",
        },
    )
    user_data = UserDTO.to_response(user, include_roles=True, presign_profile_pic=True)
    profile_picture_url = user_data.get("profile_picture_url")
    # #region agent log
    has_s3_key = bool(getattr(user, "profile_picture", None))
    _agent_debug_log(
        "get_user_profile pfp fields",
        {
            "has_s3_key": has_s3_key,
            "presign_ok": profile_picture_url is not None,
            "will_attach_profile_picture_url": profile_picture_url is not None,
        },
        "A",
    )
    # #endregion
    duration_ms = int((time.time() - start_time) * 1000)
    log.debug(
        "AUTH",
        "profile_response",
        {
            "request_id": request_id,
            "user_id": str(user.id),
            "duration_ms": duration_ms,
            "has_user_data": bool(user_data),
        },
    )
    return jsonify({"success": True, "data": user_data})


# Allowed image types for profile picture (JPEG, PNG, GIF)
_PROFILE_PICTURE_ALLOWED_TYPES = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/gif": [".gif"],
}


@rate_limit(max_requests=20, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(EmptyRequest)
@validate_response(ProfilePictureResponse)
def upload_profile_picture(
    user: User, data: EmptyRequest | None = None
) -> Response | tuple[Response, int]:
    """
    Upload profile picture: validate image, upload to S3, update user.profile_picture,
    return presigned URL.
    """
    from app.config.constants import UPLOAD_FOLDER_DEFAULT
    from app.services.documents import s3_service
    from app.utils.security.file_security import (
        FileSecurityError,
        create_secure_upload_directory,
        validate_file_upload,
    )
    from app.utils.security.secure_errors import SecureErrorHandler

    if "file" not in request.files:
        return validation("No file provided", field_errors={"file": "Required"})

    file = request.files["file"]
    if not file or file.filename == "":
        return validation("No file selected", field_errors={"file": "Required"})

    try:
        safe_filename, validated_mime_type = validate_file_upload(
            file, allowed_types=_PROFILE_PICTURE_ALLOWED_TYPES
        )
    except FileSecurityError as e:
        log.warn(
            "AUTH",
            "profile_picture_validation_failed",
            {"user_id": str(user.id), "error": str(e)},
        )
        return SecureErrorHandler.handle_file_upload_error(
            e, {"user_id": str(user.id), "original_filename": file.filename}
        )

    upload_dir = create_secure_upload_directory(
        current_app.config.get("UPLOAD_FOLDER", UPLOAD_FOLDER_DEFAULT), user.id
    )
    temp_file_path = os.path.join(upload_dir, safe_filename)
    file.seek(0)
    file.save(temp_file_path)

    try:
        if not s3_service or not s3_service.s3_client:
            # #region agent log
            _agent_debug_log("upload_profile_picture s3_unavailable", {}, "E")
            # #endregion
            return configuration_unavailable(context={"feature": "profile_picture_storage"})

        _, ext = os.path.splitext(safe_filename.lower())
        s3_key = f"profile_pictures/{user.id}/avatar{ext}"
        previous_picture_key = getattr(user, "profile_picture", None)

        uploaded_key = s3_service.upload_file(
            temp_file_path, s3_key, content_type=validated_mime_type
        )
        if not uploaded_key:
            return server_error(
                RuntimeError("profile_picture_upload_failed"),
                context={"function": "upload_profile_picture", "user_id": str(user.id)},
            )

        profile_picture_url = s3_service.generate_view_url(
            uploaded_key, content_type=validated_mime_type
        )
        if not profile_picture_url:
            log.error(
                "AUTH",
                "profile_picture_presign_failed",
                {"user_id": str(user.id), "s3_key": uploaded_key},
            )
            try:
                s3_service.delete_pdf(uploaded_key)
            except Exception as cleanup_err:
                log.warn(
                    "AUTH",
                    "profile_picture_cleanup_after_presign_failed",
                    {"user_id": str(user.id), "error": str(cleanup_err)},
                )
            return configuration_unavailable(
                context={"feature": "profile_picture_presign", "user_id": str(user.id)},
            )

        if previous_picture_key and previous_picture_key != uploaded_key:
            try:
                s3_service.delete_pdf(previous_picture_key)
            except Exception as e:
                log.warn(
                    "AUTH",
                    "profile_picture_old_delete_failed",
                    {"user_id": str(user.id), "error": str(e)},
                )

        persist_profile_picture_key(user, uploaded_key)

        # #region agent log
        _, ext_dbg = os.path.splitext(safe_filename.lower())
        _agent_debug_log(
            "upload_profile_picture success",
            {
                "presign_ok": bool(profile_picture_url),
                "ext": ext_dbg or "unknown",
            },
            "E",
        )
        # #endregion
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
        log.error("AUTH", "profile_picture_upload_failed", e)
        return server_error(
            e,
            context={"function": "upload_profile_picture", "user_id": str(user.id)},
        )
    finally:
        try:
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
        except OSError:
            pass
