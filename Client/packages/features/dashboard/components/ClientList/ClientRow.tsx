import React from "react";

import { Icon } from "@ui/icons";

import type { ClientDealInfo } from "packages/schemas/agent";
import { Box } from "packages/ui/components/primitives";
import { dateNow, dateParseISO } from "packages/utils/date";

import Card from "@/components/layout/Card.web";
import { BodyText, Title } from "@/components/ui";
import ActionButton from "@/features/dashboard/components/ActionButton";
import DealStageBadge from "@/features/dashboard/components/DealStageBadge";
import RiskFlag from "@/features/dashboard/components/RiskFlag";
type ClientRowProps = {
  client: ClientDealInfo;
  onClick: () => void;
};
const ClientRow: React.FC<ClientRowProps> = ({ client, onClick }) => {
  const formatTimeSince = (dateString?: string) => {
    if (!dateString) return "No recent activity";
    const now = dateNow();
    const date = dateParseISO(dateString);
    const diff = now.valueOf() - date.valueOf();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) {
      return `${days} day${days > 1 ? "s" : ""} ago`;
    }
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    }
    return "Just now";
  };
  return (
    <Card onClick={onClick} hover={true} className="cursor-pointer transition-all">
      <Box className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Avatar and Name */}
        <Box className="flex flex-shrink-0 items-center gap-3">
          <Box className="bg-primary flex h-10 w-10 items-center justify-center rounded-full sm:h-12 sm:w-12">
            <Icon name="user" className="text-primary h-5 w-5 sm:h-6 sm:w-6" />
          </Box>
          <Box>
            <Title as="h3" size="md" className="text-text-primary font-semibold">
              {client.name}
            </Title>
            <BodyText as="p" size="sm" className="text-text-secondary">
              {client.email}
            </BodyText>
          </Box>
        </Box>

        {/* Deal Stage */}
        <Box className="flex-shrink-0">
          <DealStageBadge stage={client.deal_stage} />
        </Box>

        {/* Next Action */}
        {client.next_action && (
          <Box className="min-w-0 flex-1">
            <ActionButton
              action={client.next_action}
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              variant="primary"
              className="w-full sm:w-auto"
            />
          </Box>
        )}

        {/* Time Since Last Action */}
        <Box className="text-responsive-sm text-text-secondary flex items-center gap-2">
          <Icon name="clock" className="h-4 w-4 sm:h-5 sm:w-5" />
          <BodyText as="span" size="sm" className="text-text-secondary">
            {formatTimeSince(client.last_agent_action)}
          </BodyText>
        </Box>

        {/* Risk Flags */}
        {client.risk_flags.length > 0 && (
          <Box className="flex flex-wrap gap-2">
            {client.risk_flags.slice(0, 2).map((flag, index) => (
              <RiskFlag key={index} severity={flag.severity} message={flag.type} />
            ))}
            {client.risk_flags.length > 2 && (
              <BodyText as="span" size="sm" className="text-text-secondary text-xs sm:text-sm">
                +{client.risk_flags.length - 2} more
              </BodyText>
            )}
          </Box>
        )}
      </Box>
    </Card>
  );
};
export default ClientRow;
