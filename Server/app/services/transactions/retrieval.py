"""Load checklist definitions by category. Returns items (id, label, explanation, bullets, resource) and optional series metadata."""

VALID_CATEGORIES = frozenset(
    {"search", "offer", "escrow", "financing", "closing", "insurance", "timeline"}
)


def get_checklist_definition(category):
    """Return list of task definitions for the category. Each item has id, label, explanation, bullets, resource (optional tip)."""
    if category == "search":
        from app.services.transactions.search.items import SEARCH_ITEMS

        return list(SEARCH_ITEMS)
    if category == "offer":
        from app.services.transactions.offer.items import OFFER_ITEMS

        return list(OFFER_ITEMS)
    if category == "escrow":
        from app.services.transactions.escrow import ESCROW_ITEMS

        return list(ESCROW_ITEMS)
    if category == "financing":
        from app.services.transactions.financing import FINANCING_ITEMS

        return list(FINANCING_ITEMS)
    if category == "closing":
        from app.services.transactions.closing import CLOSING_ITEMS

        return list(CLOSING_ITEMS)
    if category == "insurance":
        from app.services.transactions.insurance import INSURANCE_ITEMS

        return list(INSURANCE_ITEMS)
    if category == "timeline":
        return []
    return []


def get_series_metadata(category):
    """Return placeholder series metadata (title, subtitle, state, county, deadline, date_finished). Blank for now."""
    return {
        "title": None,
        "subtitle": None,
        "state": None,
        "county": None,
        "deadline": None,
        "date_finished": None,
    }
