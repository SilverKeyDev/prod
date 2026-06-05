> **Status:** Planned
> **Last verified:** 2026-06-04
# Reels: Tech Stack and Rationale

This document explains why each part of the target tech stack is used and what alternatives exist.

## Recommendation and ranking

| Component | Purpose | Why |
|-----------|---------|-----|
| **Two-Tower model** | User and item embeddings for candidate retrieval | Fast similarity search at scale; one tower encodes user (preferences, behavior), the other encodes the home (price, beds, style). Nearest-neighbor search over item embeddings narrows millions of homes to ~1,000 candidates in milliseconds. |
| **MTML (Multi-Task Multi-Label)** | Predict multiple conversion actions | Single model outputs P(save), P(contact_agent), P(share), P(book_tour). Combines into Expected Value (EV) with tunable weights so the business can prioritize agent leads vs. saves vs. tours. |
| **Vector DB (FAISS / Milvus / Pinecone)** | Nearest-neighbor search on embeddings | Running similarity over millions of vectors in application memory is slow. A dedicated vector store does sub-millisecond ANN search; FAISS is Meta’s in-house option, Milvus/Pinecone are production alternatives. |

**Alternatives:** Pure collaborative filtering (does not use rich home attributes). Single-tower or single-task models (simpler but less flexible than MTML for multi-objective ranking).

## Caching and delivery

| Component | Purpose | Why |
|-----------|---------|-----|
| **Redis Cluster** | Pre-computed feed queues per user | Running heavy ranking on every feed open is too slow. Pre-compute a short queue (e.g. 50 items) per user in a background job; feed API reads by `user_id` and returns instantly. |
| **CDN + HLS** | Video delivery when video-heavy | Edge caching and adaptive bitrate (HLS) keep start time low and quality matched to network. Becomes critical when many listings have video tours. |
| **MP4 fast start (moov atom)** | Instant video playback | Default MP4 has metadata at end of file; player must fetch it before playing. Moving the moov atom to the front lets playback start as soon as the first bytes arrive. |

**Alternatives:** In-memory cache per app instance (does not scale across instances). Progressive download without HLS (works but less adaptive).

## Events and features

| Component | Purpose | Why |
|-----------|---------|-----|
| **Kafka** | Event streaming for swipes, pauses, saves | Every micro-interaction (view, pause, save, contact) is published to topics. Downstream jobs update user embeddings and feature stores so the next ranking run uses fresh behavior. |
| **Feature Store (Feast / Hopsworks)** | Real-time ML features for ranking | Ranking model needs features like "saves in last 7 days", "homes with pool viewed". A feature store serves these at single-digit ms latency instead of ad-hoc DB queries. |

**Alternatives:** REST event ingestion + DB (simpler, less scalable). Computing features inside the ranking service (higher latency, harder to reuse).

## Client

| Component | Purpose | Why |
|-----------|---------|-----|
| **Client prefetch queue** | Sliding window: 0–1 full, 2–4 partial, 5+ metadata | Index 0 (current) and 1 (next) are fully loaded; 2–4 get first 1–2 seconds or first image so swipe feels instant; 5+ only metadata and thumbnail. Balances memory/bandwidth with perceived speed. |

**Alternatives:** Load-all (wastes bandwidth). Load-on-demand only (noticeable delay on swipe).

## Summary

The stack is chosen to (1) scale retrieval and ranking over large catalogs, (2) serve feed with no ranking at request time, and (3) close the loop from user actions back into ranking. See [03-architecture-and-data-flow](./03-architecture-and-data-flow.md) for how these pieces connect.
