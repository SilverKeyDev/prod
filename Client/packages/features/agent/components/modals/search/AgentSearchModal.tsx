import { useEffect, useRef } from "react";

import { CloseButton } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";

import { AgentSearchPanel } from "@/features/agent/components/search/AgentSearchPanel";

type AgentSearchModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AgentSearchModal({ isOpen, onClose }: AgentSearchModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;
  return (
    <Box className="z-modal fixed-modal-dashboard-main flex items-center justify-center bg-black/50 p-4">
      <AgentSearchPanel
        isActive={isOpen}
        onSuccess={onClose}
        inputRef={inputRef}
        className="bg-background-surface relative w-full max-w-2xl rounded-xl shadow-lg"
        headerEnd={<CloseButton onClick={onClose} size="sm" label="Close" />}
      />
    </Box>
  );
}
