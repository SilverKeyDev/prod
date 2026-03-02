import React from "react";

import { CheckCircle, FileText, MessageSquare } from "lucide-react";

import { useAgentChats } from "packages/hooks/data/chat/useAgentChats";
import type { AgentNote, DecisionLogEntry } from "packages/schemas/agent";
import SectionCard from "packages/ui/components/cards/SectionCard";
import { BodyText, Title } from "packages/ui/components/index.web";
import { dateParseISO } from "packages/utils/date";

type CommunicationLogProps = {
  clientId: string;
  decisions: DecisionLogEntry[];
  notes: AgentNote[];
};

const CommunicationLog: React.FC<CommunicationLogProps> = ({ clientId, decisions, notes }) => {
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
  ].sort((a, b) => dateParseISO(b.date).valueOf() - dateParseISO(a.date).valueOf());

  return (
    <SectionCard title="Communication Log" icon={MessageSquare}>
      <div className="space-y-6">
        {/* Messages Summary */}
        {conversation && (
          <div className="border-beige/30 rounded-lg border bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <Title as="h3" size="md" className="text-navy font-semibold">
                Messages
              </Title>
              <BodyText as="span" size="sm" className="text-black/60">
                {conversation.last_message_at
                  ? formatDate(conversation.last_message_at)
                  : "No messages"}
              </BodyText>
            </div>
            {conversation.last_message && (
              <BodyText as="p" size="sm" className="line-clamp-2 text-black/60">
                {conversation.last_message}
              </BodyText>
            )}
          </div>
        )}

        {/* Decisions and Notes */}
        <div>
          <Title as="h3" size="md" className="text-navy mb-4 font-semibold">
            Decisions & Notes
          </Title>
          {allItems.length === 0 ? (
            <div className="py-8 text-center">
              <BodyText as="p" size="sm" className="text-black/60">
                No decisions or notes yet
              </BodyText>
            </div>
          ) : (
            <div className="space-y-4">
              {allItems.map((item) => (
                <div
                  key={item.id}
                  className="border-beige/30 flex items-start gap-3 rounded-lg border bg-white p-4"
                >
                  <div className="mt-1 flex-shrink-0">
                    {item.type === "decision" ? (
                      <CheckCircle className="text-olive h-5 w-5" />
                    ) : (
                      <FileText className="text-gold h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <BodyText as="span" size="xs" className="font-medium uppercase text-black/60">
                        {item.type === "decision" ? "Decision" : "Note"}
                      </BodyText>
                      <BodyText as="span" size="xs" className="text-black/40">
                        {formatDate(item.date)}
                      </BodyText>
                    </div>
                    <BodyText as="p" size="sm" className="mb-1 text-black">
                      {item.content}
                    </BodyText>
                    {item.context && (
                      <BodyText as="p" size="xs" className="italic text-black/60">
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
