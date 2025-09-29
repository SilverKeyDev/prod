import { AlertTriangle, Clock, RefreshCw, LogOut } from "lucide-react";

import { formatTimeRemaining } from "../../../../packages/hooks/ui/useSessionTimeout";
import Card from "../layout/Card";
import Button from "../ui/button/Button";

type SessionTimeoutWarningProps = {
  timeRemaining: number;
  onExtendSession: () => void;
  onLogout: () => void;
  isVisible: boolean;
};

export function SessionTimeoutWarning({
  timeRemaining,
  onExtendSession,
  onLogout,
  isVisible,
}: SessionTimeoutWarningProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card
        className="mx-4 w-full max-w-md border-l-4 border-l-red-500"
        padding="lg"
        shadow="lg"
      >
        <div className="mb-4 flex items-center">
          <div className="mr-3 rounded-lg bg-red-100 p-2">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Session Expiring Soon
          </h3>
        </div>

        <div className="mb-6">
          <div className="mb-3 flex items-center">
            <Clock className="mr-2 h-4 w-4 text-brand-accent" />
            Time remaining:
          </div>
          <div className="mb-3 font-mono text-3xl font-bold text-red-600">
            {formatTimeRemaining(timeRemaining)}
          </div>
          <Card className="border-amber-200 bg-amber-50" padding="sm">
            <p className="text-sm text-amber-800">
              Your session will expire automatically for security reasons. Click
              "Stay Logged In" to continue working.
            </p>
          </Card>
        </div>

        <div className="mb-4 flex space-x-3">
          <Button
            variant="primary"
            onClick={onExtendSession}
            icon={<RefreshCw className="h-4 w-4" />}
            className="flex-1"
          >
            Stay Logged In
          </Button>
          <Button
            variant="outline"
            onClick={onLogout}
            icon={<LogOut className="h-4 w-4" />}
            className="flex-1 text-gray-600 hover:text-gray-800"
          >
            Logout Now
          </Button>
        </div>

        <div className="flex items-center justify-center border-t border-gray-200 pt-3 text-xs text-gray-500">
          🔒 This is a security feature to protect your account
        </div>
      </Card>
    </div>
  );
}
