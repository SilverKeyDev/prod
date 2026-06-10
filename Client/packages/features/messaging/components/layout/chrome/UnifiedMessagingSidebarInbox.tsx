import React from "react";

import { ConnectionRequestsInbox } from "packages/features/agent";

type UnifiedMessagingSidebarInboxProps = {
  onRequestAccepted: () => void;
};

export function UnifiedMessagingSidebarInbox({
  onRequestAccepted,
}: UnifiedMessagingSidebarInboxProps) {
  return <ConnectionRequestsInbox onRequestAccepted={onRequestAccepted} />;
}
