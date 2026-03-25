/**
 * Warm the browser image cache for a remote URL.
 * No-op when `Image` is unavailable (e.g. React Native without DOM Image).
 */
export function prefetchRemoteImage(url: string | null | undefined): void {
  const trimmed = typeof url === "string" ? url.trim() : "";
  if (!trimmed) return;

  const g = globalThis as typeof globalThis & {
    Image?: new () => { src: string; decode?: () => Promise<void> };
  };
  const ImageCtor = g.Image;
  if (typeof ImageCtor !== "function") return;

  const img = new ImageCtor();
  img.src = trimmed;
  if ("decode" in img && typeof img.decode === "function") {
    void img.decode().catch(() => {
      /* ignore decode errors; display layer still uses onError fallback */
    });
  }
}
