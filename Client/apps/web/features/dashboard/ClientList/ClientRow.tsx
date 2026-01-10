import React from "react";
import { Clock, User } from "lucide-react";
import Card from "../../../components/layout/Card";
import DealStageBadge from "../components/DealStageBadge";
import RiskFlag from "../components/RiskFlag";
import ActionButton from "../components/ActionButton";
import type { ClientDealInfo } from "../../../../../packages/schemas/agent";

type ClientRowProps = {
  client: ClientDealInfo;
  onClick: () => void;
};

const ClientRow: React.FC<ClientRowProps> = ({ client, onClick }) => {
  const formatTimeSince = (dateString?: string) => {
    if (!dateString) return "No recent activity";
    const now = new Date();
    const date = new Date(dateString);
    const diff = now.getTime() - date.getTime();
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
    <Card
      onClick={onClick}
      hover={true}
      className="cursor-pointer transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Avatar and Name */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-olive/10 flex items-center justify-center">
            <User className="h-5 w-5 sm:h-6 sm:w-6 text-olive" />
          </div>
          <div>
            <h3 className="text-responsive-base font-semibold text-navy">
              {client.name}
            </h3>
            <p className="text-responsive-sm text-black/60">{client.email}</p>
          </div>
        </div>

        {/* Deal Stage */}
        <div className="flex-shrink-0">
          <DealStageBadge stage={client.deal_stage} />
        </div>

        {/* Next Action */}
        {client.next_action && (
          <div className="flex-1 min-w-0">
            <ActionButton
              action={client.next_action}
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              variant="primary"
              className="w-full sm:w-auto"
            />
          </div>
        )}

        {/* Time Since Last Action */}
        <div className="flex items-center gap-2 text-responsive-sm text-black/60">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
          <span>{formatTimeSince(client.last_agent_action)}</span>
        </div>

        {/* Risk Flags */}
        {client.risk_flags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {client.risk_flags.slice(0, 2).map((flag, index) => (
              <RiskFlag
                key={index}
                severity={flag.severity}
                message={flag.type}
              />
            ))}
            {client.risk_flags.length > 2 && (
              <span className="text-xs sm:text-sm text-black/60">
                +{client.risk_flags.length - 2} more
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default ClientRow;
