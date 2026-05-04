import { useCallback, useEffect, useState } from "react";

/** Stable row ids for reorderable viewing stops (parallel to `stops` indices). */
export function createStopRowId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `stop-${Math.random().toString(36).slice(2, 11)}`;
}

export function arrayMove<T>(array: T[], from: number, to: number): T[] {
  const next = [...array];
  const [removed] = next.splice(from, 1);
  next.splice(to, 0, removed);
  return next;
}

export function useViewingStopRowIds(stopsLength: number) {
  const [ids, setIds] = useState<string[]>(() =>
    Array.from({ length: stopsLength }, () => createStopRowId())
  );

  useEffect(() => {
    setIds((prev) => {
      if (prev.length === stopsLength) {
        return prev;
      }
      if (stopsLength > prev.length) {
        const added = stopsLength - prev.length;
        return [...prev, ...Array.from({ length: added }, () => createStopRowId())];
      }
      return prev.slice(0, stopsLength);
    });
  }, [stopsLength]);

  const removeIdAt = useCallback((index: number) => {
    setIds((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const appendId = useCallback(() => {
    setIds((prev) => [...prev, createStopRowId()]);
  }, []);

  const reorderIds = useCallback((from: number, to: number) => {
    setIds((prev) => arrayMove(prev, from, to));
  }, []);

  const replaceIds = useCallback((next: string[]) => {
    setIds(next);
  }, []);

  return { ids, removeIdAt, appendId, reorderIds, replaceIds };
}
