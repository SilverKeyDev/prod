import ConnectionRequestsInbox from "@/features/agent/components/modals/inbox/ConnectionRequestsInbox";

type ConnectionRequestsInboxSidebarProps = {
  onRequestAccepted?: () => void;
};

/** Sidebar panel wrapper for buyer connection-request inbox (agent-owned relationship UI). */
export default function ConnectionRequestsInboxSidebar({
  onRequestAccepted,
}: ConnectionRequestsInboxSidebarProps) {
  return <ConnectionRequestsInbox onRequestAccepted={onRequestAccepted} />;
}
