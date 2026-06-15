"""Rev-share partner placement services."""

from .analytics import RevShareAnalyticsFilters, get_rev_share_analytics
from .link_provisioning import (
    ensure_link_for_partner,
    ensure_links_for_all_active_partners,
    ensure_links_for_partner,
)
from .placements import record_buyer_step_view
from .redirect import build_redirect_destination, record_click_and_get_destination
from .url_template import interpolate_destination_url

__all__ = [
    "RevShareAnalyticsFilters",
    "get_rev_share_analytics",
    "ensure_link_for_partner",
    "ensure_links_for_partner",
    "ensure_links_for_all_active_partners",
    "build_redirect_destination",
    "record_click_and_get_destination",
    "record_buyer_step_view",
    "interpolate_destination_url",
]
