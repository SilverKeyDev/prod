import { useMemo, useState } from "react";

import { Clock, ExternalLink, FileSignature, Plus } from "lucide-react";

import { useDocusignAgreements } from "packages/hooks/data/documents/useDocusignAgreements";
import { dateNow, dateParseISO } from "packages/utils/core/date";
import {
  daysSinceSent,
  formatAgreementDate,
  getUrgencyColor,
  getUrgencyLevel,
} from "packages/utils/domain/documents/docusignHelpers";

import { BodyText, Button, Title } from "@/components/ui/index.web";
import { KeyTurnLoader } from "@/components/ui/index.web";
import AgreementStatusBadge from "@/features/documents/docusign/components/AgreementStatusBadge";
import {
  AgreementDetailModal,
  CreateAgreementModal,
} from "@/features/documents/docusign/modals";
/**
 * DocuSignWidget Component
 *
 * Dashboard widget showing pending signatures and recent agreements
 * Two-column layout: pending signatures on left, recent agreements on right
 */
export default function DocuSignWidget() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(
    null,
  );

  const { agreements, isLoading, error } = useDocusignAgreements();

  // Filter pending signatures (sent, delivered, or partially signed)
  const pendingSignatures = useMemo(() => {
    return agreements
      .filter(
        (a) =>
          a.status === "sent" ||
          a.status === "delivered" ||
          a.status === "signed",
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
        const dateA = dateParseISO(a.updated_at || a.created_at).valueOf();
        const dateB = dateParseISO(b.updated_at || b.created_at).valueOf();
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [agreements]);

  // Summary stats
  const stats = useMemo(() => {
    const now = dateNow();
    const oneWeekAgo = now.subtract(7, "day");
    const oneMonthAgo = now.subtract(30, "day");

    return {
      totalPending: pendingSignatures.length,
      completedThisWeek: agreements.filter(
        (a) =>
          a.status === "completed" &&
          a.completed_at &&
          !dateParseISO(a.completed_at).isBefore(oneWeekAgo),
      ).length,
      voidedThisMonth: agreements.filter(
        (a) =>
          a.status === "voided" &&
          a.voided_at &&
          !dateParseISO(a.voided_at).isBefore(oneMonthAgo),
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
              <Title as="h3" size="sm" className="font-medium text-gray-900">
                Pending Signatures
              </Title>
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
                      role="button"
                      tabIndex={0}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedAgreementId(agreement.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedAgreementId(agreement.id);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <BodyText
                          as="p"
                          size="sm"
                          className="font-medium text-gray-900 truncate flex-1"
                        >
                          {agreement.title}
                        </BodyText>
                        <AgreementStatusBadge
                          status={agreement.status}
                          size="sm"
                          showIcon={false}
                        />
                      </div>
                      {agreement.buyer_name && (
                        <BodyText
                          as="p"
                          size="xs"
                          className="text-gray-600 mb-1"
                        >
                          {agreement.buyer_name}
                        </BodyText>
                      )}
                      <div className="flex items-center gap-1 text-xs">
                        <Clock className={`w-3 h-3 ${urgencyColor}`} />
                        <BodyText as="span" size="xs" className={urgencyColor}>
                          {daysWaiting} {daysWaiting === 1 ? "day" : "days"}{" "}
                          waiting
                        </BodyText>
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
              <Title as="h3" size="sm" className="font-medium text-gray-900">
                Recent Agreements
              </Title>
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
                    role="button"
                    tabIndex={0}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedAgreementId(agreement.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedAgreementId(agreement.id);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <BodyText
                        as="p"
                        size="sm"
                        className="font-medium text-gray-900 truncate flex-1"
                      >
                        {agreement.title}
                      </BodyText>
                      <AgreementStatusBadge
                        status={agreement.status}
                        size="sm"
                        showIcon={false}
                      />
                    </div>
                    {agreement.buyer_name && (
                      <BodyText as="p" size="xs" className="text-gray-600 mb-1">
                        {agreement.buyer_name}
                      </BodyText>
                    )}
                    <BodyText as="p" size="xs" className="text-gray-500">
                      {formatAgreementDate(
                        agreement.updated_at || agreement.created_at,
                      )}
                    </BodyText>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* View All Link */}
        {agreements.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Navigate to SavedPage documents view
                window.location.href = "/saved?view=documents";
              }}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 h-auto"
            >
              View All Agreements
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
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
