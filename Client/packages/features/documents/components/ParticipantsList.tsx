import { Icon } from "@ui/icons";

import { Box } from "packages/ui/components/primitives";

import { BodyText } from "@/components/ui";
import { getAgreementStatusIcon } from "@/features/documents/components/agreementsIcons";
import type { AgreementParticipant } from "@/features/documents/types/agreements";
import {
  formatAgreementDateTime,
  formatParticipantRole,
  getParticipantStatusColor,
} from "@/features/documents/utils/agreements";
type ParticipantsListProps = {
  participants: AgreementParticipant[];
  showOrder?: boolean;
  compact?: boolean;
};
/**
 * ParticipantsList Component
 *
 * Displays list of agreement participants with their signing status
 * Shows role, status, signing order, and timestamps
 */
export default function ParticipantsList({
  participants,
  showOrder = true,
  compact = false,
}: ParticipantsListProps) {
  if (!participants || participants.length === 0) {
    return (
      <Box className="py-4 text-center">
        <BodyText className="text-center" size="sm" muted>
          No participants added yet
        </BodyText>
      </Box>
    );
  }
  // Sort by signing order
  const sortedParticipants = [...participants].sort((a, b) => a.signing_order - b.signing_order);
  return (
    <Box className={`flex flex-col ${compact ? "gap-2" : "gap-3"}`}>
      {sortedParticipants.map((participant) => {
        const StatusIcon = getAgreementStatusIcon(participant.status);
        const statusColor = getParticipantStatusColor(participant.status);
        return (
          <Box
            key={participant.id}
            className={`flex flex-row items-start gap-3 ${compact ? "p-2" : "p-3"} border-border hover:bg-background-base active:bg-primary-muted active:bg-background-base rounded-lg border`}
          >
            {/* Avatar */}
            <Box className="bg-primary-muted flex h-10 w-10 flex-shrink-0 flex-row items-center justify-center rounded-full">
              <Icon name="user" className="text-text-secondary h-5 w-5" />
            </Box>

            {/* Participant Info */}
            <Box className="min-w-0 flex-1">
              <Box className="flex flex-row items-start justify-between gap-2">
                <Box className="min-w-0 flex-1">
                  <Box className="flex flex-row items-center gap-2">
                    <BodyText
                      as="p"
                      className={`font-medium ${compact ? "text-sm" : "text-base"} text-text-primary truncate`}
                    >
                      {participant.name}
                    </BodyText>
                    {showOrder && (
                      <BodyText
                        as="span"
                        size="xs"
                        className="bg-primary-muted text-text-secondary flex-shrink-0 rounded px-1.5 py-0.5 font-medium"
                      >
                        #{participant.signing_order}
                      </BodyText>
                    )}
                  </Box>
                  <BodyText as="p" size="xs" className="text-text-secondary truncate">
                    {participant.email}
                  </BodyText>
                  <BodyText as="p" size="xs" className="text-text-secondary mt-0.5">
                    {formatParticipantRole(participant.role)}
                  </BodyText>
                </Box>

                {/* Status */}
                <Box className="flex flex-shrink-0 flex-row items-center gap-1.5">
                  <StatusIcon className={`h-4 w-4 ${statusColor}`} />
                  <BodyText as="span" size="sm" className={`font-medium ${statusColor}`}>
                    {participant.status.charAt(0).toUpperCase() + participant.status.slice(1)}
                  </BodyText>
                </Box>
              </Box>

              {/* Additional Info */}
              {!compact && (
                <Box className="mt-2 flex flex-col gap-1">
                  {participant.signed_at && (
                    <BodyText as="p" size="xs" className="text-text-secondary">
                      Signed: {formatAgreementDateTime(participant.signed_at)}
                    </BodyText>
                  )}
                  {participant.declined_reason && (
                    <BodyText as="p" size="xs" className="text-red-600">
                      Declined: {participant.declined_reason}
                    </BodyText>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
