# Search preference scoping (pilot checklist)

Whose preferences drive Slipstream filters and scoring is determined by the **authenticated viewer** plus optional **`preferences_user_id`** on polygon/isochrone requests. The server resolves this through `resolve_preferences_user_id_for_research` (agents may only pass IDs in `client_ids`; buyers are always scoped to self).

## Request paths

| Flow | Client | `preferences_user_id` / subject | Server prefs source |
|------|--------|-----------------------------------|---------------------|
| Polygon force (isochrone) | `propertySearch.searchPropertiesInIsochrone` | Passed when agent has `selectedClientId` | `run_polygon_search` → `get_user_preferences_parsed(resolved_subject)` + merge body `user_preferences` overrides |
| Polygon force (viewport) | `propertySearch.searchPropertiesInViewport` | Same | Same |
| Polygon onlyCached | `fetchCachedPolygonSearchResults` | Optional `preferencesUserId` (buyers: typically omitted = self) | DB `UserPropertyLink` rows for **viewer only** (not subject-partitioned); agents skip initial fetch in `useSearchResultsData` |
| Isochrone GET | `searchApi.getIsochrone` query param | `preferencesUserId` when set | Same resolver + `get_user_preferences_parsed` |
| Property details / compare | `usePropertyDetails`, `usePropertyComparison` | `preferences_user_id` when agent + client | Research APIs |
| Session filter overrides | `searchContext.slice` | Merged into polygon body `user_preferences` | Server merges into subject prefs (`REQUEST_PREF_MERGE_KEYS` + must_have lists) |

## Agent client picker + profile sync

`useAgentSyncPreferencesWhenClientSelected` copies the selected client’s saved preferences onto the **agent’s** profile row (by design: filters UI / Slipstream paths that still read the agent row). **Polygon and isochrone still must send `preferences_user_id`** when the UI subject is the client so the server loads the client’s row for scoring. Do not rely on sync alone for search correctness.

## Regression guards

- When adding a new caller of `searchByPolygon` / `getIsochrone`, pass `preferences_user_id` whenever the UI acts on behalf of a selected client.
- If enabling `onlyCached` initial fetch for agents, partition or invalidate cache by subject (today: viewer-keyed DB only).
