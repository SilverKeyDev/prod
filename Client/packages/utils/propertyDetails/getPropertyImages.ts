/**
 * Extracts image URLs from a property object.
 * Handles PropertyWithPhotos (photos array) and PropertyWithImages (images array).
 * Uses minimal types to avoid cross-feature imports.
 */

export function getPropertyImages(property: unknown): string[] {
  const obj = property as
    | { images?: string[]; photos?: unknown[] }
    | null
    | undefined;

  if (obj && typeof obj === "object" && Array.isArray(obj.images)) {
    return obj.images;
  }

  if (obj && Array.isArray(obj.photos)) {
    return obj.photos
      .map((p) => {
        if (typeof p === "string") return p;
        if (p && typeof p === "object" && "url" in p) {
          return (p as { url?: string }).url;
        }
        if (p && typeof p === "object" && "mixedSources" in p) {
          const { mixedSources } = p as {
            mixedSources?: { jpeg?: Array<{ url?: string }> };
          };
          if (
            mixedSources &&
            typeof mixedSources === "object" &&
            "jpeg" in mixedSources
          ) {
            const { jpeg } = mixedSources;
            if (Array.isArray(jpeg) && jpeg.length > 0) {
              const lastJpeg = jpeg[jpeg.length - 1];
              if (
                lastJpeg &&
                typeof lastJpeg === "object" &&
                "url" in lastJpeg
              ) {
                return lastJpeg.url;
              }
            }
          }
        }
        return null;
      })
      .filter((url): url is string => url !== null);
  }

  return [];
}
