"""Public API blueprint."""

from flask import Blueprint

public_bp = Blueprint("public", __name__, url_prefix="/api/v1/public")

from . import agent_profile  # noqa: E402,F401
