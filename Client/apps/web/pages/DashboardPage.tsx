import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Settings } from "lucide-react";
import { Button } from "../components/ui";
import TodayPanel from "../features/dashboard/TodayPanel/TodayPanel";
import ClientList from "../features/dashboard/ClientList/ClientList";
import ClientHub from "../features/dashboard/ClientHub/ClientHub";
import { SettingsModal } from "../features/agent/modals";

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const handleClientClick = (clientId: string) => {
    navigate(`/dashboard/client/${clientId}`);
  };

  // Check if we're viewing a specific client
  const pathMatch = location.pathname.match(/^\/dashboard\/client\/(.+)$/);
  const clientIdFromPath = pathMatch ? pathMatch[1] : null;

  // Show Client Hub if client ID is in path
  if (clientIdFromPath) {
    return <ClientHub clientId={clientIdFromPath} />;
  }

  return (
    <>
      <div className="space-y-6 sm:space-y-8">
        {/* Settings Button */}
        <div className="flex justify-end">
          <Button
            onClick={() => setIsSettingsModalOpen(true)}
            variant="outline"
            size="md"
            icon={<Settings className="h-4 w-4" />}
            iconPosition="left"
          >
            Settings
          </Button>
        </div>

        {/* Today Panel */}
        <TodayPanel />

        {/* Client List */}
        <ClientList onClientClick={handleClientClick} />
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </>
  );
}
