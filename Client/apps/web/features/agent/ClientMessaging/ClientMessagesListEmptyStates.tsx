import React from "react";

import { MessageCircle, Search } from "lucide-react";

import { BodyText, Button, Title } from "@/components/ui/index.web";
import KeyTurnLoader from "@/components/ui/loading/KeyTurnLoader.web";

export function NoAgentState({
  onSearchClick,
}: {
  onSearchClick: () => void;
}): React.ReactElement {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <MessageCircle className="mx-auto mb-3 h-16 w-16 text-black/40" />
        <Title as="h3" size="lg" className="mb-2 font-medium text-black">
          No agent assigned
        </Title>
        <BodyText as="p" size="sm" className="mb-4 text-black/60">
          Search for an agent to start messaging
        </BodyText>
        <Button
          variant="outline"
          size="sm"
          onClick={onSearchClick}
          className="mx-auto flex items-center justify-center gap-2 border-beige/50 bg-white text-black/70 hover:border-beige hover:bg-beige/5 hover:text-black"
        >
          <Search className="h-4 w-4" />
          Search for Agent
        </Button>
      </div>
    </div>
  );
}

export function LoadingState(): React.ReactElement {
  return (
    <div className="flex h-full items-center justify-center">
      <KeyTurnLoader message="Loading conversation..." />
    </div>
  );
}

export function EmptyConversationState(): React.ReactElement {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-beige/30">
          <MessageCircle className="h-8 w-8 text-black/40" />
        </div>
        <Title as="h3" size="lg" className="mb-2 font-medium text-black">
          Start a conversation
        </Title>
        <BodyText as="p" size="sm" className="mx-auto max-w-md text-black/60">
          Send a message to your agent
        </BodyText>
      </div>
    </div>
  );
}
