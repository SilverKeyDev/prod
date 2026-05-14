/**
 * Rolldown manualChunks: vendor split + keep router-critical code in main bundle.
 * @param {string} id
 * @returns {string | undefined}
 */
export function webManualChunks(id) {
  if (id.includes("node_modules")) {
    if (id.includes("react-router")) {
      return undefined;
    }
    return "vendor";
  }
  if (
    id.includes("app/routes") &&
    (id.includes("routes.tsx") || id.includes("StoreIntegrations"))
  ) {
    return undefined;
  }
  if (id.includes("packages/hooks") && id.includes("useDataPolling")) {
    return undefined;
  }
}
