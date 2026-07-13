import { Icon } from "@ui/icons";
import BodyText from "@ui/text/BodyText";

import { useLocalization } from "packages/contexts";
import { useIsAgent } from "packages/hooks/store";
import { useAuthStore } from "packages/store";
import Button from "packages/ui/components/actions/button/core/Button";
import { Box } from "packages/ui/components/structure/primitives";
import Popover from "packages/ui/components/surfaces/popover/Popover";
import { HEADER_ROW_CONTROL_HEIGHT } from "packages/ui/constants/layout";

import { useAgentClients } from "@/features/agent/hooks/data/clients/useAgentClients";
type ClientSelectorProps = {
  selectedClientId: string | null;
  onClientChange: (clientId: string | null) => void;
  className?: string;
  /** When true, omits the "Me" row so agents only pick among clients (e.g. client hub). */
  hideMeOption?: boolean;
  /** Use `"above"` when the trigger sits on a fixed bottom bar so the menu opens into the viewport. */
  menuPlacement?: "below" | "above";
};
export default function ClientSelector({
  selectedClientId,
  onClientChange,
  className = "",
  hideMeOption = false,
  menuPlacement = "below",
}: ClientSelectorProps) {
  const { clients, isLoading } = useAgentClients();
  const authReady = useAuthStore((s) => s.authReady);
  const isAgent = useIsAgent();
  const { t } = useLocalization();
  const isClientListLoading = !authReady || isLoading;
  // Don't show if user is not an agent
  if (!isAgent) {
    return null;
  }
  const triggerLabel =
    selectedClientId === null
      ? hideMeOption
        ? t("client_selector.select_client")
        : t("client_selector.me")
      : clients.find((c) => c.id === selectedClientId)?.name ||
        t("client_selector.select_client");
  // Render the menu in a portal so it is not clipped by scrolling/overflow ancestors
  // (e.g. the horizontally scrollable library toolbar on mobile).
  return (
    <Popover
      usePortal
      side={menuPlacement === "above" ? "top" : "bottom"}
      className={className}
      triggerWrapperClassName="w-full"
      panelClassName="w-60 min-w-56 py-1"
      panelMaxHeight="min(60vh, 420px)"
      label={t("client_selector.select_client", {
        defaultValue: "Select client",
      })}
      trigger={({ open, onToggle }) => (
        <Button
          type="button"
          variant="outline"
          contentAlign="start"
          label={triggerLabel}
          onClick={onToggle}
          aria-haspopup="true"
          aria-expanded={open}
          className={`focus:border-input-variant-focus-border border-border bg-background-surface text-text-primary flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 ${HEADER_ROW_CONTROL_HEIGHT}`}
          icon={<Icon name="user" className="h-4 w-4 shrink-0" />}
        >
          <>
            <BodyText as="span">{triggerLabel}</BodyText>
            <Icon
              name="chevron-down"
              className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </>
        </Button>
      )}
    >
      {({ onClose }) => {
        const handleSelect = (clientId: string | null) => {
          onClientChange(clientId);
          onClose();
        };
        return (
          <Box className="flex flex-col gap-1 px-1">
            {!hideMeOption ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  contentAlign="start"
                  rounded="md"
                  onClick={() => handleSelect(null)}
                  className={`w-full px-3 py-3 text-left text-sm hover:bg-neutral-100 ${
                    selectedClientId === null
                      ? "bg-primary-muted text-primary font-medium"
                      : "text-text-primary"
                  }`}
                  icon={<Icon name="user" className="h-4 w-4 shrink-0" />}
                >
                  <BodyText as="span" className="text-left">
                    {t("client_selector.me")}
                  </BodyText>
                </Button>
                {clients.length > 0 ? (
                  <Box className="border-border mx-1 my-1 border-t" />
                ) : null}
              </>
            ) : null}

            {/* Client options */}
            {isClientListLoading ? (
              <Box className="text-text-secondary px-3 py-3 text-left text-sm">
                {t("client_selector.loading_clients", {
                  defaultValue: "Loading clients...",
                })}
              </Box>
            ) : clients.length === 0 ? (
              <Box className="flex items-start gap-3 px-3 py-3">
                <Icon
                  name="users"
                  className="text-text-secondary mt-0.5 h-5 w-5 shrink-0"
                />
                <Box className="flex min-w-0 flex-col gap-1">
                  <BodyText as="span" size="sm" muted className="text-left">
                    {t("client_selector.no_clients_found", {
                      defaultValue: "No clients found",
                    })}
                  </BodyText>
                  <BodyText as="span" size="xs" muted className="text-left">
                    {t("client_selector.no_clients_hint", {
                      defaultValue:
                        "Clients you work with will appear here once they are added to your workspace.",
                    })}
                  </BodyText>
                </Box>
              </Box>
            ) : (
              clients.map((client) => (
                <Button
                  key={client.id}
                  type="button"
                  variant="ghost"
                  contentAlign="start"
                  rounded="md"
                  onClick={() => handleSelect(client.id)}
                  className={`w-full px-3 py-3 text-left text-sm hover:bg-neutral-100 ${
                    selectedClientId === client.id
                      ? "bg-primary-muted text-primary font-medium"
                      : "text-text-primary"
                  }`}
                  icon={<Icon name="user" className="h-4 w-4 shrink-0" />}
                >
                  <Box className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left">
                    <BodyText as="span" className="w-full truncate text-left">
                      {client.name}
                    </BodyText>
                    {client.email && (
                      <BodyText
                        as="span"
                        size="xs"
                        muted
                        className="w-full truncate text-left"
                      >
                        {client.email}
                      </BodyText>
                    )}
                  </Box>
                </Button>
              ))
            )}
          </Box>
        );
      }}
    </Popover>
  );
}
