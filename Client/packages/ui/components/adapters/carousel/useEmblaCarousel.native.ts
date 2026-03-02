import { useCallback, useRef } from "react";

/**
 * Native: stub for carousel. Reels/carousel on RN can use a different implementation
 * (e.g. react-native-pager-view or FlatList horizontal). Same API shape for callers.
 */
export function useEmblaCarousel(_options?: unknown): [
  (node: unknown) => void,
  {
    selectedScrollSnap: () => number;
    scrollTo: (index: number) => void;
    scrollNext: () => void;
    scrollPrev: () => void;
    on: (_event: string, _cb: () => void) => void;
    off: (_event: string, _cb: () => void) => void;
  } | null,
] {
  const refCallback = useCallback((_node: unknown) => {
    // no-op ref for native stub
  }, []);
  const apiRef = useRef<{
    selectedScrollSnap: () => number;
    scrollTo: (index: number) => void;
    scrollNext: () => void;
    scrollPrev: () => void;
    on: (_event: string, _cb: () => void) => void;
    off: (_event: string, _cb: () => void) => void;
  } | null>(null);
  if (!apiRef.current) {
    apiRef.current = {
      selectedScrollSnap: () => 0,
      scrollTo: () => {},
      scrollNext: () => {},
      scrollPrev: () => {},
      on: () => {},
      off: () => {},
    };
  }
  return [refCallback, apiRef.current];
}
