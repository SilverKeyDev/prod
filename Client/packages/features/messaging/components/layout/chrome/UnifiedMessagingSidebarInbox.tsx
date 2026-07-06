import React from "react";

import ConnectionRequestsInbox from "packages/features/agent/components/modals/inbox/ConnectionRequestsInbox";

type UnifiedMessagingSidebarInboxProps = {
  onRequestAccepted: () => void;
};

export function UnifiedMessagingSidebarInbox({
  onRequestAccepted,
}: UnifiedMessagingSidebarInboxProps) {
  return <ConnectionRequestsInbox onRequestAccepted={onRequestAccepted} />;
}
