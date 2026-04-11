"""Search API blueprint (registration split across route modules)."""

from flask import Blueprint

search_bp = Blueprint("search", __name__, url_prefix="/api/v1/search")
