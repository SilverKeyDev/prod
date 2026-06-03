"""Curated checklist steps for partner placement admin (all items per section)."""

from __future__ import annotations

from app.services.transactions.retrieval import get_checklist_definition

# Client checklist tab id -> server checklist category key
BUYER_SECTION_TO_CATEGORY: list[tuple[str, str]] = [
    ("search", "search"),
    ("offer", "offer"),
    ("escrow", "escrow"),
    ("inspections", "insurance"),
    ("financing", "financing"),
    ("closing", "closing"),
]


def _steps_for_section(items: list[dict], section: str) -> list[dict]:
    out: list[dict] = []
    for item in items:
        component_key = item.get("component_key") or item.get("integration_key")
        out.append(
            {
                "step_id": f"{section}:{item['id']}",
                "section": section,
                "item_id": item["id"],
                "label": item.get("label", ""),
                **({"component_key": component_key} if component_key else {}),
            }
        )
    return out


def list_partner_eligible_checklist_steps(role: str = "buyer") -> list[dict]:
    """All checklist steps for admin step selector (buyer journey sections)."""
    if role == "seller":
        return []

    steps: list[dict] = []
    for section, category in BUYER_SECTION_TO_CATEGORY:
        items = get_checklist_definition(category)
        steps.extend(_steps_for_section(items, section))
    return steps
