/**
 * Renders styled inline cards for DocuSign agreement lifecycle events
 * within the messaging thread (parsed from __AGREEMENT_EVENT__ messages).
 */

import { Icon } from "@ui/icons";

import type { AgreementEventPayload } from "packages/features/messaging/utils/agreementEventPayload";
import { Box } from "packages/ui/components/primitives";

import { BodyText, Button } from "@/components/ui";

const EVENT_CONFIG: Record<
  AgreementEventPayload["event"],
  {
    iconName: string;
    iconColor: string;
    borderColor: string;
    bgColor: string;
    headline: string;
  }
> = {
  sent: {
    iconName: "send",
    iconColor: "text-blue-600",
    borderColor: "border-blue-200",
    bgColor: "bg-blue-50",
    headline: "Document sent for signature",
  },
  client_signed: {
    iconName: "file-signature",
    iconColor: "text-amber-600",
    borderColor: "border-amber-200",
    bgColor: "bg-amber-50",
    headline: "Client signed the document",
  },
  agent_signed: {
    iconName: "file-signature",
    iconColor: "text-indigo-600",
    borderColor: "border-indigo-200",
    bgColor: "bg-indigo-50",
    headline: "Agent countersigned the document",
  },
  completed: {
    iconName: "check",
    iconColor: "text-green-600",
    borderColor: "border-green-200",
    bgColor: "bg-green-50",
    headline: "All parties have signed",
  },
};

type AgreementEventCardProps = {
  payload: AgreementEventPayload;
  onSignNow?: (agreementId: string) => void;
  onViewDocument?: (agreementId: string) => void;
  isAgent?: boolean;
};

export default function AgreementEventCard({
  payload,
  onSignNow,
  onViewDocument,
  isAgent = false,
}: AgreementEventCardProps) {
  const config = EVENT_CONFIG[payload.event] ?? EVENT_CONFIG.sent;

  const showSignNow =
    (payload.event === "client_signed" && isAgent) ||
    (payload.event === "sent" && !isAgent);

  const showViewSigned = payload.event === "completed";

  return (
    <Box
      className={`rounded-lg border ${config.borderColor} ${config.bgColor} p-3`}
    >
      <Box className="flex items-start gap-2.5">
        <Box
          className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white ${config.borderColor} border`}
        >
          <Icon name={config.iconName} size={14} className={config.iconColor} />
        </Box>
        <Box className="min-w-0 flex-1">
          <BodyText size="sm" className="font-semibold text-gray-900">
            {config.headline}
          </BodyText>
          <BodyText size="xs" className="mt-0.5 text-gray-600">
            {payload.title}
          </BodyText>

          {showSignNow && onSignNow && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onSignNow(payload.agreement_id)}
              className="mt-2 bg-amber-600 hover:bg-amber-700"
            >
              Sign Now
            </Button>
          )}

          {showViewSigned && onViewDocument && (
            <Button
              variant="success"
              size="sm"
              onClick={() => onViewDocument(payload.agreement_id)}
              className="mt-2"
            >
              View Signed Document
            </Button>
          )}

          {payload.event === "client_signed" && !isAgent && (
            <Box className="mt-1.5 flex items-center gap-1">
              <Icon name="clock" size={12} className="text-gray-400" />
              <BodyText size="xs" className="text-gray-500">
                Waiting for agent review
              </BodyText>
            </Box>
          )}

          {payload.event === "sent" && isAgent && (
            <Box className="mt-1.5 flex items-center gap-1">
              <Icon name="clock" size={12} className="text-gray-400" />
              <BodyText size="xs" className="text-gray-500">
                Waiting for client signature
              </BodyText>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
