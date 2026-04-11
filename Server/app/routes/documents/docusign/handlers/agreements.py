"""DocuSign agreement routes (backward compatibility façade)."""

from .agreement_routes.actions import register_action_routes
from .agreement_routes.crud import register_crud_routes
from .agreement_routes.download import register_download_routes
from .agreement_routes.participants import register_participant_routes
from .agreement_routes.signing_urls import register_signing_url_routes


def register_agreement_routes(bp):
    """Register all agreement routes."""
    register_crud_routes(bp)
    register_action_routes(bp)
    register_signing_url_routes(bp)
    register_participant_routes(bp)
    register_download_routes(bp)
