import React from "react";

import { CreditCard, DollarSign } from "lucide-react";

import type { ClientFinancialSnapshot } from "packages/schemas/agent";

import SectionCard from "@/components/layout/SectionCard";
import StatusBadge from "@/components/ui/asset/StatusBadge";
import { BodyText, Title } from "@/components/ui/index.web";

type FinancialSnapshotProps = {
  financial: ClientFinancialSnapshot;
};

const FinancialSnapshot: React.FC<FinancialSnapshotProps> = ({ financial }) => {
  const formatCurrency = (amount?: number) => {
    if (!amount) return "Not set";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPreApprovalBadge = () => {
    const statusConfig = {
      not_started: { variant: "default" as const, label: "Not Started" },
      in_progress: { variant: "processing" as const, label: "In Progress" },
      approved: { variant: "success" as const, label: "Approved" },
      denied: { variant: "error" as const, label: "Denied" },
      pending: { variant: "warning" as const, label: "Pending" },
    };
    const config = statusConfig[financial.pre_approval_status];
    return (
      <StatusBadge text={config.label} variant={config.variant} size="md" />
    );
  };

  const loanTypeLabels: Record<string, string> = {
    conventional: "Conventional",
    fha: "FHA",
    va: "VA",
    usda: "USDA",
    cash: "Cash",
    other: "Other",
  };

  return (
    <SectionCard title="Financial Snapshot" icon={CreditCard}>
      <div className="space-y-6">
        {/* Pre-Approval Status */}
        <div>
          <Title as="h3" size="md" className="font-semibold text-navy mb-3">
            Pre-Approval Status
          </Title>
          <div className="flex items-center gap-3">
            {getPreApprovalBadge()}
            {financial.pre_approval_amount && (
              <BodyText as="span" size="sm" className="text-black/60">
                up to {formatCurrency(financial.pre_approval_amount)}
              </BodyText>
            )}
          </div>
        </div>

        {/* Loan Type */}
        {financial.loan_type && (
          <div>
            <Title as="h3" size="md" className="font-semibold text-navy mb-3">
              Loan Type
            </Title>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-olive" />
              <BodyText as="span" size="sm" className="text-black">
                {loanTypeLabels[financial.loan_type] || financial.loan_type}
              </BodyText>
            </div>
          </div>
        )}

        {/* Cash to Close */}
        {financial.cash_to_close && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-5 w-5 text-gold" />
              <Title as="h3" size="md" className="font-semibold text-navy">
                Cash to Close
              </Title>
            </div>
            <BodyText as="p" size="lg" className="font-semibold text-black">
              {formatCurrency(financial.cash_to_close)}
            </BodyText>
          </div>
        )}
      </div>
    </SectionCard>
  );
};

export default FinancialSnapshot;
