"""Shared mock paths for search route tests."""

from unittest.mock import Mock

MOCK_JWT_USER = "app.services.auth.get_current_user"
MOCK_GET_CURRENT_USER = "app.routes.search.search.get_authenticated_user"
MOCK_RUN_POLYGON_SEARCH = "app.routes.search.search.run_polygon_search"
MOCK_GET_USER_PREFS = "app.services.search.helpers.preferences_helpers.get_user_preferences_parsed"
MOCK_PARSE_IMPORTANT_LOCATIONS = (
    "app.services.search.helpers.preferences_helpers.parse_important_locations"
)
MOCK_ISOCHRONE_UNION = "app.routes.search.search.isochrone_union_for_addresses"
MOCK_GEOCODE_ADDRESS = "app.routes.search.search.geocode_address_google"
MOCK_RESOLVE_PREFS_USER_ID = "app.routes.search.search.resolve_preferences_user_id_for_research"
MOCK_PARSE_RESEARCH_BODY = "app.routes.search.search.parse_research_request_body"
MOCK_ISO_GET_USER = "app.routes.search.search_isochrone_routes.get_authenticated_user"
MOCK_ISO_RESOLVE = (
    "app.routes.search.search_isochrone_routes.resolve_preferences_user_id_for_research"
)
MOCK_ISO_GET_PREFS = "app.routes.search.search_isochrone_routes.get_user_preferences_parsed"
MOCK_ISO_PARSE_LOCS = "app.routes.search.search_isochrone_routes.parse_important_locations"
MOCK_ISO_GEOCODE = "app.routes.search.search_isochrone_routes.geocode_address_google"
MOCK_ISO_UNION = "app.routes.search.search_isochrone_routes.isochrone_union_for_addresses"


def mock_user(user_id: str = "user-research-1"):
    user = Mock()
    user.id = user_id
    return user
