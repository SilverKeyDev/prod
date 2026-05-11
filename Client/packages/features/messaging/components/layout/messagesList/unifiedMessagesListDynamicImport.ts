/**
 * Single shared Promise for UnifiedMessagesList so prefetch + React.lazy() reuse
 * the same import() (see dashboardFeatureDynamicImports pattern).
 */
let unifiedMessagesListModulePromise: Promise<typeof import("./UnifiedMessagesList")> | null = null;

export function loadUnifiedMessagesListModule(): Promise<typeof import("./UnifiedMessagesList")> {
  unifiedMessagesListModulePromise ??= import("./UnifiedMessagesList");
  return unifiedMessagesListModulePromise;
}
