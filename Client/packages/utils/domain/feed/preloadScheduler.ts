/**
 * Preload scheduler - 1-1-3 model per SilverKey Intent Discovery Engine spec.
 * - Active (N): handled by useHlsVideo (manifest, init, buffer target)
 * - Next (N+1): handled by useHlsVideo (manifest, first segment)
 * - N+2, N+3: poster only (prefetch images)
 * - Previous (N-1): keep mounted, paused (handled by VideoItem attach/detach)
 */

const POSTER_CACHE_MAX = 20;
const preloadedPosters = new Set<string>();

export function preloadPoster(url: string): void {
  if (!url || preloadedPosters.has(url)) return;
  if (preloadedPosters.size >= POSTER_CACHE_MAX) {
    const first = preloadedPosters.values().next().value;
    if (first) preloadedPosters.delete(first);
  }
  preloadedPosters.add(url);
  const img = new Image();
  img.src = url;
}

export function schedulePreload(
  items: Array<{ id: string; thumbnailUrl: string }>,
  activeIndex: number,
): void {
  for (let i = 1; i <= 3; i++) {
    const idx = activeIndex + i;
    const item = items[idx];
    if (item?.thumbnailUrl) {
      preloadPoster(item.thumbnailUrl);
    }
  }
}

export function clearPreloadScheduler(): void {
  preloadedPosters.clear();
}
