"""Flask error handlers and response security headers."""

import os
import traceback
from datetime import datetime, timezone

from flask import g, jsonify, request
from jose.exceptions import ExpiredSignatureError
from sqlalchemy.exc import DatabaseError, IntegrityError, OperationalError, ProgrammingError
from werkzeug.exceptions import Unauthorized

from app.http.csp import build_content_security_policy
from app.http.secure_errors import SecureErrorHandler
from app.services.docusign.errors import (
    AgreementNotFoundError,
    AgreementStateError,
    DocusignAPIError,
    DocusignAuthError,
    DocusignError,
    InvalidRevisionFileError,
    ParticipantNotFoundError,
    RevisionNotFoundError,
    TemplateNotFoundError,
)

_IS_PROD_FLASK = os.getenv("FLASK_ENV") == "production"


def _response_is_html(response) -> bool:
    ct = response.headers.get("Content-Type") or response.content_type or ""
    return "text/html" in ct.split(";", 1)[0].strip().lower()


def _capture_backend_error(error, *, status_code: int) -> None:
    try:
        from app.services.analytics.posthog_events import capture_backend_error

        capture_backend_error(error, status_code=status_code)
    except Exception:
        pass


def register_after_request_headers(app):
    """Register after_request hook that sets security headers on responses."""

    @app.after_request
    def add_security_headers(response):
        if hasattr(g, "request_id") and hasattr(g, "_request_start_perf"):
            is_pdf_viewer = request.endpoint and (
                "view_pdf_inline" in str(request.endpoint)
                or "/view" in request.path
                or request.path.endswith("/view")
            )
            if is_pdf_viewer:
                permissions_policy = (
                    "camera=(), microphone=(), geolocation=(), fullscreen=*, "
                    "payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()"
                )
            else:
                permissions_policy = (
                    "camera=(), microphone=(), geolocation=(self), "
                    'fullscreen=(self "https://*.amazonaws.com"), '
                    "payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()"
                )
            response.headers["Permissions-Policy"] = permissions_policy
            response.headers["X-Content-Type-Options"] = "nosniff"
            if not is_pdf_viewer:
                response.headers["X-Frame-Options"] = "DENY"
            else:
                response.headers["X-Frame-Options"] = "SAMEORIGIN"
            response.headers["X-XSS-Protection"] = "1; mode=block"
            response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
            if _IS_PROD_FLASK:
                response.headers[
                    "Strict-Transport-Security"
                ] = "max-age=31536000; includeSubDomains"
            response.headers["X-Request-ID"] = str(g.request_id)
            if _response_is_html(response) and not is_pdf_viewer:
                response.headers["Content-Security-Policy"] = build_content_security_policy()
        return response


def register_error_handlers(app):
    """Register all HTTP and database error handlers on the Flask app."""

    @app.errorhandler(ExpiredSignatureError)
    def handle_expired_signature(error):
        app.logger.warning("Expired token detected, prompting re-login.")
        return jsonify(
            {
                "success": False,
                "error": "TOKEN_EXPIRED",
                "message": "Signature has expired. Please log in again.",
            }
        ), 401

    @app.errorhandler(500)
    def handle_internal_server_error(error):
        request_id = getattr(g, "request_id", "unknown")
        error_traceback = traceback.format_exc()
        _capture_backend_error(error, status_code=500)
        app.logger.error(
            "INTERNAL_SERVER_ERROR",
            extra={
                "request_id": request_id,
                "error_type": type(error).__name__,
                "error_message": str(error),
                "traceback": error_traceback,
                "url": request.url if request else "unknown",
                "method": request.method if request else "unknown",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )
        return jsonify(
            {
                "success": False,
                "error": "INTERNAL_SERVER_ERROR",
                "message": "An internal server error occurred. Please try again later.",
            }
        ), 500

    @app.errorhandler(502)
    def handle_bad_gateway(error):
        request_id = getattr(g, "request_id", "unknown")
        error_traceback = traceback.format_exc()
        _capture_backend_error(error, status_code=502)
        app.logger.error(
            "BAD_GATEWAY_ERROR_HANDLER",
            extra={
                "request_id": request_id,
                "error_type": type(error).__name__,
                "error_message": str(error),
                "traceback": error_traceback,
                "url": request.url if request else "unknown",
                "method": request.method if request else "unknown",
                "headers": dict(request.headers) if request else {},
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )
        return jsonify(
            {
                "success": False,
                "error": "BAD_GATEWAY",
                "message": "Service temporarily unavailable. Please try again later.",
            }
        ), 502

    @app.errorhandler(503)
    def handle_service_unavailable(error):
        request_id = getattr(g, "request_id", "unknown")
        error_traceback = traceback.format_exc()
        _capture_backend_error(error, status_code=503)
        app.logger.error(
            "SERVICE_UNAVAILABLE_ERROR",
            extra={
                "request_id": request_id,
                "error_type": type(error).__name__,
                "error_message": str(error),
                "traceback": error_traceback,
                "url": request.url if request else "unknown",
                "method": request.method if request else "unknown",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )
        return jsonify(
            {
                "success": False,
                "error": "SERVICE_UNAVAILABLE",
                "message": "Service temporarily unavailable. Please try again later.",
            }
        ), 503

    @app.errorhandler(504)
    def handle_gateway_timeout(error):
        request_id = getattr(g, "request_id", "unknown")
        error_traceback = traceback.format_exc()
        _capture_backend_error(error, status_code=504)
        app.logger.error(
            "GATEWAY_TIMEOUT_ERROR",
            extra={
                "request_id": request_id,
                "error_type": type(error).__name__,
                "error_message": str(error),
                "traceback": error_traceback,
                "url": request.url if request else "unknown",
                "method": request.method if request else "unknown",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )
        return jsonify(
            {
                "success": False,
                "error": "GATEWAY_TIMEOUT",
                "message": "Request timeout. Please try again later.",
            }
        ), 504

    @app.errorhandler(ProgrammingError)
    def handle_programming_error(error):
        request_id = getattr(g, "request_id", "unknown")
        error_traceback = traceback.format_exc()
        _capture_backend_error(error, status_code=500)
        app.logger.error(
            "DB_PROGRAMMING_ERROR",
            extra={
                "request_id": request_id,
                "error_type": "ProgrammingError",
                "error_message": str(error),
                "traceback": error_traceback,
                "url": request.url if request else "unknown",
                "method": request.method if request else "unknown",
                "endpoint": request.endpoint if request else "unknown",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )
        return jsonify(
            {
                "success": False,
                "error": "DATABASE_ERROR",
                "message": "Database query error. Please contact support if this persists.",
            }
        ), 500

    @app.errorhandler(OperationalError)
    def handle_operational_error(error):
        request_id = getattr(g, "request_id", "unknown")
        error_traceback = traceback.format_exc()
        _capture_backend_error(error, status_code=503)
        app.logger.error(
            "DB_OPERATIONAL_ERROR",
            extra={
                "request_id": request_id,
                "error_type": "OperationalError",
                "error_message": str(error),
                "traceback": error_traceback,
                "url": request.url if request else "unknown",
                "method": request.method if request else "unknown",
                "endpoint": request.endpoint if request else "unknown",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )
        return jsonify(
            {
                "success": False,
                "error": "DATABASE_CONNECTION_ERROR",
                "message": "Database connection error. Please try again later.",
            }
        ), 503

    @app.errorhandler(IntegrityError)
    def handle_integrity_error(error):
        request_id = getattr(g, "request_id", "unknown")
        error_traceback = traceback.format_exc()
        app.logger.error(
            "DB_INTEGRITY_ERROR",
            extra={
                "request_id": request_id,
                "error_type": "IntegrityError",
                "error_message": str(error),
                "traceback": error_traceback,
                "url": request.url if request else "unknown",
                "method": request.method if request else "unknown",
                "endpoint": request.endpoint if request else "unknown",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )
        return jsonify(
            {
                "success": False,
                "error": "DATA_INTEGRITY_ERROR",
                "message": "Data integrity constraint violation.",
            }
        ), 422

    @app.errorhandler(DatabaseError)
    def handle_database_error(error):
        request_id = getattr(g, "request_id", "unknown")
        error_traceback = traceback.format_exc()
        _capture_backend_error(error, status_code=500)
        app.logger.error(
            "DB_GENERAL_ERROR",
            extra={
                "request_id": request_id,
                "error_type": "DatabaseError",
                "error_message": str(error),
                "traceback": error_traceback,
                "url": request.url if request else "unknown",
                "method": request.method if request else "unknown",
                "endpoint": request.endpoint if request else "unknown",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )
        return jsonify(
            {
                "success": False,
                "error": "DATABASE_ERROR",
                "message": "Database error occurred. Please try again later.",
            }
        ), 500

    @app.errorhandler(Unauthorized)
    def handle_unauthorized(error):
        request_id = getattr(g, "request_id", "unknown")
        app.logger.warning(
            "UNAUTHORIZED_ACCESS",
            extra={
                "request_id": request_id,
                "error_type": "Unauthorized",
                "error_message": str(error),
                "url": request.url if request else "unknown",
                "method": request.method if request else "unknown",
                "endpoint": request.endpoint if request else "unknown",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )
        return jsonify(
            {"success": False, "error": "UNAUTHORIZED", "message": "Authentication required."}
        ), 401

    @app.errorhandler(AgreementStateError)
    def handle_agreement_state_error(error):
        return SecureErrorHandler.handle_docusign_error(
            error,
            error_type="agreement_state_error",
            status_code=400,
            context={"error_message": str(error)},
        )

    @app.errorhandler(AgreementNotFoundError)
    def handle_agreement_not_found_error(error):
        return SecureErrorHandler.handle_docusign_error(
            error,
            error_type="agreement_not_found",
            status_code=404,
            context={"error_message": str(error)},
        )

    @app.errorhandler(ParticipantNotFoundError)
    def handle_participant_not_found_error(error):
        return SecureErrorHandler.handle_docusign_error(
            error,
            error_type="participant_not_found",
            status_code=404,
            context={"error_message": str(error)},
        )

    @app.errorhandler(RevisionNotFoundError)
    def handle_revision_not_found_error(error):
        return SecureErrorHandler.handle_docusign_error(
            error,
            error_type="revision_not_found",
            status_code=404,
            context={"error_message": str(error)},
        )

    @app.errorhandler(InvalidRevisionFileError)
    def handle_invalid_revision_file_error(error):
        return SecureErrorHandler.handle_docusign_error(
            error,
            error_type="invalid_revision_file",
            status_code=400,
            context={"error_message": str(error)},
        )

    @app.errorhandler(TemplateNotFoundError)
    def handle_template_not_found_error(error):
        return SecureErrorHandler.handle_docusign_error(
            error,
            error_type="template_not_found",
            status_code=404,
            context={"error_message": str(error)},
        )

    @app.errorhandler(DocusignAuthError)
    def handle_docusign_auth_error(error):
        return SecureErrorHandler.handle_docusign_error(
            error,
            error_type="authentication_failed",
            status_code=401,
            context={"error_message": str(error), "service": "DocuSign"},
        )

    @app.errorhandler(DocusignAPIError)
    def handle_docusign_api_error(error):
        status_code = error.status_code if hasattr(error, "status_code") else 503
        return SecureErrorHandler.handle_docusign_error(
            error,
            error_type="external_api_error",
            status_code=status_code,
            context={
                "error_message": str(error),
                "service": "DocuSign",
                "status_code": status_code,
            },
        )

    @app.errorhandler(DocusignError)
    def handle_docusign_error(error):
        return SecureErrorHandler.handle_docusign_error(
            error,
            error_type="docusign_error",
            status_code=500,
            context={"error_message": str(error)},
        )
