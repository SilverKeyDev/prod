import { useLocalization } from "packages/contexts";
import StatusBadge from "packages/ui/components/asset/StatusBadge";

import type { AgentConnectionDisplayStatus } from "@/features/agent/utils/connectionRequestStatus";

export type AgentConnectionStatusBadgeProps = {
  status: AgentConnectionDisplayStatus;
  className?: string;
};

export function AgentConnectionStatusBadge({
  status,
  className = "",
}: AgentConnectionStatusBadgeProps) {
  const { t } = useLocalization();

  if (status === "none") {
    return null;
  }

  const config =
    status === "pending"
      ? {
          text: t("agent.connection_status.waiting"),
          variant: "warning" as const,
        }
      : status === "accepted"
        ? {
            text: t("agent.connection_status.accepted"),
            variant: "success" as const,
          }
        : {
            text: t("agent.connection_status.declined"),
            variant: "error" as const,
          };

  return (
    <StatusBadge text={config.text} variant={config.variant} size="xs" className={className} />
  );
}
