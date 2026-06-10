import React from "react";

import { useLocalization } from "packages/contexts";
import { Loading } from "packages/ui/components/media/asset/loading/Loading";
import { Box } from "packages/ui/components/structure/primitives";

import { BodyText, Subtitle } from "@/components/ui";

import SectionBox from "./SectionBox";

export function LoadingSection(): React.JSX.Element {
  const { t } = useLocalization();

  return (
    <Box className="space-y-6">
      {/* Main loading indicator */}
      <SectionBox>
        <Box className="flex flex-col items-center justify-center py-8">
          <Loading message={t("negotiate.loading.analyzing")} />
          <BodyText size="xs" muted className="mt-6 text-center">
            {t("negotiate.loading.description")}
          </BodyText>
        </Box>
      </SectionBox>

      {/* Skeleton for comparables section */}
      <Box className="my-responsive-lg">
        <Subtitle size="sm" muted className="mb-4 animate-pulse">
          {t("negotiate.loading.finding_comparables")}
        </Subtitle>
        <Box className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <Box
              key={i}
              className="bg-background-surface border-border h-64 w-72 flex-shrink-0 animate-pulse rounded-lg border"
            />
          ))}
        </Box>
      </Box>

      {/* Skeleton for opening offer */}
      <Box className="my-responsive-lg">
        <Box className="bg-primary/10 animate-pulse rounded-lg p-6">
          <Box className="flex items-center gap-3">
            <Box className="bg-primary/20 h-8 w-8 flex-shrink-0 rounded-full" />
            <Box className="flex-1 space-y-2">
              <Box className="bg-primary/20 h-4 w-48 rounded" />
              <Box className="bg-primary/30 h-10 w-64 rounded" />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Skeleton for strategy section */}
      <Box className="my-responsive-lg space-y-3">
        <Box className="bg-background-surface border-border h-6 w-64 animate-pulse rounded border" />
        <Box className="bg-background-surface border-border h-32 animate-pulse rounded border" />
        <Box className="bg-background-surface border-border h-6 w-48 animate-pulse rounded border" />
        <Box className="bg-background-surface border-border h-24 animate-pulse rounded border" />
      </Box>
    </Box>
  );
}
