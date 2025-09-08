import { AlertTriangle, Clock, RefreshCw, LogOut } from 'lucide-react';
import Card from '../layout/Card';
import Button from '../ui/button/Button';
import { formatTimeRemaining } from '../../hooks/useSessionTimeout';

interface SessionTimeoutWarningProps {
  timeRemaining: number;
  onExtendSession: () => void;
  onLogout: () => void;
  isVisible: boolean;
}

export function SessionTimeoutWarning({
  timeRemaining,
  onExtendSession,
  onLogout,
  isVisible,
}: SessionTimeoutWarningProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-md w-full mx-4 border-l-4 border-l-red-500" padding="lg" shadow="lg">
        <div className="flex items-center mb-4">
          <div className="p-2 bg-red-100 rounded-lg mr-3">
            <AlertTriangle className="text-red-600 w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Session Expiring Soon
          </h3>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <Clock className="text-brand-accent w-4 h-4 mr-2" />
            <span className="text-sm font-medium text-gray-700">Time remaining:</span>
          </div>
          <div className="text-3xl font-mono font-bold text-red-600 mb-3">
            {formatTimeRemaining(timeRemaining)}
          </div>
          <Card className="bg-amber-50 border-amber-200" padding="sm">
            <p className="text-sm text-amber-800">
              Your session will expire automatically for security reasons. 
              Click "Stay Logged In" to continue working.
            </p>
          </Card>
        </div>

        <div className="flex space-x-3 mb-4">
          <Button
            variant="primary"
            onClick={onExtendSession}
            icon={<RefreshCw className="w-4 h-4" />}
            className="flex-1"
          >
            Stay Logged In
          </Button>
          <Button
            variant="outline"
            onClick={onLogout}
            icon={<LogOut className="w-4 h-4" />}
            className="flex-1 text-gray-600 hover:text-gray-800"
          >
            Logout Now
          </Button>
        </div>
        
        <div className="flex items-center justify-center text-xs text-gray-500 pt-3 border-t border-gray-200">
          <span className="mr-2">🔒</span>
          <span>This is a security feature to protect your account</span>
        </div>
      </Card>
    </div>
  );
}
