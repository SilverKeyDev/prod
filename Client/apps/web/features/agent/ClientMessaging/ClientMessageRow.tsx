import React from "react";

import { useDocumentsData } from "packages/hooks/data/documents/useDocumentsData";
import { useSavedHomesData } from "packages/hooks/data/search/saved/useSavedHomesData";
import { getDateDividerText } from "packages/utils/domain/messaging/messageDateUtils";

import SharedDocumentCard from "@/components/cards/documents/SharedDocumentCard";
import HomeCard from "@/components/cards/HomeCard";
import { BodyText, Button } from "@/components/ui/index.web";

export type ClientChatMessage = {
  id: string;
  content: string;
  role: "user" | "agent";
  timestamp: Date;
  shared_home_id?: string | null;
  shared_document_id?: string | null;
  is_read?: boolean;
  read_at?: string | null;
  status?: "sending" | "delivered" | "failed";
};

type ClientMessageRowProps = {
  msg: ClientChatMessage;
  index: number;
  totalCount: number;
  previousTimestamp: Date | null;
  onRetryMessage?: (messageId: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  isLast: boolean;
};

export function ClientMessageRow({
  msg,
  index,
  totalCount,
  previousTimestamp,
  onRetryMessage,
  messagesEndRef,
  isLast,
}: ClientMessageRowProps): React.ReactElement {
  const { getSavedHome } = useSavedHomesData();
  const { documents } = useDocumentsData();

  const isMostRecentMessage = index === totalCount - 1;
  const isCurrentUserMessage = msg.role === "user";
  const shouldShowDelivered =
    isCurrentUserMessage && msg.status === "delivered" && isMostRecentMessage;

  const dateDividerText = getDateDividerText(msg.timestamp, previousTimestamp);

  return (
    <React.Fragment key={msg.id}>
      {dateDividerText && (
        <div className="flex items-center justify-center py-2">
          <div className="rounded-full bg-black/5 px-3 py-1">
            <BodyText as="span" size="xs" className="font-medium text-black/60">
              {dateDividerText}
            </BodyText>
          </div>
        </div>
      )}
      <div
        className={`flex flex-col ${
          msg.role === "agent" ? "items-start" : "items-end"
        }`}
      >
        <div
          className={`flex items-center gap-2 ${
            msg.role === "agent" ? "justify-start" : "justify-end"
          }`}
        >
          <div
            className={`max-w-lg rounded-xl ${
              msg.shared_home_id || msg.shared_document_id
                ? ""
                : `px-4 py-3 ${
                    msg.role === "agent"
                      ? "bg-neutral-100 text-black"
                      : "bg-olive text-white"
                  }`
            }`}
          >
            {msg.shared_home_id &&
              (() => {
                const savedHome = getSavedHome(msg.shared_home_id);
                const homeData = savedHome || {
                  home_id: msg.shared_home_id,
                  address: msg.content || undefined,
                };
                return (
                  <div className="mb-2">
                    <HomeCard home={homeData} />
                  </div>
                );
              })()}
            {msg.shared_document_id &&
              (() => {
                const document = documents.find(
                  (d) => d.id === msg.shared_document_id,
                );
                if (!document) {
                  return (
                    <div className="mb-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <BodyText as="p" size="sm" className="text-gray-500">
                        Document not found or has been deleted.
                      </BodyText>
                    </div>
                  );
                }
                return (
                  <div className="mb-2">
                    <SharedDocumentCard doc={document} />
                  </div>
                );
              })()}
            {!msg.shared_home_id &&
              !msg.shared_document_id &&
              msg.content.trim() && (
                <BodyText as="p" size="sm" className="whitespace-pre-line">
                  {msg.content}
                </BodyText>
              )}
          </div>
        </div>

        {isCurrentUserMessage && msg.status && (
          <div className="mt-1 flex items-center justify-end gap-1.5 pr-10">
            {msg.status === "failed" && onRetryMessage && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => onRetryMessage(msg.id)}
                className="text-xs font-medium text-red-400 underline hover:text-red-300"
                label="Retry sending message"
              >
                Retry
              </Button>
            )}
            <BodyText
              as="span"
              size="xs"
              className={`font-medium ${
                msg.status === "failed" ? "text-red-400" : "text-black/60"
              }`}
            >
              {msg.status === "sending"
                ? "Sending..."
                : shouldShowDelivered
                  ? "Delivered"
                  : msg.status === "delivered"
                    ? ""
                    : "Failed to send"}
            </BodyText>
          </div>
        )}
      </div>
      {isLast ? <div ref={messagesEndRef} /> : null}
    </React.Fragment>
  );
}
