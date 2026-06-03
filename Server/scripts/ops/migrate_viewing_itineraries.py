#!/usr/bin/env python3
"""
Purpose:  Normalize legacy calendar_events.itinerary JSON to ViewingItinerary shape (UPDATE only).
Called by: Manual — ops only (dev/staging); default dry-run.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import dataclass, field
from typing import Any

_SERVER_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if _SERVER_ROOT not in sys.path:
    sys.path.insert(0, _SERVER_ROOT)

from sqlalchemy import select  # noqa: E402

from app import create_app, db  # noqa: E402
from app.models.calendar.calendar_event import CalendarEvent  # noqa: E402
from app.services.viewings.normalize_viewing_itinerary import (  # noqa: E402
    CLASS_ALREADY_CANONICAL,
    CLASS_MIGRATE,
    CLASS_SKIP_AMBIGUOUS,
    CLASS_SKIP_INVALID,
    classify_itinerary,
    normalize_viewing_itinerary,
)
from logger import log  # noqa: E402


@dataclass
class MigrationStats:
    scanned: int = 0
    already_canonical: int = 0
    migrated: int = 0
    skipped_ambiguous: int = 0
    skipped_invalid: int = 0
    failed_validation: int = 0
    recompute_ok: int = 0
    recompute_failed: int = 0
    sample_diffs: list[tuple[str, dict[str, Any], dict[str, Any]]] = field(default_factory=list)
    skipped_ids: list[tuple[str, str]] = field(default_factory=list)


def _recompute_route(payload: dict[str, Any]) -> dict[str, Any]:
    from app.services.viewings.route_builder import build_viewing_route

    request: dict[str, Any] = {"stops": payload.get("stops") or []}
    if payload.get("start"):
        request["start"] = payload["start"]
    if payload.get("end"):
        request["end"] = payload["end"]
    if payload.get("end_mode") is not None:
        request["end_mode"] = payload["end_mode"]
    if payload.get("ordered") is not None:
        request["optimize_order"] = payload.get("ordered")
    return build_viewing_route(request)


def _process_row(
    event: CalendarEvent,
    *,
    apply: bool,
    recompute_route: bool,
    stats: MigrationStats,
    sample_diff_limit: int,
) -> None:
    stats.scanned += 1
    raw = event.itinerary
    if not isinstance(raw, dict):
        stats.skipped_invalid += 1
        stats.skipped_ids.append((event.id, "itinerary_not_dict"))
        log.warn(
            "CALENDAR",
            "Viewing itinerary migration skipped: invalid JSON type",
            {"event_id": event.id},
        )
        return

    classification = classify_itinerary(raw)
    if classification == CLASS_ALREADY_CANONICAL:
        stats.already_canonical += 1
        return

    if classification == CLASS_SKIP_AMBIGUOUS:
        stats.skipped_ambiguous += 1
        stats.skipped_ids.append((event.id, CLASS_SKIP_AMBIGUOUS))
        log.warn(
            "CALENDAR",
            "Viewing itinerary migration skipped: ambiguous",
            {"event_id": event.id},
        )
        return

    if classification == CLASS_SKIP_INVALID:
        stats.skipped_invalid += 1
        stats.skipped_ids.append((event.id, CLASS_SKIP_INVALID))
        log.warn(
            "CALENDAR",
            "Viewing itinerary migration skipped: invalid",
            {"event_id": event.id},
        )
        return

    if classification != CLASS_MIGRATE:
        stats.skipped_invalid += 1
        stats.skipped_ids.append((event.id, classification))
        return

    try:
        normalized = normalize_viewing_itinerary(raw, clear_legs=not recompute_route)
    except ValueError as e:
        stats.failed_validation += 1
        stats.skipped_ids.append((event.id, str(e)))
        log.warn(
            "CALENDAR",
            "Viewing itinerary migration failed normalization",
            {"event_id": event.id, "reason": str(e)},
        )
        return

    if recompute_route:
        try:
            normalized = _recompute_route(normalized)
            stats.recompute_ok += 1
        except Exception as e:
            stats.recompute_failed += 1
            log.warn(
                "ROUTING",
                "Viewing itinerary route recompute failed",
                {"event_id": event.id, "reason": str(e)},
            )

    stats.migrated += 1
    if len(stats.sample_diffs) < sample_diff_limit:
        stats.sample_diffs.append((event.id, raw, normalized))

    if apply:
        event.itinerary = normalized


def _print_summary(stats: MigrationStats, *, apply: bool) -> None:
    mode = "APPLY" if apply else "DRY-RUN"
    sys.stdout.write(f"\n=== Viewing itinerary migration ({mode}) ===\n")
    sys.stdout.write(f"scanned:            {stats.scanned}\n")
    sys.stdout.write(f"already_canonical:  {stats.already_canonical}\n")
    sys.stdout.write(f"migrated:           {stats.migrated}\n")
    sys.stdout.write(f"skipped_ambiguous:  {stats.skipped_ambiguous}\n")
    sys.stdout.write(f"skipped_invalid:    {stats.skipped_invalid}\n")
    sys.stdout.write(f"failed_validation:  {stats.failed_validation}\n")
    sys.stdout.write(f"recompute_ok:       {stats.recompute_ok}\n")
    sys.stdout.write(f"recompute_failed:   {stats.recompute_failed}\n")

    if stats.skipped_ids:
        sys.stdout.write("\nSkipped event ids (first 20):\n")
        for eid, reason in stats.skipped_ids[:20]:
            sys.stdout.write(f"  {eid}: {reason}\n")

    for eid, before, after in stats.sample_diffs:
        sys.stdout.write(f"\n--- sample diff event_id={eid} ---\n")
        sys.stdout.write("before:\n")
        sys.stdout.write(json.dumps(before, indent=2, sort_keys=True))
        sys.stdout.write("\nafter:\n")
        sys.stdout.write(json.dumps(after, indent=2, sort_keys=True))
        sys.stdout.write("\n")

    log.info(
        "CALENDAR",
        "Viewing itinerary migration finished",
        {
            "apply": apply,
            "scanned": stats.scanned,
            "already_canonical": stats.already_canonical,
            "migrated": stats.migrated,
            "skipped_ambiguous": stats.skipped_ambiguous,
            "skipped_invalid": stats.skipped_invalid,
            "failed_validation": stats.failed_validation,
            "recompute_ok": stats.recompute_ok,
            "recompute_failed": stats.recompute_failed,
        },
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Normalize legacy calendar_events.itinerary rows to ViewingItinerary shape."
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Persist normalized itineraries (default is dry-run)",
    )
    parser.add_argument("--limit", type=int, default=None, help="Max rows to scan")
    parser.add_argument("--event-id", type=str, default=None, help="Single calendar_events.id")
    parser.add_argument(
        "--recompute-route",
        action="store_true",
        help="Call build_viewing_route after normalize (requires GOOGLE_MAPS_SERVER_KEY)",
    )
    parser.add_argument("--batch-size", type=int, default=50, help="Commit batch size for --apply")
    parser.add_argument(
        "--sample-diffs",
        type=int,
        default=5,
        help="Max before/after samples printed in dry-run",
    )
    args = parser.parse_args()

    apply = bool(args.apply)
    if args.recompute_route and not os.environ.get("GOOGLE_MAPS_SERVER_KEY", "").strip():
        sys.stderr.write(
            "GOOGLE_MAPS_SERVER_KEY is not set; --recompute-route will fail for each row.\n"
        )

    app = create_app()
    stats = MigrationStats()

    with app.app_context():
        stmt = select(CalendarEvent).where(CalendarEvent.itinerary.isnot(None))
        if args.event_id:
            stmt = stmt.where(CalendarEvent.id == args.event_id.strip())
        stmt = stmt.order_by(CalendarEvent.id)
        if args.limit is not None:
            stmt = stmt.limit(args.limit)

        rows = list(db.session.scalars(stmt).all())
        batch_count = 0

        for event in rows:
            _process_row(
                event,
                apply=apply,
                recompute_route=args.recompute_route,
                stats=stats,
                sample_diff_limit=args.sample_diffs,
            )
            if apply:
                batch_count += 1
                if batch_count >= args.batch_size:
                    db.session.commit()
                    batch_count = 0

        if apply and batch_count > 0:
            db.session.commit()

    _print_summary(stats, apply=apply)

    if stats.failed_validation > 0 or stats.recompute_failed > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
