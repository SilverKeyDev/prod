import { useMutation } from "@tanstack/react-query";

import { adminApi, type DevAccountSessionRole } from "packages/features/admin/api/admin";
import { getWindow } from "packages/utils/platform";

export function buildDevSessionUrl(token: string): string {
  return `/dev/session?t=${encodeURIComponent(token)}`;
}

export function useOpenDevAccountSessionMutation() {
  return useMutation({
    mutationFn: async (workspace: DevAccountSessionRole) => {
      const result = await adminApi.mintDevAccountSession({ workspace });
      const url = buildDevSessionUrl(result.token);
      const win = getWindow();
      win?.open(url, "_blank", "noopener,noreferrer");
      return { ...result, url };
    },
  });
}
