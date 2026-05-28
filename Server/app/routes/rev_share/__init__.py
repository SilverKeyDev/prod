"""Rev-share partner routes."""

from flask import Blueprint

rev_share_bp = Blueprint("rev_share", __name__, url_prefix="/api/v1")
rev_share_redirect_bp = Blueprint("rev_share_redirect", __name__)

from . import handlers  # noqa: E402,F401 — registers routes on blueprints
