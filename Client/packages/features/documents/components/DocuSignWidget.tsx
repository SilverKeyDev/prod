import { useMemo, useState } from "react";

import { Clock, ExternalLink, FileSignature, Plus } from "lucide-react";

import { useDocusignAgreements } from "packages/features/documents/hooks/data/useDocusignAgreements";
import { BodyText, Button, Title } from "packages/ui/components/index.web";
import { KeyTurnLoader } from "packages/ui/components/index.web";
import { dateNow, dateParseISO } from "packages/utils/date";
import { getWindow } from "packages/utils/platform";

import AgreementStatusBadge from "@/features/documents/components/AgreementStatusBadge";
import { AgreementDetailModal, CreateAgreementModal } from "@/features/documents/components/modals";
import {
  daysSinceSent,
  formatAgreementDate,
  getUrgencyColor,
  getUrgencyLevel,
} from "@/features/documents/utils/docusignHelpers";
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
      .filter((a) => a.status === "sent" || a.status === "delivered" || a.status === "signed")
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
          !dateParseISO(a.completed_at).isBefore(oneWeekAgo)
      ).length,
      voidedThisMonth: agreements.filter(
        (a) =>
          a.status === "voided" && a.voided_at && !dateParseISO(a.voided_at).isBefore(oneMonthAgo)
      ).length,
    };
  }, [agreements, pendingSignatures]);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-center py-8">
          <KeyTurnLoader message="Loading agreements..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="py-8 text-center">
          <BodyText size="sm" className="text-red-600">
            Failed to load agreements
          </BodyText>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-blue-600" />
            <Title size="md">DocuSign Agreements</Title>
          </div>
          <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Create
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-orange-50 p-3 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.totalPending}</div>
            <BodyText size="xs" muted>
              Pending
            </BodyText>
          </div>
          <div className="rounded-lg bg-green-50 p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completedThisWeek}</div>
            <BodyText size="xs" muted>
              This Week
            </BodyText>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.voidedThisMonth}</div>
            <BodyText size="xs" muted>
              Voided
            </BodyText>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Pending Signatures */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <Title as="h3" size="sm" className="font-medium text-gray-900">
                Pending Signatures
              </Title>
            </div>
            {pendingSignatures.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 py-6 text-center">
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
                      className="cursor-pointer rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
                      onClick={() => setSelectedAgreementId(agreement.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedAgreementId(agreement.id);
                        }
                      }}
                    >
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <BodyText
                          as="p"
                          size="sm"
                          className="flex-1 truncate font-medium text-gray-900"
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
                        <BodyText as="p" size="xs" className="mb-1 text-gray-600">
                          {agreement.buyer_name}
                        </BodyText>
                      )}
                      <div className="flex items-center gap-1 text-xs">
                        <Clock className={`h-3 w-3 ${urgencyColor}`} />
                        <BodyText as="span" size="xs" className={urgencyColor}>
                          {daysWaiting} {daysWaiting === 1 ? "day" : "days"} waiting
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
            <div className="mb-3 flex items-center justify-between">
              <Title as="h3" size="sm" className="font-medium text-gray-900">
                Recent Agreements
              </Title>
            </div>
            {recentAgreements.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 py-6 text-center">
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
                    className="cursor-pointer rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
                    onClick={() => setSelectedAgreementId(agreement.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedAgreementId(agreement.id);
                      }
                    }}
                  >
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <BodyText
                        as="p"
                        size="sm"
                        className="flex-1 truncate font-medium text-gray-900"
                      >
                        {agreement.title}
                      </BodyText>
                      <AgreementStatusBadge status={agreement.status} size="sm" showIcon={false} />
                    </div>
                    {agreement.buyer_name && (
                      <BodyText as="p" size="xs" className="mb-1 text-gray-600">
                        {agreement.buyer_name}
                      </BodyText>
                    )}
                    <BodyText as="p" size="xs" className="text-gray-500">
                      {formatAgreementDate(agreement.updated_at || agreement.created_at)}
                    </BodyText>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* View All Link */}
        {agreements.length > 0 && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Navigate to SavedPage documents view
                const win = getWindow();
                if (win) win.location.href = "/saved?view=documents";
              }}
              className="flex h-auto items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              View All Agreements
              <ExternalLink className="h-3.5 w-3.5" />
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
