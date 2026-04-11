"""Forms routes - forms library and management."""

from flask import Blueprint

from .forms_library import get_form_download_url, list_all_forms

forms_bp = Blueprint("forms", __name__, url_prefix="/api/v1/forms")

# Forms library routes
forms_bp.route("/library", methods=["GET"])(list_all_forms)
forms_bp.route("/library/<form_id>/download", methods=["GET"])(get_form_download_url)
