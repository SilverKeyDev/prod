import os
import traceback

from flask import Blueprint, Response, jsonify, request
from jose.exceptions import ExpiredSignatureError, JWTError

from app import db
from app.models import Document, DocumentLibraryItem
from app.schemas import DeleteReportRequest, DeleteReportResponse, DocumentLibraryResponse
from app.services.auth import SecurityException
from app.services.documents import DocumentService, s3_service
from app.services.research.report_listing import list_reports_for_user
from app.utils.common_patterns import require_authenticated_user, resolve_agent_scoped_user_id
from app.utils.db.orm_lookup import get_model
from app.utils.http.pagination import build_pagination, parse_query_pagination_args
from app.utils.security import rate_limit
from app.utils.security.app_logging import get_logger
from app.utils.validation import validate_request, validate_response
from logger import LOG_CATEGORIES
from logger import log as category_log

from .report_document_library_rows import document_library_rows_for_agent_request

# Get logger using centralized utility
logger = get_logger()

# Blueprint setup
report_bp = Blueprint("report", __name__, url_prefix="/api/v1/report")


@report_bp.route("/list", methods=["GET"])
@rate_limit(max_requests=50, window_seconds=60)
@require_authenticated_user
def list_reports(user):
    try:
        reports_list = list_reports_for_user(str(user.id))
        return jsonify({"success": True, "reports": reports_list})

    except Exception as e:
        logger.error(f"Error listing reports: {str(e)}")
        logger.error(traceback.format_exc())

        return jsonify({"error": "Internal server error", "success": False}), 500


@report_bp.route("/<report_id>/download-url", methods=["GET"])
@require_authenticated_user
def get_download_url(user, report_id):
    """Generate a fresh presigned URL for downloading a specific report."""
    try:
        report = Document.query.filter_by(id=report_id, user_id=user.id).first()
        if not report or not report.file_path:
            return jsonify({"error": "Report not found"}), 404

        pdf_url = report.file_path
        if pdf_url.startswith("http"):
            return jsonify({"success": True, "downloadUrl": pdf_url})

        filename = os.path.basename(pdf_url)
        fresh_url = s3_service.generate_presigned_url(pdf_url, download_filename=filename)
        if not fresh_url:
            return jsonify({"error": "Failed to generate download URL"}), 500

        return jsonify({"success": True, "downloadUrl": fresh_url})

    except (SecurityException, ExpiredSignatureError, JWTError):
        return jsonify({"success": False, "error": "Authentication required"}), 401
    except Exception as e:
        logger.error(f"Error generating download URL: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@report_bp.route("/<report_id>/view-url", methods=["GET"])
@require_authenticated_user
def get_view_url(user, report_id):
    """Generate a fresh presigned URL for viewing a specific report inline in browser."""
    try:
        report = Document.query.filter_by(id=report_id, user_id=user.id).first()
        if not report or not report.file_path:
            category_log.info(
                LOG_CATEGORIES["DOCUMENTS"],
                "Report view-url: document not found or missing file",
                {"report_id": report_id, "user_id": user.id},
            )
            return jsonify({"error": "Report not found"}), 404

        storage_kind = "remote_http" if str(report.file_path).startswith("http") else "s3"
        fresh_url = s3_service.generate_view_url(report.file_path)
        if not fresh_url:
            category_log.warn(
                LOG_CATEGORIES["DOCUMENTS"],
                "Report view-url: failed to generate presigned URL",
                {"report_id": report_id, "user_id": user.id, "storage_kind": storage_kind},
            )
            return jsonify({"error": "Failed to generate view URL"}), 500

        category_log.info(
            LOG_CATEGORIES["DOCUMENTS"],
            "Report view-url issued (share/view client)",
            {
                "report_id": report_id,
                "user_id": user.id,
                "storage_kind": storage_kind,
            },
        )
        return jsonify({"success": True, "viewUrl": fresh_url})

    except (SecurityException, ExpiredSignatureError, JWTError):
        return jsonify({"success": False, "error": "Authentication required"}), 401
    except Exception as e:
        logger.error(f"Error generating view URL: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@report_bp.route("/<report_id>/view", methods=["GET", "HEAD"])
@require_authenticated_user
def view_pdf_inline(user, report_id):
    """Serve PDF with iframe-friendly headers for inline viewing."""
    try:
        report = Document.query.filter_by(id=report_id, user_id=user.id).first()
        if not report or not report.file_path:
            return jsonify({"error": "Report not found"}), 404

        pdf_url = report.file_path
        if pdf_url.startswith("http"):
            import requests

            response = requests.get(pdf_url, timeout=30)
            if response.status_code != 200:
                return jsonify({"error": "Failed to fetch PDF content"}), 500
            pdf_data = response.content
        else:
            pdf_data = s3_service.get_pdf(pdf_url)
            if not pdf_data:
                return jsonify({"error": "Failed to retrieve PDF content"}), 500

        return Response(
            pdf_data,
            mimetype="application/pdf",
            headers={
                "Content-Disposition": f'inline; filename="{report.filename}"',
                "Content-Security-Policy": "frame-ancestors 'self'",
                "Cache-Control": "public, max-age=3600",
            },
        )

    except (SecurityException, ExpiredSignatureError, JWTError):
        return jsonify({"success": False, "error": "Authentication required"}), 401
    except Exception as e:
        logger.error(f"Error serving PDF: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@report_bp.route("/<report_id>", methods=["DELETE"])
@require_authenticated_user
@validate_request(DeleteReportRequest)
@validate_response(DeleteReportResponse)
def delete_report(user, report_id, data: DeleteReportRequest | None = None):
    """Delete a report from S3 and database."""
    try:
        if data is None:
            request_data = request.get_json(silent=True) or {}
        else:
            request_data = data.model_dump(mode="json")
        s3_key = (request_data.get("s3_key") or request_data.get("file_path") or "").lstrip("/")

        # Delete from S3
        s3_deleted = False
        if s3_key:
            deletion_result = DocumentService.delete_report_and_json(s3_key)
            s3_deleted = deletion_result["pdf_deleted"] or deletion_result["json_deleted"]

        # Delete from database
        pdf_doc = get_model(Document, report_id)
        if not pdf_doc or pdf_doc.user_id != user.id:
            return jsonify({"error": "Report not found"}), 404

        li_id = pdf_doc.library_item_id
        db.session.delete(pdf_doc)
        if li_id:
            li = get_model(DocumentLibraryItem, li_id)
            if li:
                db.session.delete(li)
        db.session.commit()

        return jsonify(
            {
                "success": True,
                "message": "Report deleted successfully",
                "deleted_from_s3": s3_deleted,
                "deleted_from_db": True,
            }
        )

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting report: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@report_bp.route("/documents", methods=["GET"])
@require_authenticated_user
def get_user_documents(user):
    """Get all documents for the authenticated user (uploads only; use /document-library for unified)."""
    try:
        target_uid, scope_err = resolve_agent_scoped_user_id(user)
        if scope_err:
            return scope_err[0], scope_err[1]

        # Add pagination support
        limit = min(100, max(1, int(request.args.get("limit", "100"))))
        offset = max(0, int(request.args.get("offset", "0")))

        query = Document.query.filter_by(user_id=target_uid).order_by(Document.updated_at.desc())
        total_count = query.count()
        documents = query.limit(limit).offset(offset).all()

        documents_data = [
            {
                "document_record_kind": "pipeline",
                "id": doc.id,
                "filename": doc.filename,
                "file_path": doc.file_path,
                "status": doc.status,
                "created_at": doc.created_at.isoformat() if doc.created_at else None,
                "updated_at": doc.updated_at.isoformat() if doc.updated_at else None,
                "user_id": doc.user_id,
                "document_type": getattr(doc, "document_type", None),
                "address": getattr(doc, "address", None),
            }
            for doc in documents
        ]

        return jsonify(
            {
                "success": True,
                "documents": documents_data,
                "count": len(documents_data),
                "total": total_count,
                "limit": limit,
                "offset": offset,
                "hasMore": (offset + len(documents_data)) < total_count,
            }
        ), 200

    except (SecurityException, ExpiredSignatureError, JWTError):
        return jsonify({"success": False, "error": "Authentication required"}), 401
    except Exception as e:
        logger.error(f"Error retrieving documents: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@report_bp.route("/document-library", methods=["GET"])
@require_authenticated_user
@validate_response(DocumentLibraryResponse)
def get_document_library(user):
    """Unified file uploads + DocuSign agreements for the scoped user (buyer-centric agreements)."""
    try:
        target_uid, scope_err = resolve_agent_scoped_user_id(user)
        if scope_err:
            return scope_err[0], scope_err[1]
        rows = document_library_rows_for_agent_request(target_uid, user)
        page, per_page = parse_query_pagination_args(request.args, default_per_page=20)
        total = len(rows)
        offset = (page - 1) * per_page
        items = rows[offset : offset + per_page]
        pagination = build_pagination(page=page, per_page=per_page, total=total)
        return (
            jsonify(
                {
                    "success": True,
                    "items": items,
                    "count": len(items),
                    "pagination": pagination,
                }
            ),
            200,
        )
    except (SecurityException, ExpiredSignatureError, JWTError):
        return jsonify({"success": False, "error": "Authentication required"}), 401
    except Exception as e:
        logger.error(f"Error retrieving document library: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@report_bp.route("/document-library/<library_item_id>", methods=["DELETE"])
@require_authenticated_user
def remove_from_library(user, library_item_id):
    """Remove a document from the user's library (does not delete the actual document)."""
    try:
        # Find the library item
        library_item = DocumentLibraryItem.query.filter_by(id=library_item_id).first()

        if not library_item:
            return jsonify({"success": False, "error": "Library item not found"}), 404

        # Verify the library item belongs to the current user
        if library_item.user_id != user.id:
            return jsonify({"success": False, "error": "Unauthorized"}), 403

        # Delete only the library item, not the underlying document/agreement
        db.session.delete(library_item)
        db.session.commit()

        logger.info(f"Removed library item {library_item_id} for user {user.id}")
        return jsonify({"success": True, "message": "Document removed from library"}), 200

    except (SecurityException, ExpiredSignatureError, JWTError):
        return jsonify({"success": False, "error": "Authentication required"}), 401
    except Exception as e:
        logger.error(f"Error removing from library: {str(e)}")
        db.session.rollback()
        return jsonify({"success": False, "error": "Internal server error"}), 500
