import React from "react";

import { Icon } from "@ui/icons";

import { useAgentChats } from "packages/hooks/data/chat/useAgentChats";
import type { AgentNote, DecisionLogEntry } from "packages/schemas/agent";
import SectionCard from "packages/ui/components/cards/SectionCard";
import { Box } from "packages/ui/components/primitives";
import { dateParseISO } from "packages/utils/date";

import { BodyText, Title } from "@/components/ui";
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
    <SectionCard title="Communication Log" iconName="message-square">
      <Box className="flex flex-col space-y-6">
        {/* Messages Summary */}
        {conversation && (
          <Box className="border-border bg-background-surface rounded-lg border p-4">
            <Box className="mb-2 flex items-center justify-between">
              <Title as="h3" size="md" className="text-text-primary font-semibold">
                Messages
              </Title>
              <BodyText as="span" size="sm" className="text-text-secondary">
                {conversation.last_message_at
                  ? formatDate(conversation.last_message_at)
                  : "No messages"}
              </BodyText>
            </Box>
            {conversation.last_message && (
              <BodyText as="p" size="sm" className="text-text-secondary line-clamp-2">
                {conversation.last_message}
              </BodyText>
            )}
          </Box>
        )}

        {/* Decisions and Notes */}
        <Box>
          <Title as="h3" size="md" className="text-text-primary mb-4 font-semibold">
            Decisions & Notes
          </Title>
          {allItems.length === 0 ? (
            <Box className="py-8 text-center">
              <BodyText as="p" size="sm" className="text-text-secondary">
                No decisions or notes yet
              </BodyText>
            </Box>
          ) : (
            <Box className="space-y-4">
              {allItems.map((item) => (
                <Box
                  key={item.id}
                  className="border-border bg-background-surface flex items-start gap-3 rounded-lg border p-4"
                >
                  <Box className="mt-1 flex-shrink-0">
                    {item.type === "decision" ? (
                      <Icon name="check-circle" className="text-primary h-5 w-5" />
                    ) : (
                      <Icon name="file-text" className="text-accent h-5 w-5" />
                    )}
                  </Box>
                  <Box className="min-w-0 flex-1">
                    <Box className="mb-1 flex items-center justify-between gap-2">
                      <BodyText
                        as="span"
                        size="xs"
                        className="text-text-secondary font-medium uppercase"
                      >
                        {item.type === "decision" ? "Decision" : "Note"}
                      </BodyText>
                      <BodyText as="span" size="xs" className="text-text-disabled">
                        {formatDate(item.date)}
                      </BodyText>
                    </Box>
                    <BodyText as="p" size="sm" className="text-text-primary mb-1">
                      {item.content}
                    </BodyText>
                    {item.context && (
                      <BodyText as="p" size="xs" className="text-text-secondary italic">
                        {item.context}
                      </BodyText>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </SectionCard>
  );
};
export default CommunicationLog;
