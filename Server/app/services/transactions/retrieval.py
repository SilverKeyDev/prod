"""Load checklist definitions by category. Returns items (id, label, explanation, bullets, resource) and optional series metadata."""

from app.services.transactions.checklist_definition_catalog import (
    CHECKLIST_DEFINITIONS_BY_CATEGORY,
)

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
    return list(CHECKLIST_DEFINITIONS_BY_CATEGORY.get(category, []))


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
