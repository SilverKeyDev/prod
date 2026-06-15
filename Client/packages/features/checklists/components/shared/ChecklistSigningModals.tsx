import React, { lazy, Suspense } from "react";

import type { DashboardAgreementSigningSession } from "packages/features/dashboard/components/panels/DashboardAgreementSigningModals";

const DashboardAgreementSigningModals = lazy(
  () => import("packages/features/dashboard/components/panels/DashboardAgreementSigningModals")
);

type ChecklistSigningModalsProps = {
  agreementSigningSession: DashboardAgreementSigningSession | null;
  dismissAgreementSigning: () => void;
  onAgreementSigningComplete: () => void;
};

export function ChecklistSigningModals({
  agreementSigningSession,
  dismissAgreementSigning,
  onAgreementSigningComplete,
}: ChecklistSigningModalsProps) {
  if (agreementSigningSession == null) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <DashboardAgreementSigningModals
        agreementSigningSession={agreementSigningSession}
        dismissAgreementSigning={dismissAgreementSigning}
        onAgreementSigningComplete={onAgreementSigningComplete}
      />
    </Suspense>
  );
}
