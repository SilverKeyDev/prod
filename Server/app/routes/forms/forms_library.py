"""Forms library API - browse all available forms by category."""

from collections import defaultdict

from flask import jsonify
from sqlalchemy import select

from app import db
from app.dtos.checklist_form import ChecklistFormDTO
from app.models import ChecklistForm
from app.schemas import FormsLibraryDownloadResponse, FormsLibraryResponse
from app.services.auth.user_role_helpers import user_is_agent
from app.services.documents.s3_service import s3_service
from app.utils.common_patterns import handle_exceptions_with_logging, require_authenticated_user
from app.utils.db.orm_lookup import get_model
from app.utils.route.http_errors import external_unavailable, forbidden, not_found
from app.utils.security import rate_limit
from app.utils.validation import validate_response
from logger import log


def _require_agent(user):
    """Check if user is an agent, return error response if not."""
    if not user_is_agent(user):
        log.security(
            "SECURITY",
            "Non-agent attempted to access agent-only forms library",
            {"user_id": user.id, "has_agent_role": user_is_agent(user)},
        )
        return forbidden()
    return None


@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
@validate_response(FormsLibraryResponse)
def list_all_forms(user):
    """
    GET /api/v1/forms/library

    List all forms grouped by category (folder).
    Agent-only endpoint.

    Returns:
    {
        "success": true,
        "categories": [
            {
                "name": "escrow",
                "forms": [
                    {
                        "id": "...",
                        "form_key": "earnest_money",
                        "title": "Earnest Money Deposit Form",
                        "description": "...",
                        "download_url": "https://...",
                        "category": "escrow"
                    }
                ]
            }
        ]
    }
    """
    # Agent authorization
    auth_error = _require_agent(user)
    if auth_error:
        return auth_error

    # Get all forms
    all_forms = db.session.scalars(
        select(ChecklistForm).order_by(ChecklistForm.category, ChecklistForm.title)
    ).all()

    if not all_forms:
        log.info(
            "API",
            f"Agent {user.id} fetched forms library (empty)",
            {"forms_count": 0},
        )
        return jsonify({"success": True, "categories": []})

    # Group by category
    categories_dict = defaultdict(list)

    for form in all_forms:
        download_url = s3_service.generate_presigned_url(form.s3_template_path)
        if not download_url:
            log.warn(
                "ERRORS",
                f"Failed to generate presigned URL for form {form.form_key}",
                {"form_key": form.form_key},
            )

        form_payload = ChecklistFormDTO.to_with_download(
            form,
            download_url=download_url,
        ).model_dump(mode="json")

        category = form.category or "uncategorized"
        categories_dict[category].append(form_payload)

    # Convert to list format
    categories = [{"name": category, "forms": forms} for category, forms in categories_dict.items()]

    # Sort categories by name
    categories.sort(key=lambda x: x["name"])

    log.info(
        "API",
        f"Agent {user.id} fetched forms library",
        {"categories_count": len(categories), "total_forms": len(all_forms)},
    )

    return jsonify({"success": True, "categories": categories})


@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
@validate_response(FormsLibraryDownloadResponse)
def get_form_download_url(user, form_id: str):
    """
    GET /api/v1/forms/library/<form_id>/download

    Generate presigned download URL for a form from the library.
    Agent-only endpoint.
    """
    # Agent authorization
    auth_error = _require_agent(user)
    if auth_error:
        return auth_error

    # Get form
    form = get_model(ChecklistForm, form_id)
    if not form:
        return not_found()

    # Generate presigned URL
    download_url = s3_service.generate_presigned_url(
        form.s3_template_path, download_filename=f"{form.form_key}.pdf"
    )

    if not download_url:
        log.error(
            "ERRORS",
            f"Failed to generate presigned URL for form {form_id}",
            {"form_id": form_id, "s3_path": form.s3_template_path},
        )
        return external_unavailable(
            RuntimeError("presigned_url_unavailable"),
            api_name="s3",
            context={"form_id": form_id},
        )

    log.info(
        "API",
        f"Agent {user.id} downloaded form {form.form_key} from library",
        {"form_id": form_id, "form_key": form.form_key},
    )

    return jsonify(
        {
            "success": True,
            "download_url": download_url,
            "form": ChecklistFormDTO.from_orm(form).model_dump(mode="json"),
        }
    )
