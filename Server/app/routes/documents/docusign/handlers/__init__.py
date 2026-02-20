"""DocuSign route handlers: agreements, oauth, webhooks, templates."""

from .agreements import register_agreement_routes
from .oauth import register_oauth_routes
from .templates import register_template_routes
from .webhooks import register_webhook_routes

__all__ = [
    "register_agreement_routes",
    "register_oauth_routes",
    "register_webhook_routes",
    "register_template_routes",
]
