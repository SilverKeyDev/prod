from flask import Blueprint, Response, jsonify, request

from app.schemas import DeleteReportRequest, DeleteReportResponse, DocumentLibraryResponse
from app.services.documents.report_route_service import (
    ReportServiceError,
    delete_user_report,
    get_document_library_page,
    get_download_url_payload,
    get_inline_pdf_payload,
    get_view_url_payload,
    list_pipeline_documents,
    remove_library_item,
    rollback_delete_transaction,
    rollback_library_transaction,
)
from app.services.research.report_listing import list_reports_for_user
from app.utils.common_patterns import (
    external_unavailable,
    forbidden,
    not_found,
    require_authenticated_user,
    resolve_agent_scoped_user_id,
    server_error,
)
from app.utils.http.pagination import parse_query_pagination_args
from app.utils.security import rate_limit
from app.utils.validation import validate_request, validate_response
from logger import log

report_bp = Blueprint("report", __name__, url_prefix="/api/v1/report")


def _report_service_error_response(
    err: ReportServiceError, *, function: str, report_id: str | None = None
) -> tuple:
    if err == ReportServiceError.NOT_FOUND:
        return not_found("Report not found")
    if err == ReportServiceError.FORBIDDEN:
        return forbidden()
    if err == ReportServiceError.PRESIGN_FAILED:
        return external_unavailable(
            RuntimeError("presign_failed"),
            api_name="s3",
            context={"function": function, "report_id": report_id},
        )
    if err in (
        ReportServiceError.PDF_FETCH_HTTP_FAILED,
        ReportServiceError.PDF_FETCH_S3_FAILED,
    ):
        api_name = "http" if err == ReportServiceError.PDF_FETCH_HTTP_FAILED else "s3"
        return external_unavailable(
            RuntimeError("pdf_fetch_failed"),
            api_name=api_name,
            context={"function": function, "report_id": report_id},
        )
    return server_error(RuntimeError(err), context={"function": function, "report_id": report_id})


@report_bp.route("/list", methods=["GET"])
@rate_limit(max_requests=50, window_seconds=60)
@require_authenticated_user
def list_reports(user):
    try:
        reports_list = list_reports_for_user(str(user.id))
        return jsonify({"success": True, "reports": reports_list})
    except Exception as e:
        log.error("DOCUMENTS", "list_reports_failed", e)
        return server_error(e, context={"function": "list_reports"})


@report_bp.route("/<report_id>/download-url", methods=["GET"])
@require_authenticated_user
def get_download_url(user, report_id):
    """Generate a fresh presigned URL for downloading a specific report."""
    try:
        payload, err = get_download_url_payload(str(user.id), report_id)
        if err:
            return _report_service_error_response(
                err, function="get_download_url", report_id=report_id
            )
        return jsonify(payload)
    except Exception as e:
        log.error("DOCUMENTS", "report_download_url_failed", e)
        return server_error(e, context={"function": "get_download_url", "report_id": report_id})


@report_bp.route("/<report_id>/view-url", methods=["GET"])
@require_authenticated_user
def get_view_url(user, report_id):
    """Generate a fresh presigned URL for viewing a specific report inline in browser."""
    try:
        payload, err = get_view_url_payload(str(user.id), report_id)
        if err:
            return _report_service_error_response(err, function="get_view_url", report_id=report_id)
        return jsonify(payload)
    except Exception as e:
        log.error("DOCUMENTS", "report_view_url_failed", e)
        return server_error(e, context={"function": "get_view_url", "report_id": report_id})


@report_bp.route("/<report_id>/view", methods=["GET", "HEAD"])
@require_authenticated_user
def view_pdf_inline(user, report_id):
    """Serve PDF with iframe-friendly headers for inline viewing."""
    try:
        inline, err = get_inline_pdf_payload(str(user.id), report_id)
        if err:
            return _report_service_error_response(
                err, function="view_pdf_inline", report_id=report_id
            )
        return Response(
            inline.data,
            mimetype="application/pdf",
            headers={
                "Content-Disposition": f'inline; filename="{inline.filename}"',
                "Content-Security-Policy": "frame-ancestors 'self'",
                "Cache-Control": "public, max-age=3600",
            },
        )
    except Exception as e:
        log.error("DOCUMENTS", "report_view_pdf_failed", e)
        return server_error(e, context={"function": "view_pdf_inline", "report_id": report_id})


@report_bp.route("/<report_id>", methods=["DELETE"])
@require_authenticated_user
@validate_request(DeleteReportRequest)
@validate_response(DeleteReportResponse)
def delete_report(user, report_id, data: DeleteReportRequest):
    """Delete a report from S3 and database."""
    try:
        request_data = data.model_dump(mode="json")
        s3_key = request_data.get("s3_key") or ""
        payload, err = delete_user_report(str(user.id), report_id, s3_key)
        if err:
            return not_found("Report not found")
        return jsonify(payload)
    except Exception as e:
        rollback_delete_transaction()
        log.error("DOCUMENTS", "delete_report_failed", e)
        return server_error(e, context={"function": "delete_report", "report_id": report_id})


@report_bp.route("/documents", methods=["GET"])
@require_authenticated_user
def get_user_documents(user):
    """Get all documents for the authenticated user (uploads only; use /document-library for unified)."""
    try:
        target_uid, scope_err = resolve_agent_scoped_user_id(user)
        if scope_err:
            return scope_err[0], scope_err[1]

        limit = min(100, max(1, int(request.args.get("limit", "100"))))
        offset = max(0, int(request.args.get("offset", "0")))
        return jsonify(list_pipeline_documents(target_uid, limit, offset)), 200
    except Exception as e:
        log.error("DOCUMENTS", "get_user_documents_failed", e)
        return server_error(e, context={"function": "get_user_documents"})


@report_bp.route("/document-library", methods=["GET"])
@require_authenticated_user
@validate_response(DocumentLibraryResponse)
def get_document_library(user):
    """Unified file uploads + DocuSign agreements for the scoped user (buyer-centric agreements)."""
    try:
        target_uid, scope_err = resolve_agent_scoped_user_id(user)
        if scope_err:
            return scope_err[0], scope_err[1]
        page, per_page = parse_query_pagination_args(request.args, default_per_page=20)
        return jsonify(get_document_library_page(target_uid, user, page, per_page)), 200
    except Exception as e:
        log.error("DOCUMENTS", "get_document_library_failed", e)
        return server_error(e, context={"function": "get_document_library"})


@report_bp.route("/document-library/<library_item_id>", methods=["DELETE"])
@require_authenticated_user
def remove_from_library(user, library_item_id):
    """Remove a document from the user's library (does not delete the actual document)."""
    try:
        payload, err = remove_library_item(str(user.id), library_item_id)
        if err == ReportServiceError.NOT_FOUND:
            return not_found("Library item not found")
        if err == ReportServiceError.FORBIDDEN:
            return forbidden()
        return jsonify(payload), 200
    except Exception as e:
        rollback_library_transaction()
        log.error("DOCUMENTS", "remove_from_library_failed", e)
        return server_error(
            e,
            context={"function": "remove_from_library", "library_item_id": library_item_id},
        )
