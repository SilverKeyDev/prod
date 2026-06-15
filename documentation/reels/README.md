> **Status:** Partial
> **Last verified:** 2026-06-04
> **Shipped feature docs:** [search.md](../client/features/search.md) (polygon search + cache); client Reels UI under `Client/packages/features/search/components/reels/`.

# Reels for Homes

Instagram/TikTok-style vertical feed for property listings: instant scroll, hyper-personalized ranking, and conversion-optimized experience (saves, agent contact, tour bookings).

## Table of contents

| Doc | Description |
|-----|--------------|
| [01-final-goal-and-vision](./01-final-goal-and-vision.md) | Target state, success criteria, non-goals |
| [02-tech-stack-and-rationale](./02-tech-stack-and-rationale.md) | Why each component is used, alternatives |
| [03-architecture-and-data-flow](./03-architecture-and-data-flow.md) | How it works, diagrams |
| [04-current-infrastructure](./04-current-infrastructure.md) | What SilverKey has today |
| [05-mvp1-wire-feed](./05-mvp1-wire-feed.md) | MVP 1: Working feed from existing data |
| [06-mvp2-engagement-and-cache](./06-mvp2-engagement-and-cache.md) | MVP 2: Conversion signals, Redis cache |
| [07-mvp3-production](./07-mvp3-production.md) | MVP 3: Full production architecture |

## Quick reference

| | Current state | Target state |
|---|---------------|---------------|
| Feed API | Returns empty stub | Serves pre-ranked feed from cache |
| Ranking | Embedding similarity (EnsembleScorer) | Conversion-optimized (MTML) |
| Cache | PropertyCache + UserPropertyLink (PostgreSQL) | Redis feed queue + vector DB retrieval |
| Client | Virtuoso, infinite scroll | Sliding-window prefetch, instant next item |
