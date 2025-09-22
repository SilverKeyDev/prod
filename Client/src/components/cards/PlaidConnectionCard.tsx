/**
 * Plaid Connection Card Component
 * Displays connected bank accounts and asset reports
 */

import { useState } from "react";
import BaseCard from "./BaseCard";
import Button from "../ui/button/Button";
import StatusBadge from "../ui/asset/StatusBadge";
import { usePlaidStore } from "../../core/store/plaid.slice";
import {
  usePlaidAssetReports,
  usePlaidAssetReport,
  usePlaidItemDisconnect,
} from "../../core/hooks/data/usePlaid";
import { useUIStore } from "../../core/store/ui.slice";
import { plaidUtils } from "../../core/services/plaid";
import { PlaidLinkModal } from "../modals/PlaidLinkModal";

interface PlaidConnectionCardProps {
  className?: string;
}

export function PlaidConnectionCard({ className }: PlaidConnectionCardProps) {
  const { enqueueToast } = useUIStore();
  const plaidItems = usePlaidStore((state) => state.plaidItems);
  const selectedReportToken = usePlaidStore(
    (state) => state.selectedReportToken
  );
  const setSelectedReportToken = usePlaidStore(
    (state) => state.setSelectedReportToken
  );
  const { createAssetReport } = usePlaidAssetReports();
  const { assetReport, downloadAssetReportPdf } =
    usePlaidAssetReport(selectedReportToken);
  const disconnectItemMutation = usePlaidItemDisconnect();

  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isCreatingReport, setIsCreatingReport] = useState(false);

  const handleCreateAssetReport = async () => {
    try {
      setIsCreatingReport(true);
      const reportToken = await createAssetReport(60); // 60 days
      if (reportToken) {
        setSelectedReportToken(reportToken);
        enqueueToast({
          type: "success",
          message: "Asset report created successfully!",
        });
      }
    } catch (error) {
      console.error("Failed to create asset report:", error);
      enqueueToast({
        type: "error",
        message: "Failed to create asset report. Please try again.",
      });
    } finally {
      setIsCreatingReport(false);
    }
  };

  const handleDisconnectItem = async (itemId: string) => {
    try {
      await disconnectItemMutation.mutateAsync(itemId);
      enqueueToast({
        type: "success",
        message: "Bank account disconnected successfully!",
      });
    } catch (error) {
      console.error("Failed to disconnect item:", error);
      enqueueToast({
        type: "error",
        message: "Failed to disconnect bank account. Please try again.",
      });
    }
  };

  const handleDownloadPdf = async () => {
    try {
      await downloadAssetReportPdf();
      enqueueToast({
        type: "success",
        message: "Asset report downloaded successfully!",
      });
    } catch (error) {
      console.error("Failed to download PDF:", error);
      enqueueToast({
        type: "error",
        message: "Failed to download asset report. Please try again.",
      });
    }
  };

  return (
    <>
      <BaseCard className={className}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Bank Connections
              </h3>
              <p className="text-sm text-gray-500">
                Connect your bank accounts for proof of funds verification
              </p>
            </div>
            <Button
              onClick={() => setIsLinkModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Connect Bank Account
            </Button>
          </div>

          {/* Connected Accounts */}
          <div className="space-y-4 mb-6">
            {plaidItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <p className="mt-2">No bank accounts connected</p>
                <p className="text-sm">
                  Connect your first bank account to get started
                </p>
              </div>
            ) : (
              plaidItems.map((item) => (
                <div
                  key={item.item_id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-blue-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.institution_name || "Bank Account"}
                      </p>
                      <p className="text-sm text-gray-500">
                        Connected {plaidUtils.formatDate(item.linked_at)}
                      </p>
                    </div>
                    <StatusBadge
                      text={item.status}
                      variant={item.status === "active" ? "success" : "warning"}
                      className="ml-2"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnectItem(item.item_id)}
                    disabled={disconnectItemMutation.isPending}
                  >
                    Disconnect
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Asset Reports Section */}
          {plaidItems.length > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-md font-semibold text-gray-900">
                    Proof of Funds Reports
                  </h4>
                  <p className="text-sm text-gray-500">
                    Generate asset reports for verification
                  </p>
                </div>
                <Button
                  onClick={handleCreateAssetReport}
                  disabled={isCreatingReport}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isCreatingReport ? "Creating..." : "Generate Report"}
                </Button>
              </div>

              {/* Asset Report Display */}
              {selectedReportToken && assetReport && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-gray-900">Asset Report</h5>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadPdf}
                    >
                      Download PDF
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Total Assets:
                      </span>
                      <span className="text-sm font-medium">
                        {plaidUtils.formatCurrency(
                          plaidUtils.calculateTotalAssets(assetReport)
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Report Date:
                      </span>
                      <span className="text-sm">
                        {plaidUtils.formatDate(assetReport.date_generated)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Accounts:</span>
                      <span className="text-sm">
                        {assetReport.items.reduce(
                          (total, item) => total + item.accounts.length,
                          0
                        )}{" "}
                        accounts
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </BaseCard>

      {/* Plaid Link Modal */}
      <PlaidLinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onSuccess={(itemId) => {
          console.log("Bank account connected:", itemId);
        }}
        products={["assets"]}
      />
    </>
  );
}
