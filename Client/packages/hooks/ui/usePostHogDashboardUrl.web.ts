import { useMemo } from "react";

import { resolvePostHogAppUrl } from "packages/services/analytics";

export function usePostHogDashboardUrl(): string | null {
  return useMemo(() => resolvePostHogAppUrl(), []);
}
