import { useState } from "react";

import { Icon } from "@ui/icons";
import BodyText from "@ui/text/BodyText";

import { useLocalization } from "packages/contexts";
import { HEADER_ROW_HEIGHT } from "packages/ui/constants/layout";

import { useAgentClients } from "@/features/agent/hooks/data/useAgentClients";
import { useIsAgent } from "@/features/homeauth/hooks/store/useIsAgent";

import Button from "./Button";
type ClientSelectorProps = {
  selectedClientId: string | null;
  onClientChange: (clientId: string | null) => void;
  className?: string;
};
export default function ClientSelector({
  selectedClientId,
  onClientChange,
  className = "",
}: ClientSelectorProps) {
  const { clients, isLoading } = useAgentClients();
  const [isOpen, setIsOpen] = useState(false);
  const isAgent = useIsAgent();
  const { t } = useLocalization();
  // Don't show if user is not an agent
  if (!isAgent) {
    return null;
  }
  const handleSelect = (clientId: string | null) => {
    onClientChange(clientId);
    setIsOpen(false);
  };
  return (
    <div className={`relative ${className}`}>
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={`focus:ring-accent-muted focus:border-primary border-border bg-background-surface text-text-primary hover:bg-accent-muted flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 ${HEADER_ROW_HEIGHT}`}
        icon={<Icon name="user" className="h-4 w-4" />}
      >
        <>
          <BodyText as="span">
            {selectedClientId === null
              ? t("client_selector.me")
              : clients.find((c) => c.id === selectedClientId)?.name ||
                t("client_selector.select_client")}
          </BodyText>
          <Icon
            name="chevron-down"
            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </>
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            role="button"
            tabIndex={0}
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsOpen(false);
              }
            }}
          />

          {/* Dropdown */}
          <div className="border-border bg-background-surface absolute z-20 mt-1 w-56 rounded-md border shadow-lg">
            <div className="py-1">
              {/* "Me" option */}
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleSelect(null)}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 ${selectedClientId === null ? "bg-primary-muted text-primary font-medium" : "text-text-primary"}`}
                icon={<Icon name="user" className="h-4 w-4" />}
              >
                <BodyText as="span">{t("client_selector.me")}</BodyText>
              </Button>

              {/* Divider */}
              {clients.length > 0 && <div className="border-border my-1 border-t" />}

              {/* Client options */}
              {isLoading ? (
                <div className="text-text-secondary px-4 py-2 text-sm">
                  {t("client_selector.loading_clients")}
                </div>
              ) : clients.length === 0 ? (
                <div className="text-text-secondary px-4 py-2 text-sm">
                  {t("client_selector.no_clients_found")}
                </div>
              ) : (
                clients.map((client) => (
                  <Button
                    key={client.id}
                    type="button"
                    variant="ghost"
                    onClick={() => handleSelect(client.id)}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 ${
                      selectedClientId === client.id
                        ? "bg-primary-muted text-primary font-medium"
                        : "text-text-primary"
                    }`}
                    icon={<Icon name="user" className="h-4 w-4" />}
                  >
                    <div className="flex flex-col">
                      <BodyText as="span">{client.name}</BodyText>
                      {client.email && (
                        <BodyText as="span" className="text-text-secondary text-xs">
                          {client.email}
                        </BodyText>
                      )}
                    </div>
                  </Button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
