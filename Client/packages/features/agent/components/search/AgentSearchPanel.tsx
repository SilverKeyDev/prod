import { forwardRef, type ReactNode } from "react";

import { Box } from "packages/ui/components/structure/primitives";

import { Title } from "@/components/ui";
import { getMessagingConfig } from "@/features/agent/components/messaging/screen/messagingConfig";

import { AgentSearchContent } from "./AgentSearchContent";
import type { AgentSearchContentHandle, AgentSearchContentProps } from "./AgentSearchContent.types";

export type AgentSearchPanelProps = {
  onSuccess?: () => void;
  isActive?: boolean;
  inputRef?: AgentSearchContentProps["inputRef"];
  className?: string;
  /** When set (e.g. modal close control), header becomes a row with space-between. */
  headerEnd?: ReactNode;
};

/**
 * Inline "Search for an Agent" UI (title + search content). Used by checklist steps and
 * can be wrapped in a modal overlay for messaging.
 */
export const AgentSearchPanel = forwardRef<AgentSearchContentHandle, AgentSearchPanelProps>(
  function AgentSearchPanel(
    {
      onSuccess,
      isActive = true,
      inputRef,
      className = "border-border bg-background-surface w-full max-w-2xl overflow-hidden rounded-xl border shadow-lg",
      headerEnd,
    },
    ref
  ) {
    const config = getMessagingConfig("client");
    return (
      <Box className={className}>
        <Box
          className={
            headerEnd
              ? "border-border flex items-center justify-between border-b p-4 text-left"
              : "border-border border-b p-4 text-left"
          }
        >
          <Title as="h2" size="lg" className="text-text-primary text-left font-semibold">
            {config.searchModal.title}
          </Title>
          {headerEnd}
        </Box>
        <AgentSearchContent
          ref={ref}
          isActive={isActive}
          onSuccess={onSuccess}
          inputRef={inputRef}
        />
      </Box>
    );
  }
);
