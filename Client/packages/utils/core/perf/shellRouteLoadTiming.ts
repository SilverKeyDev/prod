import { log, type LogCategory } from "packages/logger";

export type ShellPerfRoute = "dashboard" | "messaging";

const pending = new Map<ShellPerfRoute, { startMs: number; pathname: string }>();

function categoryForShellRoute(route: ShellPerfRoute): LogCategory {
  return route === "messaging" ? "MESSAGES" : "DASHBOARD";
}

/**
 * Call when the dashboard shell switches to /dashboard or /messaging so time-to-first-mount
 * of the lazy page includes chunk download + parse + React render.
 */
export function shellRouteNavigateStart(route: ShellPerfRoute, pathname: string): void {
  const startMs = performance.now();
  pending.set(route, { startMs, pathname });
  try {
    performance.mark(`silverkey-shell-${route}-nav-start`);
  } catch {
    // ignore
  }
  const cat = categoryForShellRoute(route);
  log.info(cat, "[PERF] Shell route: navigate started (Suspense + lazy chunk pending)", {
    route,
    pathname,
  });
}

/** Call from DashboardPage / AgentPage after the lazy module mounts. */
export function shellRoutePageMounted(route: ShellPerfRoute, pathname: string): void {
  const cat = categoryForShellRoute(route);
  const state = pending.get(route);
  if (!state) {
    log.debug(cat, "[PERF] Shell route: page mounted without pending nav start", {
      route,
      pathname,
    });
    return;
  }
  const navigateToMountMs = performance.now() - state.startMs;
  pending.delete(route);
  try {
    performance.mark(`silverkey-shell-${route}-page-mounted`);
    performance.measure(
      `silverkey-shell-${route}-nav-to-mount`,
      `silverkey-shell-${route}-nav-start`,
      `silverkey-shell-${route}-page-mounted`
    );
  } catch {
    // marks may be missing if navigation repeated quickly
  }
  log.info(cat, "[PERF] Shell route: lazy page mounted", {
    route,
    pathname,
    navigateToMountMs: Math.round(navigateToMountMs * 100) / 100,
    startedFromPathname: state.pathname,
  });
}

/** Logs duration when a dynamic import() promise settles (prefetch or route load). */
export function traceDynamicImport(
  category: LogCategory,
  label: string,
  promise: Promise<unknown>
): void {
  const t0 = performance.now();
  void promise.then(
    () => {
      log.info(category, "[PERF] Dynamic import finished", {
        label,
        ms: Math.round((performance.now() - t0) * 100) / 100,
      });
    },
    () => {
      log.warn(category, "[PERF] Dynamic import rejected", {
        label,
        ms: Math.round((performance.now() - t0) * 100) / 100,
      });
    }
  );
}

/**
 * Wraps a lazy() loader so we time the import() promise the first time React
 * resolves the lazy module (separate from prefetch). Use as:
 *   const Foo = lazy(traceLazyImport("MESSAGES", "lazy:Foo", () => import("./Foo")));
 */
export function traceLazyImport<T>(
  category: LogCategory,
  label: string,
  loader: () => Promise<T>
): () => Promise<T> {
  let logged = false;
  return () => {
    const t0 = performance.now();
    const promise = loader();
    void promise.then(
      () => {
        if (logged) return;
        logged = true;
        log.info(category, "[PERF] Lazy module resolved", {
          label,
          ms: Math.round((performance.now() - t0) * 100) / 100,
        });
      },
      () => {
        if (logged) return;
        logged = true;
        log.warn(category, "[PERF] Lazy module rejected", {
          label,
          ms: Math.round((performance.now() - t0) * 100) / 100,
        });
      }
    );
    return promise;
  };
}

const prefetchByLabel = new Map<string, Promise<unknown>>();

/**
 * Dedupes idle prefetch import() calls by label. Reuses the in-flight promise until
 * rejection; on failure the label is cleared so a later prefetch can retry.
 */
export function tracedPrefetch<T>(
  category: LogCategory,
  label: string,
  load: () => Promise<T>
): void {
  let promise = prefetchByLabel.get(label);
  if (!promise) {
    promise = load();
    prefetchByLabel.set(label, promise);
    void promise.catch(() => {
      prefetchByLabel.delete(label);
    });
  }
  traceDynamicImport(category, label, promise);
}

/** @internal test-only */
export function resetTracedPrefetchStateForTests(): void {
  prefetchByLabel.clear();
}
