import { User } from "lucide-react";

import type { AgreementParticipant } from "packages/schemas/content/documents/docusign";
import {
  formatAgreementDateTime,
  formatParticipantRole,
  getParticipantStatusColor,
} from "packages/utils/domain/documents/docusignHelpers";

import { BodyText } from "@/components/ui/index.web";
import { getParticipantStatusIcon } from "@/features/documents/docusign/utils/docusignIcons";

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
      <div className="text-center py-4">
        <BodyText size="sm" muted>
          No participants added yet
        </BodyText>
      </div>
    );
  }

  // Sort by signing order
  const sortedParticipants = [...participants].sort(
    (a, b) => a.signing_order - b.signing_order,
  );

  return (
    <div className={`space-y-${compact ? "2" : "3"}`}>
      {sortedParticipants.map((participant) => {
        const StatusIcon = getParticipantStatusIcon(participant.status);
        const statusColor = getParticipantStatusColor(participant.status);

        return (
          <div
            key={participant.id}
            className={`flex items-start gap-3 ${compact ? "p-2" : "p-3"} border border-gray-200 rounded-lg hover:bg-gray-50`}
          >
            {/* Avatar */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="w-5 h-5 text-gray-600" />
            </div>

            {/* Participant Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <BodyText
                      as="p"
                      className={`font-medium ${compact ? "text-sm" : "text-base"} text-gray-900 truncate`}
                    >
                      {participant.name}
                    </BodyText>
                    {showOrder && (
                      <BodyText
                        as="span"
                        size="xs"
                        className="flex-shrink-0 px-1.5 py-0.5 font-medium bg-gray-100 text-gray-600 rounded"
                      >
                        #{participant.signing_order}
                      </BodyText>
                    )}
                  </div>
                  <BodyText as="p" size="xs" className="text-gray-500 truncate">
                    {participant.email}
                  </BodyText>
                  <BodyText as="p" size="xs" className="text-gray-600 mt-0.5">
                    {formatParticipantRole(participant.role)}
                  </BodyText>
                </div>

                {/* Status */}
                <div className="flex-shrink-0 flex items-center gap-1.5">
                  <StatusIcon className={`w-4 h-4 ${statusColor}`} />
                  <BodyText
                    as="span"
                    size="sm"
                    className={`font-medium ${statusColor}`}
                  >
                    {participant.status.charAt(0).toUpperCase() +
                      participant.status.slice(1)}
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
