import { Check, MessageSquare, User as UserIcon, X } from "lucide-react";

import { useConnectionRequests } from "packages/hooks/data/agent/useConnectionRequests";
import { useUIStore } from "packages/store";

import Button from "@/components/ui/button/Button";
import { BodyText, Title } from "@/components/ui/index.web";
import KeyTurnLoader from "@/components/ui/loading/KeyTurnLoader.web";

type ConnectionRequestsInboxProps = {
  onRequestAccepted?: () => void;
};

export default function ConnectionRequestsInbox({
  onRequestAccepted,
}: ConnectionRequestsInboxProps) {
  const { requests, isLoading, respondToRequest, isResponding } =
    useConnectionRequests();
  const enqueueToast = useUIStore((s) => s.enqueueToast);

  const handleRespond = async (requestId: string, accept: boolean) => {
    try {
      await respondToRequest(requestId, accept);
      if (accept) {
        enqueueToast({
          type: "success",
          message: "Connection request accepted",
        });
        if (onRequestAccepted) {
          onRequestAccepted();
        }
      } else {
        enqueueToast({
          type: "success",
          message: "Connection request rejected",
        });
      }
    } catch {
      enqueueToast({
        type: "error",
        message: "Failed to respond to connection request",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <KeyTurnLoader message="Loading requests..." />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="text-center">
          <MessageSquare className="mx-auto mb-3 h-12 w-12 text-black/30" />
          <BodyText as="p" size="sm" className="text-black/60">
            No pending connection requests
          </BodyText>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto space-y-2 p-4 min-h-0">
        {requests.map((request) => (
          <div
            key={request.id}
            className="rounded-lg border border-beige bg-white p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-beige">
                <UserIcon className="h-5 w-5 text-black" />
              </div>
              <div className="flex-1">
                <Title as="h3" size="sm" className="font-medium text-black">
                  {request.other_party_name ?? "Unknown"}
                </Title>
                <BodyText as="p" size="sm" className="text-black/60">
                  {request.other_party_email ?? ""}
                </BodyText>
                {request.message && (
                  <BodyText as="p" size="sm" className="mt-2 text-black/80">
                    {request.message}
                  </BodyText>
                )}
                <BodyText as="p" size="xs" className="mt-1 text-black/40">
                  {request.requested_by_agent
                    ? "Agent requested to connect"
                    : "Client requested to connect"}
                </BodyText>
              </div>
            </div>
            <div className="mt-3 flex gap-3">
              <Button
                variant="primary"
                onClick={() => handleRespond(request.id, true)}
                disabled={isResponding}
                className="flex-1 hover:bg-olive/90"
                icon={<Check />}
                iconPosition="left"
              >
                Accept
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleRespond(request.id, false)}
                className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-black border border-neutral-200"
                disabled={isResponding}
                icon={<X />}
                iconPosition="left"
              >
                Reject
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
