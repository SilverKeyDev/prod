"""
Helper functions for persisting search results and managing home records.
"""

from __future__ import annotations

from typing import Any

from flask import current_app

from app import db
from app.models import HomeUniversal
from app.utils.address_format import normalize_address

from ..db.search_db import add_or_update_home_basic


def persist_and_prune_search_results(user_id: str, properties: list[dict[str, Any]]) -> None:
    """
    Persist search results to database and prune unliked homes not in current results.
    """
    try:
        # Build identity sets from current results
        result_norm_addrs = set()
        result_zpids = set()
        for prop in properties:
            addr = prop.get("address") or ""
            if isinstance(addr, str) and addr.strip():
                try:
                    result_norm_addrs.add(normalize_address(addr))
                except Exception:
                    result_norm_addrs.add(addr.strip().lower())
            zpid_val = prop.get("zpid")
            if zpid_val is not None:
                result_zpids.add(str(zpid_val))

        # Index existing homes by normalized address (only current ones)
        existing = HomeUniversal.query.filter_by(user_id=str(user_id), current=True).all()
        existing_by_norm = {}
        for h in existing:
            if h.address:
                try:
                    existing_by_norm[normalize_address(h.address)] = h
                except Exception:
                    existing_by_norm[h.address.strip().lower()] = h

        # Create/update records for current results
        # Properties are already sorted by score (descending), so position = ranking
        created_count = 0
        for index, prop in enumerate(properties, start=1):
            try:
                addr = (prop.get("address") or "").strip()
                if not addr:
                    continue
                try:
                    norm = normalize_address(addr)
                except Exception:
                    norm = addr.lower()
                pre_exists = norm in existing_by_norm

                # Ensure score is provided under canonical key
                if "_score" in prop and "score" not in prop:
                    try:
                        prop["score"] = float(prop.get("_score") or 0.0)
                    except Exception:
                        prop["score"] = None

                # Calculate ranking based on position in sorted list (1-based)
                ranking = index

                home_record = add_or_update_home_basic(
                    user_id=str(user_id), home=prop, set_liked=False, ranking=ranking
                )
                # Mark as current when adding/updating
                home_record.current = True
                if not pre_exists:
                    created_count += 1
            except Exception as e:
                current_app.logger.warning(f"Skipped invalid property while persisting: {e}")

        if created_count:
            db.session.commit()
            current_app.logger.info(
                f"➕ Inserted {created_count} new search homes for user {user_id}"
            )

        # Mark unliked homes not in current results as not current (instead of deleting)
        marked_count = 0
        unliked = HomeUniversal.query.filter_by(
            user_id=str(user_id), is_liked=False, current=True
        ).all()
        for h in unliked:
            keep = False
            if getattr(h, "zpid", None) and str(h.zpid) in result_zpids:
                keep = True
            if not keep and h.address:
                try:
                    h_norm = normalize_address(h.address)
                except Exception:
                    h_norm = h.address.strip().lower()
                if h_norm in result_norm_addrs:
                    keep = True
            if not keep:
                h.current = False
                marked_count += 1

        if marked_count:
            db.session.commit()
            current_app.logger.info(
                f"🏷️ Marked {marked_count} unliked homes as not current for user {user_id}"
            )

    except Exception as persist_err:
        current_app.logger.error(f"⚠️ Persist/prune step failed: {persist_err}", exc_info=True)
