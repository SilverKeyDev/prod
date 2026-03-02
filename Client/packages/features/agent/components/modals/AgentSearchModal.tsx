import { useEffect, useRef, useState } from "react";

import { Search, Send, User as UserIcon, X } from "lucide-react";

import { useUserData } from "packages/hooks/data/auth/useUserData";
import { useUIStore } from "packages/store";
import KeyTurnLoader from "packages/ui/components/asset/loading/KeyTurnLoader.web";
import Button from "packages/ui/components/button/Button";
import CloseButton from "packages/ui/components/button/CloseButton";
import { BodyText, Input, Label, Textarea, Title } from "packages/ui/components/index.web";

import { useAgentSearch } from "@/features/agent/hooks/data/useAgentSearch";
import { useConnectionRequests } from "@/features/agent/hooks/data/useConnectionRequests";

type AgentSearchModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AgentSearchModal({ isOpen, onClose }: AgentSearchModalProps) {
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
    } catch {
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
          <Title as="h2" size="lg" className="font-semibold text-neutral-900">
            Search for an Agent
          </Title>
          <CloseButton onClick={onClose} size="sm" label="Close" />
        </div>

        {/* Search Input */}
        <div className="border-b border-neutral-200 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-black/40" />
            <Input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full rounded-lg border border-neutral-300 bg-white px-10 py-2.5 text-sm text-neutral-900 transition-colors placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200"
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
                      <div className="flex items-start gap-3 border-b border-neutral-200 pb-3">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100">
                          <UserIcon className="h-6 w-6 text-neutral-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <Title
                            as="h3"
                            size="md"
                            className="mb-0.5 font-semibold text-neutral-900"
                          >
                            {agent.name}
                          </Title>
                          <BodyText as="p" size="sm" className="truncate text-neutral-500">
                            {agent.email}
                          </BodyText>
                        </div>
                      </div>
                      <div>
                        <Label
                          htmlFor="agent-search-message"
                          className="mb-2 block font-medium text-neutral-700"
                        >
                          Message (optional)
                        </Label>
                        <Textarea
                          id="agent-search-message"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Add a message..."
                          className="w-full resize-none rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 transition-colors placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200"
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
                          className="bg-gold-lighter hover:bg-gold border-gold-lighter min-w-0 flex-1 text-white hover:text-white"
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
                          className="border-neutral-200 bg-neutral-200 px-6 text-neutral-700 hover:bg-neutral-200/80"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedAgentId(agent.id)}
                      className="flex h-auto min-h-0 w-full items-start justify-start gap-3 py-0 text-left"
                    >
                      <div className="bg-beige flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
                        <UserIcon className="h-5 w-5 text-black" />
                      </div>
                      <div className="flex-1">
                        <Title as="h3" size="sm" className="font-medium text-black">
                          {agent.name}
                        </Title>
                        <BodyText as="p" size="sm" className="text-black/60">
                          {agent.email}
                        </BodyText>
                        {agent.phone && (
                          <BodyText as="p" size="xs" className="text-black/40">
                            {agent.phone}
                          </BodyText>
                        )}
                      </div>
                    </Button>
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
