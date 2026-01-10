import React from "react";
import { MessageSquare, FileText, CheckCircle } from "lucide-react";
import SectionCard from "../../../components/layout/SectionCard";
import { useAgentChats } from "../../../../../packages/hooks/data/useAgentChats";
import type { DecisionLogEntry, AgentNote } from "../../../../../packages/schemas/agent";

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
    const date = new Date(dateString);
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
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <SectionCard title="Communication Log" icon={MessageSquare}>
      <div className="space-y-6">
        {/* Messages Summary */}
        {conversation && (
          <div className="p-4 rounded-lg border border-beige/30 bg-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-responsive-base font-semibold text-navy">
                Messages
              </h3>
              <span className="text-responsive-sm text-black/60">
                {conversation.last_message_at
                  ? formatDate(conversation.last_message_at)
                  : "No messages"}
              </span>
            </div>
            {conversation.last_message && (
              <p className="text-responsive-sm text-black/60 line-clamp-2">
                {conversation.last_message}
              </p>
            )}
          </div>
        )}

        {/* Decisions and Notes */}
        <div>
          <h3 className="text-responsive-base font-semibold text-navy mb-4">
            Decisions & Notes
          </h3>
          {allItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-responsive-sm text-black/60">
                No decisions or notes yet
              </p>
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
                      <span className="text-xs font-medium text-black/60 uppercase">
                        {item.type === "decision" ? "Decision" : "Note"}
                      </span>
                      <span className="text-xs text-black/40">
                        {formatDate(item.date)}
                      </span>
                    </div>
                    <p className="text-responsive-sm text-black mb-1">
                      {item.content}
                    </p>
                    {item.context && (
                      <p className="text-xs text-black/60 italic">
                        {item.context}
                      </p>
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
