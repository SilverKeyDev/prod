import React from "react";

import { useLocalization } from "packages/contexts";

import { BodyText } from "@/components/ui/index.web";

import SectionBox from "./SectionBox";

type ErrorSectionProps = {
  errorMessage: string;
};

export function ErrorSection({
  errorMessage,
}: ErrorSectionProps): React.JSX.Element {
  const { t } = useLocalization();
  return (
    <SectionBox className="border-rose-100 bg-rose-50">
      <div className="text-responsive-sm text-center text-red-600">
        <BodyText as="p" className="mb-2 font-semibold">
          {t("negotiate.error_generating_strategy")}
        </BodyText>
        <BodyText as="p" size="sm" className="text-responsive-sm">
          {errorMessage}
        </BodyText>
      </div>
    </SectionBox>
  );
}
