import { useEffect, useRef } from "react";

import CloseButton from "packages/ui/components/button/CloseButton";
import { Box } from "packages/ui/components/primitives";

import { Title } from "@/components/ui";
import { AgentSearchContent } from "@/features/agent/components/AgentSearchContent";
import { getMessagingConfig } from "@/features/agent/components/messagingConfig";

type AgentSearchModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AgentSearchModal({ isOpen, onClose }: AgentSearchModalProps) {
  const config = getMessagingConfig("client");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;
  return (
    <Box className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Box className="bg-background-surface relative w-full max-w-2xl rounded-xl shadow-lg">
        {/* Header */}
        <Box className="border-border flex items-center justify-between border-b p-4">
          <Title as="h2" size="lg" className="text-text-primary font-semibold">
            {config.searchModal.title}
          </Title>
          <CloseButton onClick={onClose} size="sm" label="Close" />
        </Box>

        <AgentSearchContent isActive={isOpen} onSuccess={onClose} inputRef={inputRef} />
      </Box>
    </Box>
  );
}
