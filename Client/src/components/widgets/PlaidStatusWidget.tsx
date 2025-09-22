/**
 * Plaid Status Widget
 * Shows a quick status of connected bank accounts
 */

import StatusBadge from "../ui/asset/StatusBadge";
import {
  useHasConnectedAccounts,
  useLatestAssetReport,
} from "../../core/hooks/data/usePlaidIntegration";
import { plaidUtils } from "../../core/services/plaid";

interface PlaidStatusWidgetProps {
  className?: string;
}

export function PlaidStatusWidget({ className }: PlaidStatusWidgetProps) {
  const hasConnectedAccounts = useHasConnectedAccounts();
  const latestReport = useLatestAssetReport();

  if (!hasConnectedAccounts) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg ${className}`}>
        <div className="flex items-center space-x-3">
          <StatusBadge text="No Accounts" variant="warning" />
          <span className="text-sm text-gray-600">
            Connect bank accounts for proof of funds
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-green-50 rounded-lg ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <StatusBadge text="Connected" variant="success" />
          <span className="text-sm text-gray-600">Bank accounts connected</span>
        </div>
        {latestReport && (
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              Latest Report
            </div>
            <div className="text-xs text-gray-500">
              {plaidUtils.formatDate(latestReport.created_at)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
