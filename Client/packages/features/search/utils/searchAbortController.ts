/**
 * Module-scoped abort controller for property search.
 * Survives Search page unmount so in-flight searches continue while the user navigates away.
 */
let activeController: AbortController | null = null;

export function getSearchAbortSignal(): AbortSignal | undefined {
  return activeController?.signal;
}

/** Abort any in-flight search and return a fresh controller for the next request. */
export function beginSearchAbortScope(): AbortController {
  activeController?.abort();
  const controller = new AbortController();
  activeController = controller;
  return controller;
}

export function abortActiveSearch(): void {
  activeController?.abort();
}

export function isActiveSearchController(controller: AbortController): boolean {
  return activeController === controller;
}

export function endSearchAbortScope(controller: AbortController): void {
  if (activeController === controller) {
    activeController = null;
  }
}

/**
 * When a search promise rejects with AbortError, only clear loading UI if this abort
 * was intentional (cancel) — not when a newer search superseded the aborted one.
 */
export function shouldClearLoadingOnSearchAbort(): boolean {
  const signal = activeController?.signal;
  return !signal || signal.aborted;
}

/** @internal Vitest isolation only */
export function resetSearchAbortControllerForTests(): void {
  activeController?.abort();
  activeController = null;
}
