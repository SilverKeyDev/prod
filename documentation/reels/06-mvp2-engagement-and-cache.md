# Reels MVP 2: Engagement and Cache

## Goal

Conversion-aware ranking, Redis feed cache, and engagement event pipeline. Feed order starts to reflect saves and other actions; feed load is served from Redis for speed; events are logged for future model training.

## Scope

1. **Engagement event logging** — Capture swipe, pause, save, contact (and optionally view duration). Ingest via a simple REST API or Kafka topic. Store in a form suitable for training (e.g. event table or Kafka-backed warehouse).
2. **Conversion-aware ranking** — Extend ranking to use ReelLike/save (and optionally other) signals. Options: (a) re-rank existing candidates by a simple score combining similarity and save rate, or (b) lightweight MTML predicting P(save) and blend with current EnsembleScorer.
3. **Pre-compute feed in Redis** — Celery task (scheduled or triggered) builds the top N listing IDs per user using the updated ranking; write to Redis key `feed:{user_id}` (e.g. JSON list of IDs or full metadata).
4. **Feed API reads Redis first** — On `GET /api/v1/feed`, read `feed:{user_id}` from Redis; if miss, fall back to HomeUniversal (MVP 1 behavior). Return items in cache order.

## New components

- **Redis feed cache key schema** — e.g. `feed:{user_id}` → JSON `{ listingIds: string[], updatedAt: iso }` or list of listing metadata. TTL (e.g. 24h) to avoid stale feeds.
- **Celery task** — e.g. `tasks.precompute_feed_task(user_id)` or `tasks.precompute_feed_batch_task(user_ids)`: load user preferences and candidate homes, run ranking (EnsembleScorer + conversion boost), write top N to Redis. Schedule (e.g. after polygon search) or on-demand after major preference change.
- **Engagement API or Kafka** — POST endpoint or Kafka producer for events: `{ userId, listingId, eventType: "view"|"pause"|"save"|"contact", timestamp, duration? }`. Consumers can aggregate for features or training.

## Effort

Roughly 1–2 weeks.
