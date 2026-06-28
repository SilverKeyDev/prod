/**
 * BuyerBrokerReviewSection — SIL-183
 *
 * Checklist item 6 (sign buyer-broker agreement) agent-side UI.
 * Agent must explicitly approve after a call, or request a meeting,
 * before DocuSign sends the BBA. No silent auto-send.
 *
 * Status machine:
 *   pending_review → agent approves or requests meeting
 *   meeting_requested → agent approves after meeting
 *   approved → system sends BBA via DocuSign
 *   agreement_sent → signing UX (existing)
 */
import { useCallback, useState } from "react";
import type { ChecklistIntegrationComponentProps } from "packages/features/checklists/types/componentRegistry";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Card from "packages/ui/components/surfaces/cards/Card";

type ReviewStatus = "pending_review" | "meeting_requested" | "approved" | "agreement_sent";

type ReviewData = {
  review_id: string;
  transaction_id: string;
  status: ReviewStatus;
  approved_by_agent_id: string | null;
  approved_at: string | null;
  meeting_requested_at: string | null;
  meeting_note: string | null;
  agreement_sent_at: string | null;
};

const STATUS_LABELS: Record<ReviewStatus, string> = {
  pending_review: "Pending Review",
  meeting_requested: "Meeting Requested",
  approved: "Approved",
  agreement_sent: "Agreement Sent",
};

const STATUS_STYLES: Record<ReviewStatus, string> = {
  pending_review: "bg-yellow-100 text-yellow-700",
  meeting_requested: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  agreement_sent: "bg-gray-100 text-gray-600",
};

async function fetchReview(transactionId: string): Promise<ReviewData> {
  const res = await fetch(`/api/v1/transactions/${transactionId}/buyer-broker-review`);
  const json = await res.json();
  return json.data;
}

async function postAction(
  transactionId: string,
  action: "approve" | "request-meeting",
  note?: string
): Promise<ReviewData> {
  const res = await fetch(`/api/v1/transactions/${transactionId}/buyer-broker-review/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note }),
  });
  const json = await res.json();
  return json.data;
}

export default function BuyerBrokerReviewSection({
  transactionId,
  onComplete,
}: ChecklistIntegrationComponentProps) {
  const [review, setReview] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [meetingNote, setMeetingNote] = useState("");
  const [showMeetingInput, setShowMeetingInput] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load review status on mount
  const loadReview = useCallback(async () => {
    if (!transactionId) return;
    setLoading(true);
    try {
      const data = await fetchReview(transactionId);
      setReview(data);
    } catch {
      setError("Failed to load review status.");
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

  // Load on first render
  if (!review && !loading && !error) {
    void loadReview();
  }

  const handleApprove = useCallback(async () => {
    if (!transactionId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await postAction(transactionId, "approve");
      setReview(data);
      if (data.status === "approved") {
        onComplete?.();
      }
    } catch {
      setError("Failed to approve. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [transactionId, onComplete]);

  const handleRequestMeeting = useCallback(async () => {
    if (!transactionId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await postAction(transactionId, "request-meeting", meetingNote || undefined);
      setReview(data);
      setShowMeetingInput(false);
      setMeetingNote("");
    } catch {
      setError("Failed to request meeting. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [transactionId, meetingNote]);

  if (loading && !review) {
    return (
      <Card border="dotted" padding="md" className="mb-2">
        <BodyText size="sm" muted>
          Loading review status…
        </BodyText>
      </Card>
    );
  }

  if (error && !review) {
    return (
      <Card border="dotted" padding="md" className="mb-2">
        <BodyText size="sm" className="text-red-500">
          {error}
        </BodyText>
      </Card>
    );
  }

  const status = review?.status ?? "pending_review";
  const isSent = status === "agreement_sent";
  const isApproved = status === "approved";

  return (
    <Card border="dotted" padding="md" className="mb-2">
      <Box className="gap-4">
        {/* Status chip */}
        <Box className="flex items-center gap-2">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}
          >
            {STATUS_LABELS[status]}
          </span>
          {review?.approved_at && (
            <BodyText size="xs" muted>
              Approved {new Date(review.approved_at).toLocaleDateString()}
            </BodyText>
          )}
          {review?.meeting_requested_at && status === "meeting_requested" && (
            <BodyText size="xs" muted>
              Meeting requested {new Date(review.meeting_requested_at).toLocaleDateString()}
            </BodyText>
          )}
        </Box>

        {/* Compliance note */}
        <BodyText size="sm" className="text-text-secondary">
          Before sending the buyer-broker agreement, confirm you have spoken with your client on a
          call. This is required for RESPA compliance.
        </BodyText>

        {/* Meeting note display */}
        {review?.meeting_note && (
          <Box className="rounded-lg bg-blue-50 px-3 py-2">
            <BodyText size="xs" muted>
              Meeting note:
            </BodyText>
            <BodyText size="sm">{review.meeting_note}</BodyText>
          </Box>
        )}

        {/* Error */}
        {error && (
          <BodyText size="xs" className="text-red-500">
            {error}
          </BodyText>
        )}

        {/* Actions — hidden once sent */}
        {!isSent && (
          <Box className="flex flex-col gap-2">
            {/* Approve after call */}
            <button
              onClick={handleApprove}
              disabled={loading || isApproved}
              className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                isApproved
                  ? "cursor-default bg-green-100 text-green-700"
                  : "bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              }`}
            >
              {isApproved ? "✓ Approved after call" : "Approve after call"}
            </button>

            {/* Request meeting */}
            {!isApproved && (
              <>
                {showMeetingInput ? (
                  <Box className="flex flex-col gap-2">
                    <textarea
                      value={meetingNote}
                      onChange={(e) => setMeetingNote(e.target.value)}
                      placeholder="Add a note for the buyer (optional)"
                      rows={2}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                    <Box className="flex gap-2">
                      <button
                        onClick={handleRequestMeeting}
                        disabled={loading}
                        className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        Confirm meeting request
                      </button>
                      <button
                        onClick={() => setShowMeetingInput(false)}
                        className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </Box>
                  </Box>
                ) : (
                  <button
                    onClick={() => setShowMeetingInput(true)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    {status === "meeting_requested"
                      ? "Update meeting request"
                      : "Request meeting instead"}
                  </button>
                )}
              </>
            )}
          </Box>
        )}

        {/* Agreement sent state */}
        {isSent && (
          <Box className="rounded-lg bg-gray-50 px-3 py-2">
            <BodyText size="sm" muted>
              Agreement sent{" "}
              {review?.agreement_sent_at
                ? new Date(review.agreement_sent_at).toLocaleDateString()
                : ""}
              . Awaiting buyer signature.
            </BodyText>
          </Box>
        )}
      </Box>
    </Card>
  );
}
