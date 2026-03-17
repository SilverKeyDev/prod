import React from "react";

import { useLocalization } from "packages/contexts";
import { Box } from "packages/ui/components/primitives";

import { BodyText } from "@/components/ui";

import SectionBox from "./SectionBox";
type ErrorSectionProps = {
  errorMessage: string;
};

export function ErrorSection({ errorMessage }: ErrorSectionProps): React.JSX.Element {
  const { t } = useLocalization();
  return (
    <SectionBox className="border-destructive bg-primary-muted">
      <Box className="text-responsive-sm text-destructive text-center">
        <BodyText as="p" className="mb-2 font-semibold">
          {t("negotiate.error_generating_strategy")}
        </BodyText>
        <BodyText as="p" size="sm" className="text-responsive-sm">
          {errorMessage}
        </BodyText>
      </Box>
    </SectionBox>
  );
}
