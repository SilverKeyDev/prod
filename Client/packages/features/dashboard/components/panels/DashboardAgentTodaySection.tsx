import React, { useMemo, useState } from "react";

import ClientList from "packages/features/dashboard/components/ClientList/ClientList";
import { useNavigation } from "packages/navigation";
import type { UrgentAlert } from "packages/types/domain/ui";
import { Box, Pressable, Text } from "packages/ui/components/primitives";

export type DashboardAgentTodaySectionProps = {
  alerts: UrgentAlert[];
};

export function DashboardAgentTodaySection({ alerts }: DashboardAgentTodaySectionProps) {
  const { navigateToPath } = useNavigation();
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);

  const visibleAlerts = useMemo(
    () => alerts.filter((alert) => !dismissedAlertIds.includes(alert.id)),
    [alerts, dismissedAlertIds]
  );

  const handleClientClick = (clientId: string) => {
    navigateToPath(`/dashboard/client/${clientId}`);
  };

  return (
    <Box className="gap-3">
      <Text className="text-text-primary text-lg font-medium">Today</Text>

      <ClientList onClientClick={handleClientClick} />

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
                        navigateToPath(`/dashboard/client/${alert.client_id}`);
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
