"""
DocuSign routes: thin registry that creates blueprints and registers handlers.
"""

from flask import Blueprint

from .handlers import (
    register_agreement_routes,
    register_oauth_routes,
    register_template_routes,
    register_webhook_routes,
)

docusign_bp = Blueprint("docusign", __name__, url_prefix="/api/v1/docusign")
webhook_bp = Blueprint("docusign_webhooks", __name__, url_prefix="/api/v1/webhooks/docusign")

register_agreement_routes(docusign_bp)
register_oauth_routes(docusign_bp)
register_webhook_routes(webhook_bp)
register_template_routes(docusign_bp)

__all__ = ["docusign_bp", "webhook_bp"]
