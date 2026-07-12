# Public agent profile site

> **Status:** Shipped web surface
> **Last verified:** 2026-07-10
> **Code:** `Client/packages/features/profile/`, `Client/packages/features/agent/`, `Server/app/routes/public/`

The public agent profile is the shareable, unauthenticated agent site. It is a
growth surface for agent identity, profile credentials, MLS-attributed listings,
client testimonials, social links, and the public Connect CTA.

This guide covers the SIL-287/SIL-289/SIL-290 public-site work: routing, API
contracts, data sources, demo setup, and QA checks.

## Architecture at a glance

```text
Web route
  /a/{publicProfileSlug}
  /agent-profile/{nameSlug}/{userId}
    -> Client/apps/web/pages/misc/AgentProfilePage.tsx
    -> AgentProfilePageContent.web.tsx
    -> usePublicAgentProfileLookup()
    -> publicApi.getAgentProfileBySlug() or publicApi.getAgentProfile()

Public API
  GET /api/v1/public/agent-profile/slug/{publicProfileSlug}
  GET /api/v1/public/agent-profile/{userId}
  GET /api/v1/public/agent-profile/{userId}/listings?status=active|sold

Server data
  users + user_agent_profiles -> PublicAgentProfile
  property_cache + users.mls_id/listing_agent_email -> PublicAgentListing[]
```

Primary codepaths:

| Concern | Files |
| ------- | ----- |
| SPA routes | [`DynamicRoutes.tsx`](../../../Client/apps/web/app/routes/DynamicRoutes.tsx), [`AgentProfilePage.tsx`](../../../Client/apps/web/pages/misc/AgentProfilePage.tsx) |
| Public page composition | [`AgentProfilePageContent.web.tsx`](../../../Client/packages/features/profile/components/pages/AgentProfilePageContent.web.tsx), [`AgentPublicProfileView.web.tsx`](../../../Client/packages/features/profile/components/AgentPublicProfileView.web.tsx) |
| Public sections | [`publicSite/`](../../../Client/packages/features/profile/components/publicSite/) |
| Public hooks | [`usePublicAgentProfileLookup.ts`](../../../Client/packages/features/profile/hooks/data/usePublicAgentProfileLookup.ts), [`usePublicAgentListings.ts`](../../../Client/packages/features/profile/hooks/data/usePublicAgentListings.ts), [`usePublicAgentProfile.ts`](../../../Client/packages/features/agent/hooks/data/public/usePublicAgentProfile.ts) |
| API adapter | [`Client/packages/api/public.ts`](../../../Client/packages/api/public.ts) |
| Server routes | [`agent_profile.py`](../../../Server/app/routes/public/agent_profile.py), [`agent_listings.py`](../../../Server/app/routes/public/agent_listings.py) |
| Server services | [`agent_profile.py`](../../../Server/app/services/public/agent_profile.py), [`agent_listings.py`](../../../Server/app/services/public/agent_listings.py), [`profile_slug.py`](../../../Server/app/services/public/profile_slug.py) |
| API contract | [`openapi.yaml`](../../../openapi/openapi.yaml), [`PublicAgentProfile.yaml`](../../../openapi/components/schemas/user/profile/PublicAgentProfile.yaml), [`PublicAgentListing.yaml`](../../../openapi/components/schemas/user/profile/PublicAgentListing.yaml) |

## URL model and canonical redirects

The preferred share URL is:

```text
/a/{publicProfileSlug}
```

The long, id-based fallback remains:

```text
/agent-profile/{nameSlug}/{userId}
```

Rules:

- `publicProfileSlug` comes from `users.public_profile_slug`.
- Slugs are assigned by
  [`ensure_public_profile_slug`](../../../Server/app/services/public/profile_slug.py)
  when preferences are written for an active agent.
- Slug validation is lowercase alphanumeric with single hyphen separators,
  length 3-64, and a reserved-word blocklist (`api`, `admin`, `profile`,
  `agent-profile`, etc.).
- `buildAgentProfileUrl()` prefers `/a/{slug}` when a slug is available and
  falls back to `/agent-profile/{nameSlug}/{userId}`.
- `AgentProfilePageContent.web.tsx` canonicalizes loaded profiles:
  - any long URL redirects to `/a/{slug}` when the profile returns a slug;
  - long URLs without a slug redirect only when the name segment does not match
    the generated display-name slug.

## Public API behavior

All three reads are unauthenticated public endpoints. The route handlers apply
`@rate_limit(max_requests=100, window_seconds=60)`, validate OpenAPI response
schemas, and set edge caching (`max_age=120`, `stale_while_revalidate=300`).

| Endpoint | Purpose | Not-found behavior |
| -------- | ------- | ------------------ |
| `GET /api/v1/public/agent-profile/slug/{publicProfileSlug}` | Load by short slug for `/a/{slug}` | 404 when the slug is invalid, unknown, inactive, or not an agent |
| `GET /api/v1/public/agent-profile/{userId}` | Load by stable user id for long URLs | 404 when the user is missing, inactive, or not an agent |
| `GET /api/v1/public/agent-profile/{userId}/listings?status=active\|sold` | Load MLS listings for the listings section | 404 for missing/inactive/non-agent users; empty array when the agent has no MLS-linked listings |

Client hooks treat public 404s as `null` so the page can show visitor-safe
unavailable states instead of crashing.

## Data sources

### Profile payload

`build_public_agent_profile()` combines:

- `users`: `id`, `name`, `email`, `phone`, `mls_id`,
  `public_profile_slug`, and profile image lookup.
- `user_agent_profiles`: bio, brokerage fields, professional headshot,
  service ZIPs, specialties, licensing fields, MLS affiliations,
  testimonials, and social links.

Images are exposed as URLs only: profile pictures are presigned when stored in
S3, and professional headshots pass through if they are already `http(s)` URLs
or are presigned from stored references.

### Listings payload

`build_public_agent_listings()` reads from `property_cache` and matches listings
to the agent by either:

1. `users.mls_id == property_cache.mls_agent_id`, or
2. lowercase `users.email == property_cache.listing_agent_email`.

Results are ordered by newest `property_cache.updated_at`, capped at 48 rows,
and split client-side into:

- `active`: any status except the sold set;
- `sold`: raw statuses normalized to `sold`, `closed`, `recently_sold`, or
  `off_market`.

Cards must keep MLS attribution visible from `brokerage`, `mls_home_id`, and
`mls_region`. This surface is not partner placement and should not include
rev-share or marketplace CTAs.

### Testimonials

Agents edit testimonials in the profile form via
[`AgentTestimonialsSection.tsx`](../../../Client/packages/features/profile/components/formSections/AgentTestimonialsSection.tsx).
The editor allows up to 12 entries. Incomplete rows can exist while editing;
the server write path normalizes persisted agent profile data before it appears
on the public payload.

## Web vs native parity

The landing-style public site is web-specific:

- Web uses `AgentPublicProfileView.web.tsx` with hero, MLS listings,
  testimonials, and social sections.
- Native still resolves the shared `AgentPublicProfileView.tsx` stacked card
  layout and does not render the web listings/testimonials sections.
- Share rows can appear in profile/settings on both platforms. When `window` is
  unavailable, absolute share URLs use `https://usesilverkey.com` as the origin.

Do not assume a new public-site section is automatically native-ready. Add a
shared implementation or a `.native.tsx` counterpart when mobile parity is part
of the change.

## Local demo setup

Run these from `Server/` after the local API environment and database are ready.
Do not run them against production data.

### Seed sample public listings

```bash
python scripts/misc/seed_sample_agent_listings.py
```

This script:

- creates clearly marked `SAMPLE-*` `property_cache` rows;
- assigns demo `users.mls_id` values for the seeded demo agents;
- uses `Client/public/sample-listings/` image paths;
- is idempotent: re-running replaces the same sample rows.

Remove sample rows and unlink demo agents:

```bash
python scripts/misc/seed_sample_agent_listings.py --remove
```

### Backfill attribution on existing cache rows

```bash
python scripts/misc/backfill_listing_agent_attribution.py
```

This fills empty `property_cache.mls_agent_id`,
`property_cache.listing_agent_email`, `property_cache.listing_agent_phone`, and
`property_cache.brokerage` from cached `raw_data`.

Useful local/demo helpers:

```bash
python scripts/misc/backfill_listing_agent_attribution.py --link-user agent@example.com MLS_AGENT_ID
python scripts/misc/backfill_listing_agent_attribution.py --mark-sold 123456789 987654321
python scripts/misc/backfill_listing_agent_attribution.py --skip-backfill --link-user agent@example.com MLS_AGENT_ID
```

## QA smoke checks

1. Open an agent's profile/settings page and confirm the public profile share
   row shows the `/a/{slug}` URL when `public_profile_slug` exists.
2. Open the public URL in a logged-out or private browser session.
3. Confirm canonical behavior:
   - `/a/{slug}` loads without auth.
   - `/agent-profile/{nameSlug}/{userId}` redirects to `/a/{slug}` when the API
     returns `public_profile_slug`.
4. Confirm the page renders hero content, Connect CTA, listings, testimonials,
   and social links when the source data exists.
5. Confirm an agent with no matched listings shows the listings empty state.
6. Confirm sample listing cards without `zpid` are non-clickable; cards with
   `zpid` link to `/property/{zpid}/{slug}`.
7. Confirm invalid listing status filters return 400:

```bash
curl -i "http://localhost:5000/api/v1/public/agent-profile/<userId>/listings?status=pending"
```

## Common pitfalls

- **No listings for an agent:** Check `users.mls_id`,
  `property_cache.mls_agent_id`, and `property_cache.listing_agent_email`.
- **Long URL keeps changing:** The page canonicalizes the name segment and
  prefers `/a/{slug}` after the profile payload loads.
- **Profile shows but listings are empty:** The profile endpoint reads
  `users`/`user_agent_profiles`; listings read `property_cache`.
- **A slug is missing:** Save preferences for the active agent so
  `ensure_public_profile_slug()` runs.
- **Testimonials are missing:** Ensure persisted testimonial rows include both
  author and quote before expecting them on the public payload.
- **Native does not match web:** Listings/testimonials are intentionally
  web-only at the time of this verification.
