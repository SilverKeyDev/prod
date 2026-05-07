import { useEffect, useLayoutEffect, useRef } from "react";

import { log, type LogCategory } from "packages/logger";

/**
 * Logs render → commit (useLayoutEffect) → effect (useEffect) timing for the first render
 * of a component. Helps split "module loaded" vs "first render" vs "first commit + paint".
 *
 * - renderToCommitMs: synchronous React render work for this subtree (and any children
 *   that didn't suspend). Includes child render time.
 * - renderToEffectMs: time from first render through paint (one frame after commit).
 */
export function useFirstRenderCommitTimer(category: LogCategory, label: string): void {
  const renderStartRef = useRef<number | null>(null);
  const committedRef = useRef(false);
  if (renderStartRef.current === null) {
    renderStartRef.current = performance.now();
  }

  useLayoutEffect(() => {
    if (committedRef.current) return;
    committedRef.current = true;
    const start = renderStartRef.current ?? performance.now();
    log.info(category, "[PERF] Component first commit", {
      label,
      renderToCommitMs: Math.round((performance.now() - start) * 100) / 100,
    });
    // first commit only — empty deps intentional
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const start = renderStartRef.current ?? performance.now();
    log.info(category, "[PERF] Component first effect (post-paint)", {
      label,
      renderToEffectMs: Math.round((performance.now() - start) * 100) / 100,
    });
    // first effect only — empty deps intentional
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
