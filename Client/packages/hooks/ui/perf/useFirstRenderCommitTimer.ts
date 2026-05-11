import { useEffect, useLayoutEffect, useRef } from "react";

import { log, type LogCategory } from "packages/logger";

/**
 * Logs render → commit (useLayoutEffect) → effect (useEffect) timing for the first render
 * of a component. Helps split "module loaded" vs "first render" vs "first commit + paint".
 *
 * - renderToCommitMs: time from this component’s first render until its `useLayoutEffect`
 *   runs — i.e. after React commits the **DOM for this component’s subtree** in the same
 *   pass. That includes synchronous render work for **descendants that committed with it**
 *   (children that did not suspend). It is not limited to work in this file alone.
 * - renderToEffectMs: time from first render through paint (one frame after commit).
 *
 * In React 18 dev Strict Mode, passive effects run twice; the post-paint log is guarded
 * so perf output stays one line per mount (layout timing was already guarded similarly).
 */
export function useFirstRenderCommitTimer(category: LogCategory, label: string): void {
  const renderStartRef = useRef<number | null>(null);
  const committedRef = useRef(false);
  const effectLoggedRef = useRef(false);
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
    if (effectLoggedRef.current) return;
    effectLoggedRef.current = true;
    const start = renderStartRef.current ?? performance.now();
    log.info(category, "[PERF] Component first effect (post-paint)", {
      label,
      renderToEffectMs: Math.round((performance.now() - start) * 100) / 100,
    });
    // first effect only — empty deps intentional
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
