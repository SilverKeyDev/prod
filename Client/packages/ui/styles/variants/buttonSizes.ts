/**
 * Web fallback — no inline size overrides; CVA classes handle sizing.
 * Native uses buttonSizes.native.ts via platform resolution.
 */
export const buttonNativeSizes = {} as Record<
  string,
  { paddingHorizontal: number; paddingVertical: number; minHeight: number }
>;
