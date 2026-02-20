import React from "react";

import { CheckCircle, FileText, MessageSquare } from "lucide-react";

import { useAgentChats } from "packages/hooks/data/chat/useAgentChats";
import type { AgentNote, DecisionLogEntry } from "packages/schemas/agent";
import { dateParseISO } from "packages/utils/core/date";

import SectionCard from "@/components/layout/SectionCard";
import { BodyText, Title } from "@/components/ui/index.web";

type CommunicationLogProps = {
  clientId: string;
  decisions: DecisionLogEntry[];
  notes: AgentNote[];
};

const CommunicationLog: React.FC<CommunicationLogProps> = ({
  clientId,
  decisions,
  notes,
}) => {
  const { conversations } = useAgentChats(clientId);
  const conversation = conversations.find((c) => c.client_id === clientId);

  const formatDate = (dateString: string) => {
    const date = dateParseISO(dateString).toDate();
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Combine all communication items and sort by date
  const allItems = [
    ...decisions.map((d) => ({
      type: "decision" as const,
      id: d.id,
      date: d.date,
      content: d.decision,
      context: d.context,
    })),
    ...notes.map((n) => ({
      type: "note" as const,
      id: n.id,
      date: n.created_at,
      content: n.content,
      context: undefined,
    })),
  ].sort(
    (a, b) => dateParseISO(b.date).valueOf() - dateParseISO(a.date).valueOf(),
  );

  return (
    <SectionCard title="Communication Log" icon={MessageSquare}>
      <div className="space-y-6">
        {/* Messages Summary */}
        {conversation && (
          <div className="p-4 rounded-lg border border-beige/30 bg-white">
            <div className="flex items-center justify-between mb-2">
              <Title as="h3" size="md" className="font-semibold text-navy">
                Messages
              </Title>
              <BodyText as="span" size="sm" className="text-black/60">
                {conversation.last_message_at
                  ? formatDate(conversation.last_message_at)
                  : "No messages"}
              </BodyText>
            </div>
            {conversation.last_message && (
              <BodyText as="p" size="sm" className="text-black/60 line-clamp-2">
                {conversation.last_message}
              </BodyText>
            )}
          </div>
        )}

        {/* Decisions and Notes */}
        <div>
          <Title as="h3" size="md" className="font-semibold text-navy mb-4">
            Decisions & Notes
          </Title>
          {allItems.length === 0 ? (
            <div className="text-center py-8">
              <BodyText as="p" size="sm" className="text-black/60">
                No decisions or notes yet
              </BodyText>
            </div>
          ) : (
            <div className="space-y-4">
              {allItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-4 rounded-lg border border-beige/30 bg-white"
                >
                  <div className="flex-shrink-0 mt-1">
                    {item.type === "decision" ? (
                      <CheckCircle className="h-5 w-5 text-olive" />
                    ) : (
                      <FileText className="h-5 w-5 text-gold" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <BodyText
                        as="span"
                        size="xs"
                        className="font-medium text-black/60 uppercase"
                      >
                        {item.type === "decision" ? "Decision" : "Note"}
                      </BodyText>
                      <BodyText as="span" size="xs" className="text-black/40">
                        {formatDate(item.date)}
                      </BodyText>
                    </div>
                    <BodyText as="p" size="sm" className="text-black mb-1">
                      {item.content}
                    </BodyText>
                    {item.context && (
                      <BodyText
                        as="p"
                        size="xs"
                        className="text-black/60 italic"
                      >
                        {item.context}
                      </BodyText>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
};

export default CommunicationLog;
