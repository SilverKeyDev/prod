/**
 * Native preload scheduler — mirrors web API but uses React Native image prefetch.
 *
 * Note: React Native does not support `new Image()`. We use `Image.prefetch` instead.
 */
import { Image } from "packages/ui/components/primitives";

const POSTER_CACHE_MAX = 20;
const preloadedPosters = new Set<string>();

export function preloadPoster(url: string): void {
  if (!url || preloadedPosters.has(url)) return;

  if (preloadedPosters.size >= POSTER_CACHE_MAX) {
    const first = preloadedPosters.values().next().value as string | undefined;
    if (first) preloadedPosters.delete(first);
  }

  preloadedPosters.add(url);
  void Image.prefetch(url).catch(() => {
    // Best-effort: ignore prefetch failures (network, invalid URL, etc.)
  });
}

export function schedulePreload(
  items: Array<{ id: string; thumbnailUrl: string }>,
  activeIndex: number
): void {
  for (let i = 1; i <= 3; i++) {
    const idx = activeIndex + i;
    const item = items[idx];
    if (item?.thumbnailUrl) preloadPoster(item.thumbnailUrl);
  }
}

export function clearPreloadScheduler(): void {
  preloadedPosters.clear();
}
