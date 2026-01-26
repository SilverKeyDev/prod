import { useMemo, useState } from "react";
import { FileSignature, Plus, ExternalLink, Clock } from "lucide-react";
import { useDocusignAgreements } from "../../../../../packages/hooks/data/documents/useDocusignAgreements";
import { Button, Title, BodyText } from "../../../components/ui";
import AgreementStatusBadge from "../../documents/docusign/components/AgreementStatusBadge";
import { CreateAgreementModal, AgreementDetailModal } from "../../documents/docusign/modals";
import { KeyTurnLoader } from "../../../components/ui";
import {
  daysSinceSent,
  getUrgencyLevel,
  getUrgencyColor,
  formatAgreementDate,
} from "../../../../../packages/utils/documents/docusignHelpers";
import type { Agreement } from "../../../../../packages/schemas/documents/docusign";

/**
 * DocuSignWidget Component
 * 
 * Dashboard widget showing pending signatures and recent agreements
 * Two-column layout: pending signatures on left, recent agreements on right
 */
export default function DocuSignWidget() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null);

  const { agreements, isLoading, error } = useDocusignAgreements();

  // Filter pending signatures (sent, delivered, or partially signed)
  const pendingSignatures = useMemo(() => {
    return agreements
      .filter(
        (a) =>
          a.status === "sent" ||
          a.status === "delivered" ||
          a.status === "signed"
      )
      .sort((a, b) => {
        const daysA = daysSinceSent(a.sent_at);
        const daysB = daysSinceSent(b.sent_at);
        return daysB - daysA; // Most urgent first
      })
      .slice(0, 5);
  }, [agreements]);

  // Recent agreements (last 5, any status)
  const recentAgreements = useMemo(() => {
    return [...agreements]
      .sort((a, b) => {
        const dateA = new Date(a.updated_at || a.created_at).getTime();
        const dateB = new Date(b.updated_at || b.created_at).getTime();
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [agreements]);

  // Summary stats
  const stats = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      totalPending: pendingSignatures.length,
      completedThisWeek: agreements.filter(
        (a) =>
          a.status === "completed" &&
          a.completed_at &&
          new Date(a.completed_at) >= oneWeekAgo
      ).length,
      voidedThisMonth: agreements.filter(
        (a) =>
          a.status === "voided" &&
          a.voided_at &&
          new Date(a.voided_at) >= oneMonthAgo
      ).length,
    };
  }, [agreements, pendingSignatures]);

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <KeyTurnLoader message="Loading agreements..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center py-8">
          <BodyText size="sm" className="text-red-600">
            Failed to load agreements
          </BodyText>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-blue-600" />
            <Title size="md">DocuSign Agreements</Title>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Create
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {stats.totalPending}
            </div>
            <BodyText size="xs" muted>
              Pending
            </BodyText>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {stats.completedThisWeek}
            </div>
            <BodyText size="xs" muted>
              This Week
            </BodyText>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">
              {stats.voidedThisMonth}
            </div>
            <BodyText size="xs" muted>
              Voided
            </BodyText>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Pending Signatures */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">
                Pending Signatures
              </h3>
            </div>
            {pendingSignatures.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg">
                <BodyText size="sm" muted>
                  No pending signatures
                </BodyText>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingSignatures.map((agreement) => {
                  const daysWaiting = daysSinceSent(agreement.sent_at);
                  const urgency = getUrgencyLevel(daysWaiting);
                  const urgencyColor = getUrgencyColor(urgency);

                  return (
                    <div
                      key={agreement.id}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedAgreementId(agreement.id)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate flex-1">
                          {agreement.title}
                        </p>
                        <AgreementStatusBadge
                          status={agreement.status}
                          size="sm"
                          showIcon={false}
                        />
                      </div>
                      {agreement.buyer_name && (
                        <p className="text-xs text-gray-600 mb-1">
                          {agreement.buyer_name}
                        </p>
                      )}
                      <div className="flex items-center gap-1 text-xs">
                        <Clock className={`w-3 h-3 ${urgencyColor}`} />
                        <span className={urgencyColor}>
                          {daysWaiting} {daysWaiting === 1 ? "day" : "days"}{" "}
                          waiting
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Agreements */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">
                Recent Agreements
              </h3>
            </div>
            {recentAgreements.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg">
                <BodyText size="sm" muted>
                  No agreements yet
                </BodyText>
              </div>
            ) : (
              <div className="space-y-2">
                {recentAgreements.map((agreement) => (
                  <div
                    key={agreement.id}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedAgreementId(agreement.id)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate flex-1">
                        {agreement.title}
                      </p>
                      <AgreementStatusBadge
                        status={agreement.status}
                        size="sm"
                        showIcon={false}
                      />
                    </div>
                    {agreement.buyer_name && (
                      <p className="text-xs text-gray-600 mb-1">
                        {agreement.buyer_name}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      {formatAgreementDate(agreement.updated_at || agreement.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* View All Link */}
        {agreements.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                // Navigate to SavedPage documents view
                window.location.href = "/saved?view=documents";
              }}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View All Agreements
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateAgreementModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      <AgreementDetailModal
        agreementId={selectedAgreementId}
        isOpen={!!selectedAgreementId}
        onClose={() => setSelectedAgreementId(null)}
      />
    </>
  );
}
