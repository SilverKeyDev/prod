"""Idempotent persistence for SkySlope transaction mirrors."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import func, select

from app import db
from app.models.skyslope import SkySlopeTransaction


def upsert_skyslope_transactions(
    brokerage_id: str,
    mapped_rows: list[dict],
) -> tuple[int, int]:
    """Returns (created_count, updated_count)."""
    created = 0
    updated = 0
    now = datetime.now(timezone.utc)

    for row in mapped_rows:
        if row.get("brokerage_id") != brokerage_id:
            raise ValueError("brokerage_id mismatch in mapped row")

        external_id = row["skyslope_transaction_id"]
        existing = db.session.scalar(
            select(SkySlopeTransaction).where(
                SkySlopeTransaction.brokerage_id == brokerage_id,
                SkySlopeTransaction.skyslope_transaction_id == external_id,
            )
        )

        if existing:
            for key, value in row.items():
                setattr(existing, key, value)
            existing.synced_at = now
            updated += 1
        else:
            db.session.add(SkySlopeTransaction(**row, synced_at=now))
            created += 1

    db.session.commit()
    return created, updated


def count_skyslope_transactions(brokerage_id: str) -> int:
    return int(
        db.session.scalar(
            select(func.count())
            .select_from(SkySlopeTransaction)
            .where(SkySlopeTransaction.brokerage_id == brokerage_id)
        )
        or 0
    )
