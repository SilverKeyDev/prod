/**
 * BuyerBrokerStatusBanner — SIL-183
 * Buyer-facing status banner on the BBA checklist card.
 * Shows current review status and hides signing footer until agreement_sent.
 */
import { useEffect, useState } from "react";
import Box from "packages/ui/components/structure/primitives/Box";
import BodyText from "packages/ui/components/structure/text/BodyText";

type ReviewStatus = "pending_review" | "meeting_requested" | "approved" | "agreement_sent";

const STATUS_COPY: Record<ReviewStatus, { label: string; sublabel: string; color: string }> = {
  pending_review: {
    label: "Waiting for agent review",
    sublabel:
      "Your agent will review your profile and reach out to confirm before sending the agreement.",
    color: "bg-yellow-50 border-yellow-200 text-yellow-800",
  },
  meeting_requested: {
    label: "Your agent wants to meet",
    sublabel:
      "Your agent has requested a call or meeting before sending the buyer-broker agreement.",
    color: "bg-blue-50 border-blue-200 text-blue-800",
  },
  approved: {
    label: "Approved — agreement coming soon",
    sublabel: "Your agent has approved and the agreement will be sent to you shortly.",
    color: "bg-green-50 border-green-200 text-green-800",
  },
  agreement_sent: {
    label: "Agreement sent",
    sublabel: "Check your email to sign the buyer-broker agreement.",
    color: "bg-gray-50 border-gray-200 text-gray-700",
  },
};

type Props = {
  transactionId: string;
};

export function BuyerBrokerStatusBanner({ transactionId }: Props) {
  const [status, setStatus] = useState<ReviewStatus | null>(null);

  useEffect(() => {
    void fetch(`/api/v1/transactions/${transactionId}/buyer-broker-review`)
      .then((r) => r.json())
      .then((json) => {
        if (json?.data?.status) {
          setStatus(json.data.status as ReviewStatus);
        }
      })
      .catch(() => null);
  }, [transactionId]);

  if (!status) return null;

  const copy = STATUS_COPY[status];

  return (
    <Box className={`mx-4 mb-3 rounded-lg border px-4 py-3 ${copy.color}`}>
      <BodyText size="sm" className="font-semibold">
        {copy.label}
      </BodyText>
      <BodyText size="xs" className="mt-0.5">
        {copy.sublabel}
      </BodyText>
    </Box>
  );
}
