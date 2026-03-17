import React from "react";

import { useLocalization } from "packages/contexts";

import { CardCarousel } from "@/components/cards/base";

import CompCard from "./CompCard";
import SectionTitle from "./SectionTitle";

type ComparablesSectionProps = {
  compsData: unknown;
  isLoading: boolean;
};

export function ComparablesSection({
  compsData,
  isLoading,
}: ComparablesSectionProps): React.JSX.Element | null {
  const { t } = useLocalization();
  // Check if compsData has valid structure
  const hasValidComps =
    compsData &&
    typeof compsData === "object" &&
    "success" in compsData &&
    (compsData as { success: boolean }).success &&
    "data" in compsData &&
    Boolean((compsData as { data: unknown }).data) &&
    typeof (compsData as { data: unknown }).data === "object" &&
    "comps" in (compsData as { data: Record<string, unknown> }).data;

  if (!hasValidComps || isLoading) {
    return null;
  }

  const compsArray = Array.isArray((compsData as { data?: { comps?: unknown } })?.data?.comps)
    ? (compsData as { data: { comps: unknown[] } }).data.comps
    : ([] as unknown[]);

  return (
    <div className="my-responsive-lg">
      <SectionTitle className="!text-text-secondary">
        {t("negotiate.comparables_title")}
      </SectionTitle>
      <CardCarousel
        items={compsArray}
        loading={false}
        error={null}
        emptyMessage={t("negotiate.comparables_empty")}
        renderItem={(comp) =>
          comp && typeof comp === "object" ? (
            <CompCard
              comp={comp as unknown as import("../../components/cards/CompCard").CompData}
            />
          ) : null
        }
        getItemKey={(comp) =>
          comp &&
          typeof comp === "object" &&
          "zpid" in comp &&
          typeof (comp as { zpid?: unknown }).zpid === "number"
            ? String((comp as { zpid: number }).zpid)
            : "unknown"
        }
        cardMinWidth={280}
        cardGap={16}
        infiniteLoop={false}
        ariaLabel="Property comparables carousel"
      />
    </div>
  );
}
