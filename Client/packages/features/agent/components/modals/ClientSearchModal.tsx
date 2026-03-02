import { useEffect, useRef, useState } from "react";

import { Search, Send, User as UserIcon } from "lucide-react";

import { useUserData } from "packages/hooks/data/auth/useUserData";
import { useUIStore } from "packages/store";
import KeyTurnLoader from "packages/ui/components/asset/loading/KeyTurnLoader.web";
import Button from "packages/ui/components/button/Button";
import CancelButton from "packages/ui/components/button/CancelButton";
import CloseButton from "packages/ui/components/button/CloseButton";
import { BodyText, Input, Textarea, Title } from "packages/ui/components/index.web";

import { useClientSearch } from "@/features/agent/hooks/data/useAgentSearch";
import { useConnectionRequests } from "@/features/agent/hooks/data/useConnectionRequests";

type ClientSearchModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ClientSearchModal({ isOpen, onClose }: ClientSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const { clients, isLoading } = useClientSearch(searchQuery, isOpen);
  const { createRequest, isCreatingRequest } = useConnectionRequests();
  const { userProfile } = useUserData();
  const enqueueToast = useUIStore((s) => s.enqueueToast);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendRequest = async (clientId: string) => {
    if (!userProfile?.id) return;

    try {
      await createRequest(userProfile.id, clientId, message.trim() || undefined);
      enqueueToast({
        type: "success",
        message: "Connection request sent",
      });
      setMessage("");
      setSelectedClientId(null);
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
        <div className="border-beige flex items-center justify-between border-b p-4">
          <Title as="h2" size="lg" className="font-medium text-black">
            Search for a Client
          </Title>
          <CloseButton onClick={onClose} size="sm" label="Close" />
        </div>

        {/* Search Input */}
        <div className="border-beige border-b p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-black/40" />
            <Input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="border-beige focus:border-olive focus:ring-olive/20 w-full rounded-lg border bg-white px-10 py-2.5 text-base focus:outline-none focus:ring-2"
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-4">
          {searchQuery.length < 2 ? null : isLoading ? (
            <div className="py-8 text-center">
              <KeyTurnLoader message="Searching clients..." />
            </div>
          ) : clients.length === 0 ? (
            <div className="py-8 text-center text-base font-medium text-black/60">
              No clients found matching "{searchQuery}"
            </div>
          ) : (
            <div className="space-y-2">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className={`rounded-lg border p-3 transition-colors ${
                    selectedClientId === client.id
                      ? "border-olive bg-olive/10"
                      : "border-beige hover:bg-beige/5"
                  }`}
                >
                  {selectedClientId === client.id ? (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="bg-beige flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
                          <UserIcon className="h-5 w-5 text-black" />
                        </div>
                        <div className="flex-1">
                          <Title as="h3" size="md" className="font-semibold text-black">
                            {client.name}
                          </Title>
                          <BodyText as="p" size="md" className="font-medium text-black/60">
                            {client.email}
                          </BodyText>
                        </div>
                      </div>
                      <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Add a message (optional)..."
                        className="border-beige focus:border-olive focus:ring-olive/20 w-full rounded-lg border px-3 py-2 text-base focus:outline-none focus:ring-2"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleSendRequest(client.id)}
                          disabled={isCreatingRequest}
                          variant="outline"
                          size="md"
                          icon={<Send />}
                          iconPosition="left"
                          className="bg-gold-lighter hover:bg-gold border-gold-lighter flex-1 text-white hover:text-white"
                        >
                          Send Request
                        </Button>
                        <CancelButton
                          onClick={() => {
                            setSelectedClientId(null);
                            setMessage("");
                          }}
                          size="md"
                        >
                          Cancel
                        </CancelButton>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedClientId(client.id)}
                      className="flex h-auto min-h-0 w-full items-start justify-start gap-3 py-0 text-left"
                    >
                      <div className="bg-beige flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
                        <UserIcon className="h-5 w-5 text-black" />
                      </div>
                      <div className="flex-1">
                        <Title as="h3" size="md" className="font-semibold text-black">
                          {client.name}
                        </Title>
                        <BodyText as="p" size="md" className="font-medium text-black/60">
                          {client.email}
                        </BodyText>
                        {client.phone && (
                          <BodyText as="p" size="sm" className="font-medium text-black/40">
                            {client.phone}
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
