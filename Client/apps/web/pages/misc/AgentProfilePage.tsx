import { AgentProfilePageContent } from "packages/features/profile/components/pages/AgentProfilePageContent.web";
import { AgentPublicProfileShell } from "packages/features/profile/components/pages/AgentPublicProfileShell.web";

export default function AgentProfilePage() {
  return (
    <AgentPublicProfileShell>
      <AgentProfilePageContent />
    </AgentPublicProfileShell>
  );
}
