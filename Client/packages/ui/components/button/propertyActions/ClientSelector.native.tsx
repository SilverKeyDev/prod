import React, { useCallback, useState } from "react";

import Button from "@ui/button/Button";
import { Icon } from "@ui/icons";
import { Pressable } from "react-native";

import { useLocalization } from "packages/contexts";
import { useAgentClients } from "packages/features/agent/hooks/data/clients/useAgentClients";
import { useIsAgent } from "packages/hooks/store";
import { useAuthStore } from "packages/store";
import BaseModal from "packages/ui/components/modals/BaseModal";
import { Box } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";

type ClientSelectorNativeProps = {
  selectedClientId: string | null;
  onClientChange: (clientId: string | null) => void;
  className?: string;
  /** When true, omits the "Me" row so agents only pick among clients (e.g. client hub). */
  hideMeOption?: boolean;
};

export default function ClientSelectorNative({
  selectedClientId,
  onClientChange,
  hideMeOption = false,
}: ClientSelectorNativeProps) {
  const { clients, isLoading } = useAgentClients();
  const authReady = useAuthStore((s) => s.authReady);
  const isAgent = useIsAgent();
  const { t } = useLocalization();
  const [isOpen, setIsOpen] = useState(false);
  const isClientListLoading = !authReady || isLoading;

  const handleSelect = useCallback(
    (clientId: string | null) => {
      onClientChange(clientId);
      setIsOpen(false);
    },
    [onClientChange]
  );

  if (!isAgent) return null;

  const displayLabel =
    selectedClientId === null
      ? hideMeOption
        ? t("client_selector.select_client")
        : t("client_selector.me")
      : (clients.find((c) => c.id === selectedClientId)?.name ??
        t("client_selector.select_client"));

  return (
    <Box>
      <Button
        variant="outline"
        size="md"
        onPress={() => setIsOpen(true)}
        className="flex-row items-center gap-2"
      >
        <Text className="text-text-primary text-sm font-medium">{displayLabel}</Text>
        <Text className="text-text-secondary text-sm">▼</Text>
      </Button>

      <BaseModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={t("client_selector.select_client", {
          defaultValue: "Select client",
        })}
      >
        <Box className="gap-2">
          {!hideMeOption ? (
            <Pressable
              onPress={() => handleSelect(null)}
              className={`rounded-lg border px-4 py-3 ${
                selectedClientId === null
                  ? "border-border bg-primary-muted"
                  : "border-border bg-background-surface"
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  selectedClientId === null ? "text-primary" : "text-text-primary"
                }`}
              >
                {t("client_selector.me")}
              </Text>
            </Pressable>
          ) : null}

          {isClientListLoading ? (
            <Text className="text-text-secondary px-4 py-2 text-sm">
              {t("client_selector.loading_clients", {
                defaultValue: "Loading clients...",
              })}
            </Text>
          ) : clients.length === 0 ? (
            <Box className="flex flex-row items-start gap-3 px-2 py-2">
              <Icon name="users" className="text-text-secondary mt-0.5 h-5 w-5 shrink-0" />
              <Box className="flex min-w-0 flex-1 flex-col gap-1">
                <Text className="text-text-primary text-sm font-medium">
                  {t("client_selector.no_clients_found", {
                    defaultValue: "No clients found",
                  })}
                </Text>
                <Text className="text-text-secondary text-xs">
                  {t("client_selector.no_clients_hint", {
                    defaultValue:
                      "Clients you work with will appear here once they are added to your workspace.",
                  })}
                </Text>
              </Box>
            </Box>
          ) : (
            clients.map((client) => (
              <Pressable
                key={client.id}
                onPress={() => handleSelect(client.id)}
                className={`rounded-lg border px-4 py-3 ${
                  selectedClientId === client.id
                    ? "border-border bg-primary-muted"
                    : "border-border bg-background-surface"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    selectedClientId === client.id ? "text-primary" : "text-text-primary"
                  }`}
                >
                  {client.name}
                </Text>
                {client.email ? (
                  <Text className="text-text-secondary mt-0.5 text-xs">{client.email}</Text>
                ) : null}
              </Pressable>
            ))
          )}
        </Box>
      </BaseModal>
    </Box>
  );
}
