import { useEffect } from "react";

import { Calendar, UpcomingEvents } from "packages/features/calendar";
import { useIsAgent } from "packages/features/homeauth";
import { useNavigation } from "packages/navigation";
import { Box } from "packages/ui/components/primitives/box";

import ClientHub from "./ClientHub/ClientHub";
import ClientList from "./ClientList/ClientList";
import DashboardChecklists from "./DashboardChecklists";

type DashboardFeatureProps = {
  setMobileHeaderActions?: React.Dispatch<React.SetStateAction<React.ReactNode | null>>;
};

export function DashboardFeature({ setMobileHeaderActions }: DashboardFeatureProps) {
  const { navigateToPath, getCurrentRoute } = useNavigation();
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
    navigateToPath(`/dashboard/client/${clientId}`);
  };

  // Check if we're viewing a specific client
  const pathMatch = getCurrentRoute().pathname.match(/^\/dashboard\/client\/(.+)$/);
  const clientIdFromPath = pathMatch ? pathMatch[1] : null;

  // Show Client Hub if client ID is in path
  if (clientIdFromPath) {
    return <ClientHub clientId={clientIdFromPath} />;
  }

  return (
    <Box className="flex flex-col gap-6 sm:gap-8">
      {/* Upcoming Events above Calendar */}
      <Box className="flex flex-col gap-6">
        <UpcomingEvents />
        <Calendar />
      </Box>

      {/* Checklists Section */}
      <DashboardChecklists />

      {/* Client List */}
      {isAgent && <ClientList onClientClick={handleClientClick} />}
    </Box>
  );
}
