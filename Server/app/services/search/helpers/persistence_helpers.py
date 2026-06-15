"""Helper functions for persisting search results and managing property records."""

from __future__ import annotations

from typing import Any

from sqlalchemy import select

from app import db
from app.models import PropertyCache, UserPropertyLink
from app.utils.db.orm_lookup import get_model
from app.utils.format.address_format import normalize_address
from logger import log

from ..db import add_or_update_home_basic


def persist_and_prune_search_results(user_id: str, properties: list[dict[str, Any]]) -> None:
    """Persist search results to PropertyCache + UserPropertyLink and prune stale entries."""
    try:
        result_norm_addrs: set[str] = set()
        result_zpids: set[str] = set()
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

        existing_links = db.session.scalars(
            select(UserPropertyLink).where(
                UserPropertyLink.user_id == str(user_id),
                UserPropertyLink.current.is_(True),
            )
        ).all()
        existing_by_norm: dict[str, UserPropertyLink] = {}
        for link in existing_links:
            p = get_model(PropertyCache, link.property_id)
            if p and p.address:
                try:
                    existing_by_norm[normalize_address(p.address)] = link
                except Exception:
                    existing_by_norm[p.address.strip().lower()] = link

        created_count = 0
        for index, prop_data in enumerate(properties, start=1):
            try:
                addr = (prop_data.get("address") or "").strip()
                if not addr:
                    continue
                try:
                    norm = normalize_address(addr)
                except Exception:
                    norm = addr.lower()
                pre_exists = norm in existing_by_norm

                if "_score" in prop_data and "score" not in prop_data:
                    try:
                        prop_data["score"] = float(prop_data.get("_score") or 0.0)
                    except Exception:
                        prop_data["score"] = None

                ranking = index
                link_record = add_or_update_home_basic(
                    user_id=str(user_id), home=prop_data, set_liked=False, ranking=ranking
                )
                link_record.current = True
                prop_data["home_id"] = str(link_record.property_id)
                if not pre_exists:
                    created_count += 1
            except Exception as e:
                log.warn(
                    "SEARCH",
                    "Skipped invalid property while persisting",
                    {"error": str(e)},
                )

        if created_count:
            db.session.commit()
            log.info(
                "SEARCH",
                "Inserted new search properties",
                {"created_count": created_count, "user_id": user_id},
            )

        # Mark unliked links not in current results as not current
        marked_count = 0
        unliked_links = db.session.scalars(
            select(UserPropertyLink).where(
                UserPropertyLink.user_id == str(user_id),
                UserPropertyLink.is_liked.is_(False),
                UserPropertyLink.current.is_(True),
            )
        ).all()
        for link in unliked_links:
            prop = get_model(PropertyCache, link.property_id)
            keep = False
            if prop and prop.zpid and str(prop.zpid) in result_zpids:
                keep = True
            if not keep and prop and prop.address:
                try:
                    h_norm = normalize_address(prop.address)
                except Exception:
                    h_norm = prop.address.strip().lower()
                if h_norm in result_norm_addrs:
                    keep = True
            if not keep:
                link.current = False
                marked_count += 1

        if marked_count:
            db.session.commit()
            log.info(
                "SEARCH",
                "Marked unliked properties as not current",
                {"marked_count": marked_count, "user_id": user_id},
            )

    except Exception as persist_err:
        log.error("ERRORS", "Persist/prune step failed", persist_err)
