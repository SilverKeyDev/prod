import { useEffect } from "react";

import { useIsAgent } from "packages/hooks/store/auth/useIsAgent";
import { useAuthStore } from "packages/store";

import { KeyTurnLoader } from "@/components/ui/index.web";
import AgentDashboard from "@/features/agent/AgentDashboard";
import ClientMessaging from "@/features/agent/ClientMessaging";

type AgentPageProps = {
  setMobileHeaderActions?: React.Dispatch<
    React.SetStateAction<React.ReactNode | null>
  >;
};

export default function AgentPage({
  setMobileHeaderActions,
}: AgentPageProps = {}) {
  const authReady = useAuthStore((s) => s.authReady);
  const isAgent = useIsAgent();

  // Clear mobile header when leaving page (messaging sets its own header while mounted)
  useEffect(() => {
    return () => {
      if (setMobileHeaderActions) setMobileHeaderActions(null);
    };
  }, [setMobileHeaderActions]);

  // Avoid flicker: don't render a potentially incorrect experience before auth bootstrap completes
  if (!authReady) {
    return (
      <div className="py-responsive-lg flex justify-center">
        <KeyTurnLoader message="Loading..." />
      </div>
    );
  }

  // Show agent dashboard if user is an agent, otherwise show client messaging
  return (
    <div className="h-full w-full">
      {isAgent ? (
        <AgentDashboard setMobileHeaderActions={setMobileHeaderActions} />
      ) : (
        <ClientMessaging setMobileHeaderActions={setMobileHeaderActions} />
      )}
    </div>
  );
}
