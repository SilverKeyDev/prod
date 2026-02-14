import { useEffect } from "react";

import { useAuthStore } from "../../../packages/store/auth.slice";
import { useIsAgent } from "../../../packages/hooks/store/auth/useIsAgent";
import { KeyTurnLoader } from "../components/ui";
import AgentDashboard from "../features/agent/AgentDashboard";
import ClientMessaging from "../features/agent/ClientMessaging";

type AgentPageProps = {
  setMobileHeaderActions?: React.Dispatch<
    React.SetStateAction<React.ReactNode | null>
  >;
  setMobileBottomActions?: React.Dispatch<
    React.SetStateAction<React.ReactNode | null>
  >;
  /** Height of the mobile bottom bar (input bar) in px, used to offset messages. */
  mobileBottomBarHeight?: number;
};

export default function AgentPage({
  setMobileHeaderActions,
  setMobileBottomActions,
  mobileBottomBarHeight,
}: AgentPageProps = {}) {
  const authReady = useAuthStore((s) => s.authReady);
  const isAgent = useIsAgent();

  // Clear mobile header when leaving page (messaging sets its own header while mounted)
  useEffect(() => {
    return () => {
      if (setMobileHeaderActions) setMobileHeaderActions(null);
      if (setMobileBottomActions) setMobileBottomActions(null);
    };
  }, [setMobileHeaderActions, setMobileBottomActions]);

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
        <AgentDashboard
          setMobileHeaderActions={setMobileHeaderActions}
          setMobileBottomActions={setMobileBottomActions}
          mobileBottomBarHeight={mobileBottomBarHeight}
        />
      ) : (
        <ClientMessaging
          setMobileHeaderActions={setMobileHeaderActions}
          setMobileBottomActions={setMobileBottomActions}
          mobileBottomBarHeight={mobileBottomBarHeight}
        />
      )}
    </div>
  );
}
