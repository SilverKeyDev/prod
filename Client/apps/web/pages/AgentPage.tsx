import { useEffect } from "react";

import { useUserData } from "../../../packages/hooks/data/useUserData";
import { KeyTurnLoader } from "../components/ui";
import AgentDashboard from "../features/agent/AgentDashboard";
import ClientMessaging from "../features/agent/ClientMessaging";

type AgentPageProps = {
  setMobileHeaderActions?: React.Dispatch<
    React.SetStateAction<React.ReactNode | null>
  >;
};

export default function AgentPage({
  setMobileHeaderActions,
}: AgentPageProps = {}) {
  const { userProfile, userProfileLoading } = useUserData();
  const isAgent = userProfile?.is_agent ?? false;

  // Set mobile header actions
  useEffect(() => {
    if (setMobileHeaderActions) {
      setMobileHeaderActions(null);
    }
    return () => {
      if (setMobileHeaderActions) {
        setMobileHeaderActions(null);
      }
    };
  }, [setMobileHeaderActions]);

  if (userProfileLoading) {
    return (
      <div className="py-responsive-lg flex justify-center">
        <KeyTurnLoader message="Loading..." />
      </div>
    );
  }

  // Show agent dashboard if user is an agent, otherwise show client messaging
  return <div>{isAgent ? <AgentDashboard /> : <ClientMessaging />}</div>;
}
