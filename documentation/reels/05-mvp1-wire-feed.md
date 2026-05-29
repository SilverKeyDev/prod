# Reels MVP 1: Wire Feed

## Goal

Working feed from existing data: no new ML or infra. The Feed API reads from PropertyCache + UserPropertyLink (already populated by polygon search and EnsembleScorer) and returns paginated FeedListing items so the Reels UI shows real homes instead of an empty or dummy feed.

## Scope

- Implement `get_feed` in the feed route.
- Read from `get_cached_search_results(user_id)` (see [04-current-infrastructure](./04-current-infrastructure.md)).
- Map each property dict to FeedListing shape.
- Paginate with `page` and `limit`; return `{ items, hasMore, cursor? }`.
- Require authenticated user for personalized feed; return empty when no search results.

## Files to change

- **[Server/app/routes/feed.py](../../Server/app/routes/feed.py)** — Implement `get_feed`: get current user, call `get_cached_search_results(user_id)`, paginate, map to FeedListing, optionally attach like counts from ReelLike.
- **Optional:** **[Server/app/services/feed/feed_service.py](../../Server/app/services/feed/feed_service.py)** — New module for `get_feed_items_for_user(user_id, page, limit)` and `property_to_feed_listing(property_dict, like_count?, is_liked_by_me?)` to keep the route thin.

## Property to FeedListing mapping

| FeedListing field | Source (property dict / PropertyCache + UserPropertyLink) |
|-------------------|----------------------------------------|
| `id` | `zpid` or `mls_home_id` or `id` |
| `thumbnailUrl` | `imgSrc` or `image_url` or first of `image_urls` |
| `images` | `image_urls` or `[imgSrc]` if single image |
| `user` | `{ id: "silverkey", name: "SilverKey" }` (static for MVP) |
| `stats` | `likes` from ReelLike count; `comments` from HomeComment count; `shares: 0` |
| `price` | `price` (number) |
| `city` | `city` |
| `state` | `state` |
| `zipCode` | `zipcode` or `zipCode` |
| `lat` | `latitude` |
| `lng` | `longitude` |
| `features` | Derived: e.g. `["{beds} bed", "{baths} bath"]` from `bedrooms`, `bathrooms`; append from `features` if present |
| `videoUrl` | Omit for MVP (or from `raw_data` if present) |

Client already uses `listingToReelMedia` to build `media[]` from `thumbnailUrl`, `images`, `videoUrl`; ensure at least `thumbnailUrl` and `images` are set so a fallback image is shown.

## Auth and fallback

- **Auth:** Use `get_current_user()`. If no user, return `401` or empty feed depending on product choice (recommended: require auth and return 401 for unauthenticated feed request).
- **No results:** When `get_cached_search_results(user_id)` returns an empty list, return `{ items: [], hasMore: false }`. Client already falls back to dummy data when the API returns empty; alternatively show "Search first to see homes" when empty.

## Effort

Roughly 2–3 hours.
