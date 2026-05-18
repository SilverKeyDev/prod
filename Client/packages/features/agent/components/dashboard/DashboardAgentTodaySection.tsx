import React, { useMemo, useState } from "react";

import ClientList from "packages/features/agent/components/clientList/ClientList";
import { useNavigation } from "packages/navigation";
import { Box, Pressable, Text } from "packages/ui/components/primitives";
import { buildClientHubPath } from "packages/utils/dashboard";

import { useAgentClients } from "@/features/agent/hooks/data/clients/useAgentClients";
import { useAgentDashboardMockData } from "@/features/agent/hooks/data/clients/useAgentDashboardMockData";

export function DashboardAgentTodaySection() {
  const { navigateToPath } = useNavigation();
  const { clients } = useAgentClients();
  const { generateMockAlerts } = useAgentDashboardMockData();
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);

  const alerts = useMemo(() => generateMockAlerts(clients), [clients, generateMockAlerts]);

  const visibleAlerts = useMemo(
    () => alerts.filter((alert) => !dismissedAlertIds.includes(alert.id)),
    [alerts, dismissedAlertIds]
  );

  const navigateToClientHub = (clientId: string) => {
    const client = clients.find((row) => row.id === clientId);
    if (client) {
      navigateToPath(buildClientHubPath(client.id, client.name));
      return;
    }
    navigateToPath(buildClientHubPath(clientId, "client"));
  };

  return (
    <Box className="gap-3">
      <Text className="text-text-primary text-lg font-medium">Today</Text>

      <ClientList
        onClientClick={(client) => navigateToPath(buildClientHubPath(client.id, client.name))}
      />

      <Box className="bg-background-surface mt-2 gap-2 rounded-lg p-3 shadow-sm">
        <Text className="text-text-primary text-sm font-semibold">Urgent alerts</Text>
        {visibleAlerts.length === 0 ? (
          <Text className="text-text-secondary mt-1 text-xs">No urgent alerts right now.</Text>
        ) : (
          <Box className="gap-2">
            {visibleAlerts.map((alert) => (
              <Box
                key={alert.id}
                className="border-border bg-primary-muted flex-row items-start justify-between gap-3 rounded-lg border px-3 py-2"
              >
                <Box className="flex-1">
                  <Text className="text-destructive text-xs font-semibold">{alert.message}</Text>
                  {alert.client_id ? (
                    <Pressable
                      onPress={() => {
                        navigateToClientHub(alert.client_id);
                      }}
                      className="mt-1"
                    >
                      <Text className="text-primary text-xs font-medium">View client →</Text>
                    </Pressable>
                  ) : null}
                </Box>
                <Pressable
                  onPress={() =>
                    setDismissedAlertIds((prev) =>
                      prev.includes(alert.id) ? prev : [...prev, alert.id]
                    )
                  }
                  className="mt-0.5 rounded-full px-2 py-1"
                >
                  <Text className="text-text-secondary text-xs font-medium">Dismiss</Text>
                </Pressable>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
