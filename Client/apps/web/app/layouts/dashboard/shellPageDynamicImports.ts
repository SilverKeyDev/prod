/**
 * One shared Promise per dashboard-shell page chunk so hover prefetch and
 * React.lazy() reuse the same import() (one network fetch / parse when possible).
 * Clears the memo on failure so a later prefetch can retry (e.g. after deploy).
 */
import { getWindow } from "packages/utils/core/platform";

function memoizedPageImport<T>(
  getCache: () => Promise<T> | null,
  setCache: (p: Promise<T> | null) => void,
  load: () => Promise<T>
): Promise<T> {
  const cached = getCache();
  if (cached) {
    return cached;
  }
  const promise = load().catch((err: unknown) => {
    setCache(null);
    throw err;
  });
  setCache(promise);
  return promise;
}

let searchPageModulePromise: Promise<typeof import("@/pages/property/SearchPage")> | null = null;
let libraryPageModulePromise: Promise<typeof import("@/pages/property/LibraryPage")> | null = null;
let profilePageModulePromise: Promise<typeof import("@/pages/account/ProfilePage")> | null = null;
let dashboardPageModulePromise: Promise<typeof import("@/pages/workspace/DashboardPage")> | null =
  null;
let agentPageModulePromise: Promise<typeof import("@/pages/workspace/AgentPage")> | null = null;
let findAgentsPageModulePromise: Promise<typeof import("@/pages/misc/FindAgentsPage")> | null =
  null;
let agreementSigningCompletePageModulePromise: Promise<
  typeof import("@/pages/workspace/AgreementSigningCompletePage")
> | null = null;

export function loadSearchPageModule(): Promise<typeof import("@/pages/property/SearchPage")> {
  return memoizedPageImport(
    () => searchPageModulePromise,
    (p) => {
      searchPageModulePromise = p;
    },
    () => import("@/pages/property/SearchPage")
  );
}

export function loadLibraryPageModule(): Promise<typeof import("@/pages/property/LibraryPage")> {
  return memoizedPageImport(
    () => libraryPageModulePromise,
    (p) => {
      libraryPageModulePromise = p;
    },
    () => import("@/pages/property/LibraryPage")
  );
}

export function loadProfilePageModule(): Promise<typeof import("@/pages/account/ProfilePage")> {
  return memoizedPageImport(
    () => profilePageModulePromise,
    (p) => {
      profilePageModulePromise = p;
    },
    () => import("@/pages/account/ProfilePage")
  );
}

export function loadDashboardPageModule(): Promise<
  typeof import("@/pages/workspace/DashboardPage")
> {
  return memoizedPageImport(
    () => dashboardPageModulePromise,
    (p) => {
      dashboardPageModulePromise = p;
    },
    () => import("@/pages/workspace/DashboardPage")
  );
}

export function loadAgentPageModule(): Promise<typeof import("@/pages/workspace/AgentPage")> {
  return memoizedPageImport(
    () => agentPageModulePromise,
    (p) => {
      agentPageModulePromise = p;
    },
    () => import("@/pages/workspace/AgentPage")
  );
}

export function loadFindAgentsPageModule(): Promise<typeof import("@/pages/misc/FindAgentsPage")> {
  return memoizedPageImport(
    () => findAgentsPageModulePromise,
    (p) => {
      findAgentsPageModulePromise = p;
    },
    () => import("@/pages/misc/FindAgentsPage")
  );
}

export function loadAgreementSigningCompletePageModule(): Promise<
  typeof import("@/pages/workspace/AgreementSigningCompletePage")
> {
  return memoizedPageImport(
    () => agreementSigningCompletePageModulePromise,
    (p) => {
      agreementSigningCompletePageModulePromise = p;
    },
    () => import("@/pages/workspace/AgreementSigningCompletePage")
  );
}

let googleMapsUtilModulePromise: Promise<
  typeof import("packages/features/search/utils/googleMaps")
> | null = null;

/** Best-effort Maps script prewarm when prefetching Search (deduped). */
export function prefetchGoogleMapsForSearch(): void {
  if (!getWindow()) {
    return;
  }
  googleMapsUtilModulePromise ??= import("packages/features/search/utils/googleMaps");
  void googleMapsUtilModulePromise.then(({ googleMapsService }) => {
    void googleMapsService.loadGoogleMapsScript();
  });
}
