# Reels: Architecture and Data Flow

## Full production flow

```mermaid
flowchart LR
  subgraph retrieval [Retrieval]
    UserTower[UserTower]
    ItemTower[ItemTower]
    VectorDB[VectorDB]
    UserTower --> EmbedU[UserEmbedding]
    ItemTower --> EmbedI[ItemEmbedding]
    EmbedU --> VectorDB
    EmbedI --> VectorDB
    VectorDB --> Candidates["~1k candidates"]
  end

  subgraph ranking [Ranking]
    MTML[MTML Model]
    Feast[Feature Store]
    Feast --> MTML
    Candidates --> MTML
    MTML --> TopN["Top 50 IDs"]
  end

  subgraph cache [Cache]
    Redis[Redis Cluster]
    TopN --> Redis
    Redis --> FeedAPI["Feed API"]
  end

  subgraph client [Client]
    FeedAPI --> App[App]
    App --> Prefetch[Prefetch Queue]
    Prefetch --> CDN[CDN Media]
  end

  retrieval --> ranking --> cache --> client
```

## Event feedback loop

```mermaid
flowchart LR
  subgraph client [Client]
    Swipe[Swipe / Pause / Save]
  end

  subgraph ingest [Ingest]
    Kafka[Kafka Topics]
    Swipe --> Kafka
  end

  subgraph features [Features]
    Feast[Feature Store]
    Kafka --> Feast
  end

  subgraph training [Training]
    Feast --> Retrain[Model Retrain]
    Retrain --> MTML[MTML / Two-Tower]
    MTML --> Deploy[Deploy]
  end

  client --> ingest --> features --> training
```

## Client prefetch state machine

```mermaid
flowchart TB
  subgraph queue [Feed Queue State]
    I0["Index 0: Current"]
    I1["Index 1: Next"]
    I2_4["Index 2-4: Partial"]
    I5Plus["Index 5+: Metadata only"]
  end

  I0 -->|"100% loaded"| I1
  I1 -->|"100% loaded"| I2_4
  I2_4 -->|"First 1-2 sec or first image"| I5Plus
  I5Plus -->|"JSON + thumbnail"| I5Plus
```

## Data flow: User opens app

1. **Feed request** — Client calls Feed API with `user_id` (from auth).
2. **Cache read** — API reads Redis key `feed:{user_id}` and returns pre-ranked list of listing IDs (and metadata if stored).
3. **Media URLs** — Response includes CDN URLs for thumbnails and media; client requests them from CDN.
4. **Prefetch** — While user views index 0, client prefetches index 1 fully and index 2–4 partially (first image or first seconds of video).
5. **Swipe** — User swipes; index 1 is already in memory and plays immediately.

## Ranking formula (target)

Expected Value (EV) drives the order of the feed:

```
EV = w1 * P(save) + w2 * P(contact_agent) + w3 * P(share) + w4 * P(book_tour)
```

- **Weights (w1–w4)** are tunable (e.g. increase w2 when agent leads are the priority).
- **P(...)** are outputs from the MTML model for each home.
- Homes are sorted by EV descending; top N go into the Redis queue.

See [02-tech-stack-and-rationale](./02-tech-stack-and-rationale.md) for the role of each component.
