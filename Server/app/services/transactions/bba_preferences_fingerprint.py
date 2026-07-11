"""
BBA preferences fingerprint — SIL-183 Phase 2.

Computes a SHA-256 hash of the buyer's material preference fields.
Stored on BuyerBrokerReview.approved_preferences_fingerprint at approval time.
Compared on every POST /preferences to detect material changes that should
invalidate the agent's approval and return to pending_review.

Material fields (changes to these trigger re-review):
  - home_budget_min / home_budget_max
  - important_locations (addresses only)
  - housing_type
  - preferred_bedrooms_min / preferred_bathrooms_min
  - preferred_sqft_min / preferred_sqft_max

Non-material fields (do not trigger re-review):
  - demographics, communication prefs, agent profile, extended preferences
"""

from __future__ import annotations

import hashlib
import json
from typing import Any


def _extract_material_fields(prefs: dict[str, Any]) -> dict[str, Any]:
    """Extract only the fields that constitute a material preference change."""
    locations = prefs.get("important_locations") or []
    location_addresses = sorted(
        loc.get("address") or "" for loc in locations if isinstance(loc, dict)
    )
    return {
        "home_budget_min": prefs.get("home_budget_min"),
        "home_budget_max": prefs.get("home_budget_max"),
        "important_locations": location_addresses,
        "housing_type": prefs.get("housing_type"),
        "preferred_bedrooms_min": prefs.get("preferred_bedrooms_min"),
        "preferred_bathrooms_min": prefs.get("preferred_bathrooms_min"),
        "preferred_sqft_min": prefs.get("preferred_sqft_min"),
        "preferred_sqft_max": prefs.get("preferred_sqft_max"),
    }


def compute_preferences_fingerprint(prefs: dict[str, Any]) -> str:
    """
    Return a SHA-256 hex digest of the buyer's material preference fields.
    Deterministic — same input always produces same hash.
    """
    material = _extract_material_fields(prefs)
    canonical = json.dumps(material, sort_keys=True, default=str)
    return hashlib.sha256(canonical.encode()).hexdigest()


def invalidate_bba_approval_if_changed(
    buyer_user_id: str,
    new_prefs: dict[str, Any],
) -> bool:
    """
    Check if the buyer's material preferences have changed since the agent approved.
    If so, void the approval back to pending_review and log an audit event.

    Returns True if approval was invalidated, False otherwise.
    Called after every successful POST /preferences for buyer users.

    LogPath: TRANSACTIONS.BBA_REVIEW
    """

    from sqlalchemy import select

    from app import db
    from app.models.transactions.buyer_broker_review import (
        BuyerBrokerReview,
        BuyerBrokerReviewEvent,
    )
    from app.services.transactions.ensure import ensure_transaction
    from logger import log

    try:
        tx = ensure_transaction(buyer_id=str(buyer_user_id))
        if not tx:
            return False

        review = db.session.scalar(
            select(BuyerBrokerReview).where(BuyerBrokerReview.transaction_id == str(tx.id))
        )

        if review is None or review.status != "approved":
            return False

        if not review.approved_preferences_fingerprint:
            return False

        new_fingerprint = compute_preferences_fingerprint(new_prefs)

        if new_fingerprint == review.approved_preferences_fingerprint:
            return False

        # Material change detected — void approval
        log.info(
            "DOCUSIGN",
            "bba_approval_invalidated_preference_change",
            {
                "buyer_user_id": buyer_user_id,
                "transaction_id": str(tx.id),
                "old_fingerprint": review.approved_preferences_fingerprint,
                "new_fingerprint": new_fingerprint,
            },
        )

        review.status = "pending_review"
        review.approved_by_agent_id = None
        review.approved_at = None
        review.approved_preferences_fingerprint = None

        event = BuyerBrokerReviewEvent(
            review_id=review.id,
            event_type="invalidated",
            actor_agent_id=None,
            note="Material preference change detected — approval voided automatically.",
        )
        db.session.add(event)
        db.session.commit()

        return True

    except Exception as e:
        from logger import log

        log.error(
            "DOCUSIGN",
            "bba_fingerprint_check_failed",
            e,
        )
        return False
