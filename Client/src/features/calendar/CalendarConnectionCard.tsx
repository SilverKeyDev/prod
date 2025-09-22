import { Calendar, CheckCircle, XCircle } from "lucide-react";
import React from "react";

import Button from "../../components/ui/button/Button";
import { SectionBox, SectionTitle } from "../negotiate";

interface CalendarConnectionCardProps {
  isConnected: boolean;
  isLoading: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onRefresh: () => void;
}

const CalendarConnectionCard: React.FC<CalendarConnectionCardProps> = ({
  isConnected,
  isLoading,
  onConnect,
  onDisconnect,
  onRefresh,
}) => {
  return (
    <SectionBox>
      <SectionTitle icon={<Calendar className="mobile-icon-sm text-brown" />}>
        Google Calendar
      </SectionTitle>

      <div className="text-responsive-sm text-gray-600 mb-4">
        Connect your Google Calendar to sync events and create new ones
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <CheckCircle className="mobile-icon-sm text-green-500" />
          ) : (
            <XCircle className="mobile-icon-sm text-gray-400" />
          )}
          <span className="text-responsive-sm font-medium text-gray-700">
            {isConnected ? "Connected" : "Not Connected"}
          </span>
        </div>
      </div>

      {isConnected ? (
        <div className="space-y-responsive-sm">
          <div className="rounded-lg bg-green-50 p-3">
            <p className="text-responsive-sm text-green-700">
              ✅ Your Google Calendar is connected and ready to sync events.
            </p>
          </div>
          <div className="flex flex-wrap gap-responsive-sm">
            <Button
              variant="olive"
              size="sm"
              onClick={onRefresh}
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDisconnect}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              Disconnect
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-responsive-sm">
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-responsive-sm text-gray-600">
              Connect your Google Calendar to automatically create events for
              property viewings and offers.
            </p>
          </div>
          <Button variant="olive" onClick={onConnect} fullWidth>
            Connect Google Calendar
          </Button>
        </div>
      )}
    </SectionBox>
  );
};

export default CalendarConnectionCard;
