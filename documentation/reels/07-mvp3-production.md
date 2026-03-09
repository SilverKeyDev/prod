# Reels MVP 3: Production

## Goal

Full production architecture for Reels: Instagram/TikTok-style retrieval and ranking, event-driven feedback, Redis feed queues, and client prefetch so the feed is conversion-optimized and feels instant.

## Scope

1. **Two-Tower + vector DB** — User and item towers produce embeddings; vector DB (FAISS, Milvus, or Pinecone) stores item embeddings and serves nearest-neighbor retrieval. Candidate generation becomes: user embedding → ANN search → ~1k candidate listing IDs.
2. **MTML ranking** — Multi-task model predicts P(save), P(contact_agent), P(share), P(book_tour). Combine with weights into EV; sort candidates by EV and take top 50 for the feed queue.
3. **Kafka event pipeline** — All engagement events (view, pause, save, contact, tour request) published to Kafka topics. Consumers update feature store and/or training pipelines.
4. **Feature Store** — Feast or equivalent to serve real-time features (e.g. saves in last 7 days, listing save rate) to the ranking model with low latency.
5. **Redis Cluster for feed queues** — Pre-computed feed per user at scale; Feed API reads from Redis only (no fallback to DB at request time for hot path).
6. **Client prefetch state machine** — Sliding window: index 0–1 fully loaded, 2–4 first image or first 1–2 sec of video, 5+ metadata and thumbnail only. Ensures next item is ready before swipe.
7. **Video optimizations** — When video is central: moov atom at front of MP4, HLS segments, CDN (e.g. CloudFront) with adaptive bitrate; optional cold-start disk cache of next 3–5 items for next session.

## Phased rollout

| Phase | Focus | Outcome |
|-------|--------|---------|
| Retrieval | Two-Tower + vector DB | Candidate set comes from ANN over embeddings instead of polygon search only. |
| Ranking | MTML + Feature Store | Feed order optimizes for conversions; features served in ms. |
| Events | Kafka + consumers | All actions streamed; feature store and training use live data. |
| Client | Prefetch state machine | Next item loaded before swipe; optional disk cache for cold start. |
| Video | CDN + HLS + moov | Fast start and adaptive quality when listing video is primary. |

## Effort

Months; implement incrementally so each phase is shippable (e.g. keep polygon search as fallback until Two-Tower is validated).

## References

- [01-final-goal-and-vision](./01-final-goal-and-vision.md) — Vision and success criteria
- [02-tech-stack-and-rationale](./02-tech-stack-and-rationale.md) — Why each component
- [03-architecture-and-data-flow](./03-architecture-and-data-flow.md) — Diagrams and data flow
