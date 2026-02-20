import { useEffect } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import { useIsAgent } from "packages/hooks/store/auth/useIsAgent";

import { Calendar, UpcomingEvents } from "@/features/dashboard/calendar";
import ClientHub from "@/features/dashboard/ClientHub/ClientHub";
import ClientList from "@/features/dashboard/ClientList/ClientList";
import DashboardChecklists from "@/features/dashboard/DashboardChecklists";

type DashboardPageProps = {
  setMobileHeaderActions?: React.Dispatch<
    React.SetStateAction<React.ReactNode | null>
  >;
};

export default function DashboardPage({
  setMobileHeaderActions,
}: DashboardPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAgent = useIsAgent();

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

  const handleClientClick = (clientId: string) => {
    void navigate(`/dashboard/client/${clientId}`);
  };

  // Check if we're viewing a specific client
  const pathMatch = location.pathname.match(/^\/dashboard\/client\/(.+)$/);
  const clientIdFromPath = pathMatch ? pathMatch[1] : null;

  // Show Client Hub if client ID is in path
  if (clientIdFromPath) {
    return <ClientHub clientId={clientIdFromPath} />;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Upcoming Events above Calendar */}
      <div className="flex flex-col gap-6">
        <UpcomingEvents />
        <Calendar />
      </div>

      {/* Checklists Section */}
      <DashboardChecklists />

      {/* Client List */}
      {isAgent && <ClientList onClientClick={handleClientClick} />}
    </div>
  );
}
