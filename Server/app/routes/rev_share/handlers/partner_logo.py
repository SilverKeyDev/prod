"""Upload partner integration logo to S3 integration-logos/."""

from __future__ import annotations

import os

from flask import current_app, jsonify, request
from sqlalchemy import select

from app import db
from app.models import Partner
from app.schemas import EmptyRequest, PartnerLogoUploadResponse
from app.services.rev_share.admin.partner_logo import (
    LOGO_ALLOWED_MIME_TYPES,
    is_external_logo_reference,
    resolve_partner_logo_url,
)
from app.utils.common_patterns import handle_exceptions_with_logging, require_authenticated_user
from app.utils.route import configuration_unavailable, not_found, server_error
from app.utils.security import rate_limit
from app.utils.security.secure_errors import SecureErrorHandler
from app.utils.validation import validate_request, validate_response
from logger import log


@rate_limit(max_requests=30, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
@validate_request(EmptyRequest)
@validate_response(PartnerLogoUploadResponse)
def upload_partner_logo(user, partner_id: str, data: EmptyRequest | None = None):
    from app.routes.rev_share.handlers.admin_partners import _require_super_admin

    denied = _require_super_admin(user)
    if denied:
        return denied

    from app.config.constants import UPLOAD_FOLDER_DEFAULT
    from app.services.documents import s3_service
    from app.utils.security.file_security import (
        FileSecurityError,
        create_secure_upload_directory,
        validate_file_upload,
    )

    partner = db.session.scalar(select(Partner).where(Partner.id == partner_id))
    if not partner:
        return not_found()

    if "file" not in request.files:
        log.warn(
            "API",
            "partner_logo_upload_missing_file_field",
            {"partner_id": partner_id, "content_type": request.content_type},
        )
        return SecureErrorHandler.create_secure_response(
            "file_upload_error",
            400,
            additional_info={"message": "No file provided. Use multipart form field name 'file'."},
        )

    file = request.files["file"]
    if not file or file.filename == "":
        return SecureErrorHandler.create_secure_response(
            "file_upload_error", 400, additional_info={"message": "No file selected"}
        )

    try:
        safe_filename, validated_mime_type = validate_file_upload(
            file, allowed_types=LOGO_ALLOWED_MIME_TYPES
        )
    except FileSecurityError as e:
        log.warn(
            "API",
            "partner_logo_upload_validation_failed",
            {
                "partner_id": partner_id,
                "original_filename": file.filename,
                "error": str(e),
            },
        )
        return SecureErrorHandler.handle_file_upload_error(
            e,
            {
                "partner_id": partner_id,
                "original_filename": file.filename,
            },
        )

    upload_dir = create_secure_upload_directory(
        current_app.config.get("UPLOAD_FOLDER", UPLOAD_FOLDER_DEFAULT),
        f"partner-{partner_id}",
    )
    temp_file_path = os.path.join(upload_dir, safe_filename)
    file.seek(0)
    file.save(temp_file_path)

    try:
        if not s3_service or not s3_service.s3_client:
            return configuration_unavailable(context={"feature": "partner_logo_upload"})

        _, ext = os.path.splitext(safe_filename.lower())
        s3_key = f"integration-logos/{partner.slug}/logo{ext}"
        previous_key = (
            partner.logo_url
            if partner.logo_url and not is_external_logo_reference(partner.logo_url)
            else None
        )

        uploaded_key = s3_service.upload_file(
            temp_file_path, s3_key, content_type=validated_mime_type
        )
        if not uploaded_key:
            return server_error(
                RuntimeError("partner_logo_s3_upload_failed"),
                context={"partner_id": partner_id},
            )

        logo_url = resolve_partner_logo_url(uploaded_key, content_type=validated_mime_type)
        if not logo_url:
            try:
                s3_service.delete_pdf(uploaded_key)
            except Exception:
                pass
            return configuration_unavailable(context={"feature": "partner_logo_presign"})

        if previous_key and previous_key != uploaded_key:
            try:
                s3_service.delete_pdf(previous_key)
            except Exception:
                pass

        partner.logo_url = uploaded_key
        db.session.commit()

        return (
            jsonify(
                {
                    "success": True,
                    "logo_url": logo_url,
                    "data": {"logo_key": uploaded_key, "logo_url": logo_url},
                }
            ),
            201,
        )
    finally:
        if os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except OSError:
                pass
