"""DocuSign template routes: list, sync, create, delete, edit URL."""

import json
from datetime import datetime, timezone

from flask import jsonify, request
from sqlalchemy import or_

from app import db
from app.config._urls import get_frontend_url
from app.models import DocusignTemplate
from app.schemas import (
    DocusignCreateTemplateMetadataInput,
    DocusignCreateTemplateResponse,
    DocusignDeleteTemplateResponse,
    DocusignGetTemplateDetailResponse,
    DocusignGetTemplateEditUrlResponse,
    DocusignTemplateRoleInfo,
    SyncTemplatesResponse,
)
from app.services.docusign import DocusignClient
from app.services.docusign.errors import DocusignAPIError
from app.services.docusign.utils.permissions import is_agent
from app.utils.common_patterns import require_authenticated_user
from app.utils.security import rate_limit
from app.utils.security.secure_errors import SecureErrorHandler
from app.utils.validation import validate_response
from logger import LOG_CATEGORIES, get_logger

log = get_logger()

_MAX_TEMPLATE_PDFS = 10
_MAX_PDF_BYTES = 25 * 1024 * 1024


def register_template_routes(bp):
    @bp.route("/templates", methods=["GET"])
    @rate_limit(max_requests=50, window_seconds=60)
    @require_authenticated_user
    def list_templates(user):
        try:
            if not is_agent(user):
                log.warn(
                    LOG_CATEGORIES["DOCUSIGN"],
                    "Non-agent attempted to list templates",
                    {"user_id": user.id},
                )
                return jsonify({"success": False, "error": "Agent access required"}), 403
            log.debug(
                LOG_CATEGORIES["DOCUSIGN"], "Listing DocuSign templates", {"user_id": user.id}
            )
            templates = DocusignTemplate.query.filter_by(is_active=True).all()
            log.info(
                LOG_CATEGORIES["DOCUSIGN"],
                "Templates listed successfully",
                {"user_id": user.id, "count": len(templates)},
            )
            return jsonify({"success": True, "templates": [t.to_dict() for t in templates]}), 200
        except Exception as e:
            log.error(LOG_CATEGORIES["ERRORS"], "Failed to list templates", {"error": str(e)})
            return SecureErrorHandler.handle_error(e, "Failed to list templates")

    @bp.route("/templates/sync", methods=["POST"])
    @rate_limit(max_requests=5, window_seconds=60)
    @require_authenticated_user
    @validate_response(SyncTemplatesResponse)
    def sync_templates(user):
        try:
            if not is_agent(user):
                log.warn(
                    LOG_CATEGORIES["DOCUSIGN"],
                    "Non-agent attempted to sync templates",
                    {"user_id": user.id},
                )
                return jsonify({"error": "Agent access required"}), 403
            log.debug(LOG_CATEGORIES["DOCUSIGN"], "Starting template sync", {"user_id": user.id})
            from app.celery.tasks.docusign import sync_templates_task

            task = sync_templates_task.delay()  # pyright: ignore[reportFunctionMemberAccess]
            log.info(
                LOG_CATEGORIES["DOCUSIGN"],
                "Template sync task enqueued",
                {"user_id": user.id, "task_id": task.id},
            )
            return jsonify(
                {"success": True, "task_id": task.id, "message": "Template sync started"}
            ), 202
        except Exception as e:
            log.error(LOG_CATEGORIES["ERRORS"], "Failed to sync templates", {"error": str(e)})
            return SecureErrorHandler.handle_error(e, "Failed to sync templates")

    @bp.route("/templates", methods=["POST"])
    @rate_limit(max_requests=20, window_seconds=60)
    @require_authenticated_user
    @validate_response(DocusignCreateTemplateResponse)
    def create_template(user):
        """Multipart: metadata (JSON) + files[] PDFs."""
        try:
            if not is_agent(user):
                return jsonify({"success": False, "error": "Agent access required"}), 403
            raw_meta = request.form.get("metadata")
            if not raw_meta:
                return jsonify({"success": False, "error": "metadata field required"}), 400
            meta = DocusignCreateTemplateMetadataInput.model_validate_json(raw_meta)
            uploaded = request.files.getlist("files") or request.files.getlist("file")
            if not uploaded:
                return jsonify(
                    {"success": False, "error": "At least one PDF file is required"}
                ), 400
            if len(uploaded) > _MAX_TEMPLATE_PDFS:
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": f"Too many files (max {_MAX_TEMPLATE_PDFS})",
                        }
                    ),
                    400,
                )
            pdf_files: list[tuple[str, bytes]] = []
            total = 0
            for uf in uploaded:
                raw_name = uf.filename if isinstance(uf.filename, str) else ""
                fname = raw_name.strip() or "document.pdf"
                data = uf.read()
                total += len(data)
                if total > _MAX_PDF_BYTES:
                    return jsonify({"success": False, "error": "Total upload size too large"}), 400
                pdf_files.append((fname, data))

            client = DocusignClient(auth_type="jwt")
            created = client.create_template_from_pdfs(
                name=meta.name,
                description=meta.description,
                pdf_files=pdf_files,
                role_names=list(meta.roles),
            )
            tid = created.get("templateId")
            if not tid:
                return jsonify(
                    {"success": False, "error": "DocuSign did not return template id"}
                ), 502

            return_base = get_frontend_url().rstrip("/")
            return_url = f"{return_base}/docusign/template-editor-return"
            edit_url = client.create_template_edit_view(str(tid), return_url)

            role_names_json = json.dumps(list(meta.roles))
            now = datetime.now(timezone.utc)
            naive_utc = now.replace(tzinfo=None)
            existing = DocusignTemplate.query.filter_by(docusign_template_id=str(tid)).first()
            if existing:
                existing.name = meta.name
                existing.description = meta.description
                existing.role_names_json = role_names_json
                existing.created_by_user_id = user.id
                existing.last_edit_synced_at = naive_utc
                existing.synced_at = naive_utc
                existing.is_active = True
                row = existing
            else:
                row = DocusignTemplate(
                    docusign_template_id=str(tid),
                    name=meta.name,
                    description=meta.description,
                    role_names_json=role_names_json,
                    created_by_user_id=user.id,
                    last_edit_synced_at=naive_utc,
                    synced_at=naive_utc,
                    is_active=True,
                )
                db.session.add(row)
            db.session.commit()

            payload = DocusignCreateTemplateResponse(
                success=True,
                message="Template created",
                error=None,
                id=row.id,
                template_id=str(tid),
                edit_url=edit_url,
            )
            return jsonify(payload.model_dump(mode="json")), 200
        except DocusignAPIError as e:
            log.error(
                LOG_CATEGORIES["ERRORS"], "DocuSign template create failed", {"error": str(e)}
            )
            return jsonify({"success": False, "error": "DocuSign template create failed"}), 502
        except Exception as e:
            log.error(LOG_CATEGORIES["ERRORS"], "Failed to create template", {"error": str(e)})
            return SecureErrorHandler.handle_error(e, "Failed to create template")

    @bp.route("/templates/<template_id>", methods=["GET"])
    @rate_limit(max_requests=100, window_seconds=60)
    @require_authenticated_user
    @validate_response(DocusignGetTemplateDetailResponse)
    def get_template_detail(user, template_id: str):
        try:
            if not is_agent(user):
                return jsonify({"success": False, "error": "Agent access required"}), 403
            client = DocusignClient(auth_type="jwt")
            detail = client.get_template(template_id)
            if not detail.get("templateId"):
                return jsonify({"success": False, "error": "Template not found"}), 404
            roles_out = [
                DocusignTemplateRoleInfo(
                    role_name=(r.get("role_name") or "") or "",
                    routing_order=r.get("routing_order"),
                )
                for r in (detail.get("roles") or [])
            ]
            payload = DocusignGetTemplateDetailResponse(
                success=True,
                message=None,
                error=None,
                template_id=detail.get("templateId"),
                name=detail.get("name"),
                description=detail.get("description"),
                roles=roles_out,
            )
            return jsonify(payload.model_dump(mode="json")), 200
        except DocusignAPIError:
            return jsonify({"success": False, "error": "Template not found"}), 404
        except Exception as e:
            log.error(LOG_CATEGORIES["ERRORS"], "Failed to get template", {"error": str(e)})
            return SecureErrorHandler.handle_error(e, "Failed to get template")

    @bp.route("/templates/<template_id>", methods=["DELETE"])
    @rate_limit(max_requests=20, window_seconds=60)
    @require_authenticated_user
    @validate_response(DocusignDeleteTemplateResponse)
    def delete_template(user, template_id: str):
        try:
            if not is_agent(user):
                return jsonify({"success": False, "error": "Agent access required"}), 403
            client = DocusignClient(auth_type="jwt")
            try:
                client.delete_docusign_template(template_id)
            except DocusignAPIError:
                pass
            row = DocusignTemplate.query.filter(
                or_(
                    DocusignTemplate.docusign_template_id == template_id,
                    DocusignTemplate.id == template_id,
                )
            ).first()
            if row:
                db.session.delete(row)
            db.session.commit()
            payload = DocusignDeleteTemplateResponse(
                success=True, message="Template removed", error=None
            )
            return jsonify(payload.model_dump(mode="json")), 200
        except Exception as e:
            db.session.rollback()
            log.error(LOG_CATEGORIES["ERRORS"], "Failed to delete template", {"error": str(e)})
            return SecureErrorHandler.handle_error(e, "Failed to delete template")

    @bp.route("/templates/<template_id>/edit-url", methods=["GET"])
    @rate_limit(max_requests=30, window_seconds=60)
    @require_authenticated_user
    @validate_response(DocusignGetTemplateEditUrlResponse)
    def get_template_edit_url(user, template_id: str):
        try:
            if not is_agent(user):
                return jsonify({"success": False, "error": "Agent access required"}), 403
            return_base = get_frontend_url().rstrip("/")
            return_url = f"{return_base}/docusign/template-editor-return"
            client = DocusignClient(auth_type="jwt")
            edit_url = client.create_template_edit_view(template_id, return_url)
            payload = DocusignGetTemplateEditUrlResponse(
                success=True, message=None, error=None, edit_url=edit_url
            )
            return jsonify(payload.model_dump(mode="json")), 200
        except Exception as e:
            log.error(
                LOG_CATEGORIES["ERRORS"], "Failed to get template edit URL", {"error": str(e)}
            )
            return SecureErrorHandler.handle_error(e, "Failed to get template edit URL")
