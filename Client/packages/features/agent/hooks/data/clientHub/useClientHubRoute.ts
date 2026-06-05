import { useCallback, useEffect, useMemo } from "react";

import type { AgentClient } from "packages/api";
import { useNavigation } from "packages/navigation";
import { stripWorkspaceShellPrefix } from "packages/utils/core/layout/dashboardLayoutConfig";
import {
  buildClientHubPath,
  parseClientHubPathname,
  resolveClientHubRouteClientId,
} from "packages/utils/product/dashboard";

export type UseClientHubRouteParams = {
  clientIdProp?: string;
  clients: AgentClient[];
};

export function useClientHubRoute({ clientIdProp, clients }: UseClientHubRouteParams) {
  const { navigateToPath, getCurrentRoute } = useNavigation();
  const { pathname: rawPathname } = getCurrentRoute();
  const pathname = stripWorkspaceShellPrefix(rawPathname);

  const parsedHubPath = useMemo(() => parseClientHubPathname(pathname), [pathname]);

  const resolvedClientId = useMemo(() => {
    const fromProp = clientIdProp?.trim();
    if (fromProp) return fromProp;
    if (!parsedHubPath) return null;
    return resolveClientHubRouteClientId(clients, parsedHubPath);
  }, [clientIdProp, parsedHubPath, clients]);

  useEffect(() => {
    if (!parsedHubPath || !resolvedClientId) return;
    const client = clients.find((row) => row.id === resolvedClientId);
    if (!client) return;
    const target = buildClientHubPath(client.id, client.name);
    if (pathname !== target) {
      navigateToPath(target, { replace: true });
    }
  }, [clients, navigateToPath, parsedHubPath, pathname, resolvedClientId]);

  const handleHubClientChange = useCallback(
    (nextId: string | null) => {
      if (nextId !== null) {
        const nextClient = clients.find((row) => row.id === nextId);
        if (nextClient) {
          navigateToPath(buildClientHubPath(nextClient.id, nextClient.name));
        }
      } else {
        navigateToPath("/dashboard");
      }
    },
    [clients, navigateToPath]
  );

  const navigateToDashboard = useCallback(() => {
    navigateToPath("/dashboard");
  }, [navigateToPath]);

  return {
    pathname,
    parsedHubPath,
    resolvedClientId,
    handleHubClientChange,
    navigateToDashboard,
  };
}
