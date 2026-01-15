import { useState, useEffect, useRef } from "react";
import { Search, X, User as UserIcon, Send } from "lucide-react";
import { useAgentSearch } from "../../../../../packages/hooks/data/agent/useAgentSearch";
import { useConnectionRequests } from "../../../../../packages/hooks/data/agent/useConnectionRequests";
import { useUserData } from "../../../../../packages/hooks/data/auth/useUserData";
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
        <div className="flex items-center justify-between border-b border-neutral-200 p-4">
          <h2 className="text-lg font-semibold text-neutral-900">
            Search for an Agent
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-neutral-100 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-neutral-600" />
          </button>
        </div>

        {/* Search Input */}
        <div className="border-b border-neutral-200 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-black/40" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full rounded-lg border border-neutral-300 bg-white px-10 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-colors"
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
                  className={`rounded-lg border p-4 transition-all ${
                    selectedAgentId === agent.id
                      ? "border-neutral-300 bg-neutral-50/50 shadow-sm"
                      : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/30"
                  }`}
                >
                  {selectedAgentId === agent.id ? (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 pb-3 border-b border-neutral-200">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100">
                          <UserIcon className="h-6 w-6 text-neutral-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-neutral-900 mb-0.5">
                            {agent.name}
                          </h3>
                          <p className="text-sm text-neutral-500 truncate">{agent.email}</p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Message (optional)
                        </label>
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Add a message..."
                          className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-colors resize-none"
                          rows={4}
                        />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button
                          onClick={() => handleSendRequest(agent.id)}
                          disabled={isCreatingRequest}
                          variant="outline"
                          size="md"
                          icon={<Send />}
                          iconPosition="left"
                          className="flex-1 min-w-0 bg-gold-lighter text-white hover:bg-gold hover:text-white border-gold-lighter"
                        >
                          Send Request
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedAgentId(null);
                            setMessage("");
                          }}
                          variant="outline"
                          size="md"
                          icon={<X />}
                          iconPosition="left"
                          className="px-6 bg-neutral-200 text-neutral-700 hover:bg-neutral-200/80 border-neutral-200"
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
