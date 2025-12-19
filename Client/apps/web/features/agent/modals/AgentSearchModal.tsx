import { useState, useEffect, useRef } from "react";
import { Search, X, User as UserIcon, Send } from "lucide-react";
import { useAgentSearch } from "../../../../../packages/hooks/data/useAgentSearch";
import { useConnectionRequests } from "../../../../../packages/hooks/data/useConnectionRequests";
import { useUserData } from "../../../../../packages/hooks/data/useUserData";
import { useUIStore } from "../../../../../packages/store";
import Button from "../../../components/ui/button/Button";
import KeyTurnLoader from "../../../components/ui/loading/KeyTurnLoader";

type AgentSearchModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AgentSearchModal({
  isOpen,
  onClose,
}: AgentSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const { agents, isLoading } = useAgentSearch(searchQuery, isOpen);
  const { createRequest, isCreatingRequest } = useConnectionRequests();
  const { userProfile } = useUserData();
  const enqueueToast = useUIStore((s) => s.enqueueToast);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendRequest = async (agentId: string) => {
    if (!userProfile?.id) return;

    try {
      await createRequest(agentId, userProfile.id, message.trim() || undefined);
      enqueueToast({
        type: "success",
        message: "Connection request sent",
      });
      setMessage("");
      setSelectedAgentId(null);
      onClose();
    } catch (error) {
      enqueueToast({
        type: "error",
        message: "Failed to send connection request",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-beige p-4">
          <h2 className="text-lg font-medium text-black">
            Search for an Agent
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-beige/10"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-black" />
          </button>
        </div>

        {/* Search Input */}
        <div className="border-b border-beige p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-black/40" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full rounded-lg border border-beige bg-white px-10 py-2.5 text-sm focus:border-brown focus:outline-none focus:ring-2 focus:ring-brown/20"
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-4">
          {searchQuery.length < 2 ? null : isLoading ? (
            <div className="py-8 text-center">
              <KeyTurnLoader message="Searching agents..." />
            </div>
          ) : agents.length === 0 ? (
            <div className="py-8 text-center text-sm text-black/60">
              No agents found matching "{searchQuery}"
            </div>
          ) : (
            <div className="space-y-2">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className={`rounded-lg border p-3 transition-colors ${
                    selectedAgentId === agent.id
                      ? "border-brown bg-beige/10"
                      : "border-beige hover:bg-beige/5"
                  }`}
                >
                  {selectedAgentId === agent.id ? (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-beige">
                          <UserIcon className="h-5 w-5 text-black" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-black">
                            {agent.name}
                          </h3>
                          <p className="text-sm text-black/60">{agent.email}</p>
                        </div>
                      </div>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Add a message (optional)..."
                        className="w-full rounded-lg border border-beige px-3 py-2 text-sm focus:border-brown focus:outline-none focus:ring-2 focus:ring-brown/20"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleSendRequest(agent.id)}
                          disabled={isCreatingRequest}
                          variant="primary"
                          className="flex-1"
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Send Request
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedAgentId(null);
                            setMessage("");
                          }}
                          variant="secondary"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedAgentId(agent.id)}
                      className="flex w-full items-start gap-3 text-left"
                    >
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-beige">
                        <UserIcon className="h-5 w-5 text-black" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-black">{agent.name}</h3>
                        <p className="text-sm text-black/60">{agent.email}</p>
                        {agent.phone && (
                          <p className="text-xs text-black/40">{agent.phone}</p>
                        )}
                      </div>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
