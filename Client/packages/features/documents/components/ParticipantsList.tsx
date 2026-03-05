import { Icon } from "@ui/icons";

import { BodyText } from "packages/ui/components/index.web";

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
      <div className="py-4 text-center">
        <BodyText size="sm" muted>
          No participants added yet
        </BodyText>
      </div>
    );
  }
  // Sort by signing order
  const sortedParticipants = [...participants].sort((a, b) => a.signing_order - b.signing_order);
  return (
    <div className={`space-y-${compact ? "2" : "3"}`}>
      {sortedParticipants.map((participant) => {
        const StatusIcon = getAgreementStatusIcon(participant.status);
        const statusColor = getParticipantStatusColor(participant.status);
        return (
          <div
            key={participant.id}
            className={`flex items-start gap-3 ${compact ? "p-2" : "p-3"} rounded-lg border border-gray-200 hover:bg-gray-50`}
          >
            {/* Avatar */}
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-200">
              <Icon name="user" className="h-5 w-5 text-gray-600" />
            </div>

            {/* Participant Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <BodyText
                      as="p"
                      className={`font-medium ${compact ? "text-sm" : "text-base"} truncate text-gray-900`}
                    >
                      {participant.name}
                    </BodyText>
                    {showOrder && (
                      <BodyText
                        as="span"
                        size="xs"
                        className="flex-shrink-0 rounded bg-gray-100 px-1.5 py-0.5 font-medium text-gray-600"
                      >
                        #{participant.signing_order}
                      </BodyText>
                    )}
                  </div>
                  <BodyText as="p" size="xs" className="truncate text-gray-500">
                    {participant.email}
                  </BodyText>
                  <BodyText as="p" size="xs" className="mt-0.5 text-gray-600">
                    {formatParticipantRole(participant.role)}
                  </BodyText>
                </div>

                {/* Status */}
                <div className="flex flex-shrink-0 items-center gap-1.5">
                  <StatusIcon className={`h-4 w-4 ${statusColor}`} />
                  <BodyText as="span" size="sm" className={`font-medium ${statusColor}`}>
                    {participant.status.charAt(0).toUpperCase() + participant.status.slice(1)}
                  </BodyText>
                </div>
              </div>

              {/* Additional Info */}
              {!compact && (
                <div className="mt-2 space-y-1">
                  {participant.signed_at && (
                    <BodyText as="p" size="xs" className="text-gray-500">
                      Signed: {formatAgreementDateTime(participant.signed_at)}
                    </BodyText>
                  )}
                  {participant.declined_reason && (
                    <BodyText as="p" size="xs" className="text-red-600">
                      Declined: {participant.declined_reason}
                    </BodyText>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
