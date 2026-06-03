# Viewing itinerary migration (operator runbook)

Normalize legacy `calendar_events.itinerary` JSON to the current **ViewingItinerary** contract: property stops live only in `stops`; meet-up and end locations use top-level `start`, `end`, and `end_mode`.

This is a **data backfill** only. The API still accepts legacy shapes on read via `itinerary_path_coordinates()` until that compat path is removed in a separate change.

## When to run

- Before tightening server-side validation on stored itineraries
- After deploying the ViewingItinerary anchor fields, when dev/staging still has rows created before the split

**Do not** run against production without an explicit operator plan and backup.

## Backup

Take a snapshot or logical backup before `--apply`. See [postgres.md](./postgres.md).

Minimal table export example:

```bash
pg_dump "$DATABASE_URL" -t calendar_events --data-only -f calendar_events_backup.sql
```

## Dry-run (default)

From the Server directory with the same env as the Flask app (`Server/.env` loaded):

```bash
cd Server
source .venv/bin/activate
set -a && source .env && set +a
python scripts/ops/migrate_viewing_itineraries.py
```

Output includes counts (`scanned`, `already_canonical`, `migrated`, `skipped_*`) and up to five before/after JSON samples.

## Scoped trial

Single event:

```bash
python scripts/ops/migrate_viewing_itineraries.py --event-id "<calendar_events.uuid>"
```

Limited batch:

```bash
python scripts/ops/migrate_viewing_itineraries.py --limit 100
```

## Apply

```bash
python scripts/ops/migrate_viewing_itineraries.py --limit 100 --apply
```

Then run a full dry-run again; `migrated` should be `0` on the second pass.

Commits happen in batches of `--batch-size` (default `50`). Only `calendar_events.itinerary` is updated — **no DELETEs**.

## Optional route recompute

To refresh `ordered`, `legs`, and driving order after normalization:

```bash
python scripts/ops/migrate_viewing_itineraries.py --apply --recompute-route
```

Requires `GOOGLE_MAPS_SERVER_KEY`. Failures are counted per row (`recompute_failed`); the batch continues.

## Verify

1. Spot-check migrated events in the calendar UI (start line, property list, end mode).
2. Confirm dry-run reports `already_canonical` for rows that were already correct.
3. Optional SQL: rows with non-null `itinerary` should validate as ViewingItinerary when read through the API.

## Implementation reference

| Piece | Location |
| ----- | -------- |
| Normalization logic | `Server/app/services/viewings/normalize_viewing_itinerary.py` |
| Operator script | `Server/scripts/ops/migrate_viewing_itineraries.py` |
| Unit tests | `Server/tests/unit/viewings/test_normalize_viewing_itinerary.py` |
| OpenAPI contract | `openapi/components/schemas/viewings/ViewingItinerary.yaml` |
