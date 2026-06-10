"""Eager checklist item catalogs by category (avoids per-call lazy imports in retrieval)."""

from __future__ import annotations

from app.services.transactions.checklist_support.items import SEARCH_ITEMS
from app.services.transactions.closing import CLOSING_ITEMS
from app.services.transactions.escrow import ESCROW_ITEMS
from app.services.transactions.financing import FINANCING_ITEMS
from app.services.transactions.insurance import INSURANCE_ITEMS
from app.services.transactions.offer.items import OFFER_ITEMS

CHECKLIST_DEFINITIONS_BY_CATEGORY: dict[str, list] = {
    "search": list(SEARCH_ITEMS),
    "offer": list(OFFER_ITEMS),
    "escrow": list(ESCROW_ITEMS),
    "financing": list(FINANCING_ITEMS),
    "closing": list(CLOSING_ITEMS),
    "insurance": list(INSURANCE_ITEMS),
    "timeline": [],
}
