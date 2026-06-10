> **Status:** Planned
> **Last verified:** 2026-06-04
# Reels: Final Goal and Vision

## Vision

Reels for homes should feel like Instagram Reels or TikTok: instant scroll, hyper-personalized content, and zero perceived latency. The feed is not a simple list of search results; it is a recommendation surface optimized for real-estate conversions (saves, agent contact, tour bookings) while still respecting match quality and user preferences.

## Success criteria

1. **Zero perceived latency** — The next home is ready before the user swipes. Feed load and scroll feel instantaneous.
2. **Conversion-optimized ranking** — The order of homes maximizes expected value: saves, agent contacts, shares, and tour bookings, not just "best match" similarity.
3. **Personalization** — Feed reflects user preferences (location, budget, style) and real-time behavior (pauses, rewinds, saves).
4. **Seamless UX** — Vertical full-screen cards, smooth scroll, likes/comments/shares, and clear CTAs (save, contact agent, book tour).

## Non-goals

- **Full video-first** — Images are the primary medium for real estate listings. Video optimizations (moov atom, HLS, cold-start disk cache) apply when video tours become central.
- **Replicating social virality** — We are not optimizing for shares or follower growth; we optimize for in-app conversions.
- **Replacing search** — Search (map, filters, polygon) remains the primary way to define the candidate pool; Reels is the consumption and conversion layer on top of that pool.

## Target user experience

1. User opens Reels (or switches from Search to Reels).
2. Feed loads instantly from a pre-computed queue (no ranking at request time).
3. User swipes up/down; the next home is already loaded and starts immediately.
4. User can like, comment, save, contact agent, or book a tour from the reel.
5. Every interaction feeds back into the system to improve future ranking.
6. Over time, the feed prioritizes homes the user is most likely to save or inquire about.
