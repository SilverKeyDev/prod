import React from "react";

import { Icon } from "@ui/icons";

import KeyTurnLoader from "packages/ui/components/asset/loading/KeyTurnLoader.web";
import { BodyText, Button, Title } from "packages/ui/components/index.web";
export function NoAgentState({ onSearchClick }: { onSearchClick: () => void }): React.ReactElement {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <Icon name="message-circle" className="mx-auto mb-3 h-16 w-16 text-black/40" />
        <Title as="h3" size="lg" className="mb-2 font-medium text-black">
          No agent assigned
        </Title>
        <BodyText as="p" size="sm" className="mb-4 text-black/60">
          Search for an agent to start messaging
        </BodyText>
        <Button
          variant="outline"
          size="sm"
          icon={<Icon name="search" className="h-4 w-4" />}
          iconPosition="left"
          onClick={onSearchClick}
          className="border-beige/50 hover:border-beige hover:bg-beige/5 mx-auto flex items-center justify-center gap-2 bg-white text-black/70 hover:text-black"
        >
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
        <div className="bg-beige/30 mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full">
          <Icon name="message-circle" className="h-8 w-8 text-black/40" />
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
