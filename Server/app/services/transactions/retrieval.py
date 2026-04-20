"""Load checklist definitions by category. Returns items (id, label, explanation, bullets, resource) and optional series metadata."""

VALID_CATEGORIES = frozenset(
    {"search", "offer", "escrow", "financing", "closing", "insurance", "timeline"}
)


def normalize_checklist_item_for_api(item: dict) -> dict:
    """Augment raw Python checklist definitions for JSON API (camelCase extras)."""
    out = dict(item)
    out["dispatchAutomationAvailable"] = bool(out.get("dispatch_automation_available", False))
    if out.get("suggested_form_ids") is not None and "suggestedFormIds" not in out:
        out["suggestedFormIds"] = out["suggested_form_ids"]
    if "completion_requires_submit" in out and "completionRequiresSubmit" not in out:
        out["completionRequiresSubmit"] = bool(out["completion_requires_submit"])
        del out["completion_requires_submit"]
    ct = out.get("completion_type")
    if ct is not None and "completionType" not in out:
        out["completionType"] = str(ct)
        del out["completion_type"]
    return out


def normalize_checklist_items_for_api(items: list) -> list:
    return [normalize_checklist_item_for_api(i) for i in items]


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
