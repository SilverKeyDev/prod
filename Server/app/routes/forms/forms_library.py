"""Forms library API - browse all available forms by category."""

from collections import defaultdict

from flask import jsonify

from app.models import ChecklistForm
from app.services.documents.s3_service import s3_service
from app.utils.common_patterns import handle_exceptions_with_logging, require_authenticated_user
from app.utils.db.orm_lookup import get_model
from app.utils.security import rate_limit
from logger import LOG_CATEGORIES, log


def _require_agent(user):
    """Check if user is an agent, return error response if not."""
    if not user.is_agent:
        log.security(
            LOG_CATEGORIES["SECURITY"],
            "Non-agent attempted to access agent-only forms library",
            {"user_id": user.id, "is_agent": user.is_agent},
        )
        return jsonify({"success": False, "error": "Unauthorized - agent access required"}), 403
    return None


@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
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
    all_forms = ChecklistForm.query.order_by(ChecklistForm.category, ChecklistForm.title).all()

    if not all_forms:
        log.info(
            LOG_CATEGORIES["API"],
            f"Agent {user.id} fetched forms library (empty)",
            {"forms_count": 0},
        )
        return jsonify({"success": True, "categories": []})

    # Group by category
    categories_dict = defaultdict(list)

    for form in all_forms:
        form_dict = form.to_dict()

        # Generate presigned download URL
        download_url = s3_service.generate_presigned_url(form.s3_template_path)
        if download_url:
            form_dict["download_url"] = download_url
        else:
            log.warn(
                LOG_CATEGORIES["ERRORS"],
                f"Failed to generate presigned URL for form {form.form_key}",
                {"form_key": form.form_key},
            )
            form_dict["download_url"] = None

        category = form.category or "uncategorized"
        categories_dict[category].append(form_dict)

    # Convert to list format
    categories = [{"name": category, "forms": forms} for category, forms in categories_dict.items()]

    # Sort categories by name
    categories.sort(key=lambda x: x["name"])

    log.info(
        LOG_CATEGORIES["API"],
        f"Agent {user.id} fetched forms library",
        {"categories_count": len(categories), "total_forms": len(all_forms)},
    )

    return jsonify({"success": True, "categories": categories})


@rate_limit(max_requests=100, window_seconds=60)
@handle_exceptions_with_logging
@require_authenticated_user
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
        return jsonify({"success": False, "error": "Form not found"}), 404

    # Generate presigned URL
    download_url = s3_service.generate_presigned_url(
        form.s3_template_path, download_filename=f"{form.form_key}.pdf"
    )

    if not download_url:
        log.error(
            LOG_CATEGORIES["ERRORS"],
            f"Failed to generate presigned URL for form {form_id}",
            {"form_id": form_id, "s3_path": form.s3_template_path},
        )
        return (
            jsonify({"success": False, "error": "Failed to generate download URL"}),
            500,
        )

    log.info(
        LOG_CATEGORIES["API"],
        f"Agent {user.id} downloaded form {form.form_key} from library",
        {"form_id": form_id, "form_key": form.form_key},
    )

    return jsonify({"success": True, "download_url": download_url, "form": form.to_dict()})
