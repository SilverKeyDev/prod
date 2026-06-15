> **Status:** Partial
> **Last verified:** 2026-06-04
> **Shipped feature docs:** [search.md](../client/features/search.md).

# Reels: Current Infrastructure

What SilverKey has today and how it maps to the target Reels architecture.

## Current state

| Component | Current state | Location |
|-----------|---------------|----------|
| **Feed API** | Returns empty stub `{ items: [], hasMore: false }` | [Server/app/routes/feed.py](../../Server/app/routes/feed.py) |
| **Ranking** | EnsembleScorer: sentence-transformer embeddings + cosine similarity, blended to 0–100 | [Server/app/home_matching/](../../Server/app/home_matching/) |
| **Search + persist** | Polygon search → external API → score via `find_best_matches` → persist to PropertyCache + UserPropertyLink | [Server/app/services/search/polygon_search_runner.py](../../Server/app/services/search/polygon_search_runner.py), [Server/app/services/search/db/search_db_cache.py](../../Server/app/services/search/db/search_db_cache.py) |
| **Cache** | PropertyCache (listing snapshot) + UserPropertyLink (per-user rank/like/current) | [Server/app/models/property/property_cache.py](../../Server/app/models/property/property_cache.py), [Server/app/models/property/user_property_link.py](../../Server/app/models/property/user_property_link.py) |
| **Redis** | Used for scoring sort only (sorted set by request_id), not feed cache | [Server/app/services/search/helpers/scoring_helpers.py](../../Server/app/services/search/helpers/scoring_helpers.py) |
| **Celery** | Background tasks: research, home matching, weight training; no feed pre-compute yet | [Server/app/celery/](../../Server/app/celery/) |
| **Client feed** | Virtuoso (web) / FlatList (native), `useFeedData`, `listingToReelMedia`, infinite scroll | [Client/packages/features/feed/](../../Client/packages/features/feed/), [Client/packages/features/search/components/reels/](../../Client/packages/features/search/components/reels/) |
| **Likes / comments** | ReelLike, HomeComment; feed API has endpoints for like count and post/delete | [Server/app/models/property/](../../Server/app/models/property/), [Server/app/routes/feed.py](../../Server/app/routes/feed.py) |

## Gap analysis

| Target (see [07-mvp3-production](./07-mvp3-production.md)) | Current | Gap |
|------------------------------------------------------------|---------|-----|
| Feed API returns pre-ranked items | Feed API returns empty | Implement `get_feed` reading from UserPropertyLink + PropertyCache (MVP 1) |
| Redis feed queue per user | No feed cache in Redis | Add pre-compute job + Redis key schema (MVP 2) |
| Conversion-optimized ranking (MTML) | Similarity-only ranking (EnsembleScorer) | Add engagement signals and/or MTML (MVP 2 / 3) |
| Two-Tower + vector DB retrieval | Polygon search + in-memory scoring | Add Two-Tower and FAISS/Milvus when catalog grows (MVP 3) |
| Kafka event pipeline | No event streaming | Add Kafka (or simple event API) and consumers (MVP 2 / 3) |
| Feature Store | No feature store | Add Feast or equivalent for real-time features (MVP 3) |
| Client prefetch state machine | Virtuoso `increaseViewportBy` only | Implement sliding-window prefetch (MVP 3) |
| CDN + video optimizations | Standard HTTP delivery | Add when video-heavy (MVP 3 or later) |

## Summary

The data path for a personalized feed already exists: polygon search runs, scores with EnsembleScorer, and persists to PropertyCache + UserPropertyLink. The main missing piece for a minimal working Reels experience is wiring the Feed API to that data (MVP 1). After that, Redis feed cache and conversion-aware ranking (MVP 2) and full production stack (MVP 3) close the gaps to the target architecture.
