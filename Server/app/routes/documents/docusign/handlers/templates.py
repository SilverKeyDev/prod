"""DocuSign template routes: list, sync, create, delete, edit URL."""

import json
from datetime import datetime, timezone

from flask import jsonify, request
from sqlalchemy import or_, select

from app import db
from app.config._urls import get_frontend_url
from app.dtos.docusign_template import DocusignTemplateDTO
from app.models import DocusignTemplate
from app.schemas import (
    DocusignCreateTemplateMetadataInput,
    DocusignCreateTemplateResponse,
    DocusignDeleteTemplateResponse,
    DocusignGetTemplateDetailResponse,
    DocusignGetTemplateEditUrlResponse,
    DocusignListTemplatesResponse,
    DocusignTemplateRoleInfo,
    SyncTemplatesRequest,
    SyncTemplatesResponse,
)
from app.services.auth.user_role_helpers import user_is_agent
from app.services.docusign import DocusignClient
from app.services.docusign.errors import DocusignAPIError
from app.utils.common_patterns import (
    external_unavailable,
    forbidden,
    not_found,
    require_authenticated_user,
    server_error,
    validation,
)
from app.utils.security import rate_limit
from app.utils.validation import validate_form_request, validate_request, validate_response
from logger import log

_MAX_TEMPLATE_PDFS = 10
_MAX_PDF_BYTES = 25 * 1024 * 1024


def register_template_routes(bp):
    @bp.route("/templates", methods=["GET"])
    @rate_limit(max_requests=50, window_seconds=60)
    @require_authenticated_user
    @validate_response(DocusignListTemplatesResponse)
    def list_templates(user):
        try:
            if not user_is_agent(user):
                log.warn(
                    "DOCUSIGN",
                    "Non-agent attempted to list templates",
                    {"user_id": user.id},
                )
                return forbidden()
            log.debug("DOCUSIGN", "Listing DocuSign templates", {"user_id": user.id})
            templates = db.session.scalars(
                select(DocusignTemplate).where(DocusignTemplate.is_active.is_(True))
            ).all()
            log.info(
                "DOCUSIGN",
                "Templates listed successfully",
                {"user_id": user.id, "count": len(templates)},
            )
            return jsonify(
                {
                    "success": True,
                    "templates": [
                        DocusignTemplateDTO.to_list_item(t).model_dump(mode="json")
                        for t in templates
                    ],
                }
            ), 200
        except Exception as e:
            log.error("ERRORS", "Failed to list templates", {"error": str(e)})
            return server_error(e, context={"function": "list_templates", "user_id": user.id})

    @bp.route("/templates/sync", methods=["POST"])
    @rate_limit(max_requests=5, window_seconds=60)
    @require_authenticated_user
    @validate_request(SyncTemplatesRequest)
    @validate_response(SyncTemplatesResponse)
    def sync_templates(user, data: SyncTemplatesRequest):
        try:
            if not user_is_agent(user):
                log.warn(
                    "DOCUSIGN",
                    "Non-agent attempted to sync templates",
                    {"user_id": user.id},
                )
                return forbidden()
            log.debug("DOCUSIGN", "Starting template sync", {"user_id": user.id})
            from app.celery.tasks.docusign import sync_templates_task

            task = sync_templates_task.delay()  # pyright: ignore[reportFunctionMemberAccess]
            log.info(
                "DOCUSIGN",
                "Template sync task enqueued",
                {"user_id": user.id, "task_id": task.id},
            )
            return jsonify(
                {"success": True, "task_id": task.id, "message": "Template sync started"}
            ), 202
        except Exception as e:
            log.error("ERRORS", "Failed to sync templates", {"error": str(e)})
            return server_error(e, context={"function": "sync_templates", "user_id": user.id})

    @bp.route("/templates", methods=["POST"])
    @rate_limit(max_requests=20, window_seconds=60)
    @require_authenticated_user
    @validate_form_request(
        DocusignCreateTemplateMetadataInput, form_key="metadata", parse_json=True
    )
    @validate_response(DocusignCreateTemplateResponse)
    def create_template(user, data: DocusignCreateTemplateMetadataInput):
        """Multipart: metadata (JSON) + files[] PDFs."""
        try:
            if not user_is_agent(user):
                return forbidden()
            meta = data
            uploaded = request.files.getlist("files") or request.files.getlist("file")
            if not uploaded:
                return validation(
                    "At least one PDF file is required", field_errors={"files": "Required"}
                )
            if len(uploaded) > _MAX_TEMPLATE_PDFS:
                return validation(f"Too many files (max {_MAX_TEMPLATE_PDFS})")
            pdf_files: list[tuple[str, bytes]] = []
            total = 0
            for uf in uploaded:
                raw_name = uf.filename if isinstance(uf.filename, str) else ""
                fname = raw_name.strip() or "document.pdf"
                data = uf.read()
                total += len(data)
                if total > _MAX_PDF_BYTES:
                    return validation("Total upload size too large")
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
                return external_unavailable(
                    RuntimeError("missing_template_id"),
                    api_name="DocuSign",
                    context={"function": "create_template", "user_id": user.id},
                )

            return_base = get_frontend_url().rstrip("/")
            return_url = f"{return_base}/docusign/template-editor-return"
            edit_url = client.create_template_edit_view(str(tid), return_url)

            role_names_json = json.dumps(list(meta.roles))
            now = datetime.now(timezone.utc)
            naive_utc = now.replace(tzinfo=None)
            existing = db.session.scalar(
                select(DocusignTemplate).where(DocusignTemplate.docusign_template_id == str(tid))
            )
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
            log.error("ERRORS", "DocuSign template create failed", {"error": str(e)})
            return external_unavailable(
                e,
                api_name="DocuSign",
                context={"function": "create_template", "user_id": user.id},
            )
        except Exception as e:
            log.error("ERRORS", "Failed to create template", {"error": str(e)})
            return server_error(e, context={"function": "create_template", "user_id": user.id})

    @bp.route("/templates/<template_id>", methods=["GET"])
    @rate_limit(max_requests=100, window_seconds=60)
    @require_authenticated_user
    @validate_response(DocusignGetTemplateDetailResponse)
    def get_template_detail(user, template_id: str):
        try:
            if not user_is_agent(user):
                return forbidden()
            client = DocusignClient(auth_type="jwt")
            detail = client.get_template(template_id)
            if not detail.get("templateId"):
                return not_found("Template not found")
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
            return not_found("Template not found")
        except Exception as e:
            log.error("ERRORS", "Failed to get template", {"error": str(e)})
            return server_error(
                e, context={"function": "get_template_detail", "template_id": template_id}
            )

    @bp.route("/templates/<template_id>", methods=["DELETE"])
    @rate_limit(max_requests=20, window_seconds=60)
    @require_authenticated_user
    @validate_response(DocusignDeleteTemplateResponse)
    def delete_template(user, template_id: str):
        try:
            if not user_is_agent(user):
                return forbidden()
            client = DocusignClient(auth_type="jwt")
            try:
                client.delete_docusign_template(template_id)
            except DocusignAPIError:
                pass
            row = db.session.scalar(
                select(DocusignTemplate).where(
                    or_(
                        DocusignTemplate.docusign_template_id == template_id,
                        DocusignTemplate.id == template_id,
                    )
                )
            )
            if row:
                db.session.delete(row)
            db.session.commit()
            payload = DocusignDeleteTemplateResponse(
                success=True, message="Template removed", error=None
            )
            return jsonify(payload.model_dump(mode="json")), 200
        except Exception as e:
            db.session.rollback()
            log.error("ERRORS", "Failed to delete template", {"error": str(e)})
            return server_error(
                e, context={"function": "delete_template", "template_id": template_id}
            )

    @bp.route("/templates/<template_id>/edit-url", methods=["GET"])
    @rate_limit(max_requests=30, window_seconds=60)
    @require_authenticated_user
    @validate_response(DocusignGetTemplateEditUrlResponse)
    def get_template_edit_url(user, template_id: str):
        try:
            if not user_is_agent(user):
                return forbidden()
            return_base = get_frontend_url().rstrip("/")
            return_url = f"{return_base}/docusign/template-editor-return"
            client = DocusignClient(auth_type="jwt")
            edit_url = client.create_template_edit_view(template_id, return_url)
            payload = DocusignGetTemplateEditUrlResponse(
                success=True, message=None, error=None, edit_url=edit_url
            )
            return jsonify(payload.model_dump(mode="json")), 200
        except Exception as e:
            log.error("ERRORS", "Failed to get template edit URL", {"error": str(e)})
            return server_error(
                e, context={"function": "get_template_edit_url", "template_id": template_id}
            )
