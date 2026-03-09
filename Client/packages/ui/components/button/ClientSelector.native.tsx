import React, { useCallback, useState } from "react";

import Button from "@ui/button/Button";
import { Pressable } from "react-native";

import { useLocalization } from "packages/contexts";
import { useAgentClients } from "packages/features/agent/hooks/data/useAgentClients";
import { useIsAgent } from "packages/features/homeauth/hooks/store/useIsAgent";
import BaseModal from "packages/ui/components/modals/BaseModal";
import { Box } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";

type ClientSelectorNativeProps = {
  selectedClientId: string | null;
  onClientChange: (clientId: string | null) => void;
  className?: string;
};

export default function ClientSelectorNative({
  selectedClientId,
  onClientChange,
}: ClientSelectorNativeProps) {
  const { clients, isLoading } = useAgentClients();
  const isAgent = useIsAgent();
  const { t } = useLocalization();
  const [isOpen, setIsOpen] = useState(false);

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
      ? t("client_selector.me")
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
        <Text className="text-sm font-medium text-gray-700">{displayLabel}</Text>
        <Text className="text-sm text-gray-500">▼</Text>
      </Button>

      <BaseModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={t("client_selector.select_client", { defaultValue: "Select client" })}
      >
        <Box className="gap-2">
          <Pressable
            onPress={() => handleSelect(null)}
            className={`rounded-lg border px-4 py-3 ${
              selectedClientId === null
                ? "border-brand-accent bg-brand-accent/10"
                : "border-gray-200 bg-white"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                selectedClientId === null ? "text-brand-accent" : "text-gray-700"
              }`}
            >
              {t("client_selector.me")}
            </Text>
          </Pressable>

          {isLoading ? (
            <Text className="px-4 py-2 text-sm text-gray-500">
              {t("client_selector.loading_clients")}
            </Text>
          ) : clients.length === 0 ? (
            <Text className="px-4 py-2 text-sm text-gray-500">
              {t("client_selector.no_clients_found")}
            </Text>
          ) : (
            clients.map((client) => (
              <Pressable
                key={client.id}
                onPress={() => handleSelect(client.id)}
                className={`rounded-lg border px-4 py-3 ${
                  selectedClientId === client.id
                    ? "border-brand-accent bg-brand-accent/10"
                    : "border-gray-200 bg-white"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    selectedClientId === client.id ? "text-brand-accent" : "text-gray-700"
                  }`}
                >
                  {client.name}
                </Text>
                {client.email ? (
                  <Text className="mt-0.5 text-xs text-gray-500">{client.email}</Text>
                ) : null}
              </Pressable>
            ))
          )}
        </Box>
      </BaseModal>
    </Box>
  );
}
