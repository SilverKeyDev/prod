import { useCallback, useEffect, useMemo, useState } from "react";

import { Icon } from "@ui/icons";

import { CampaignCategorySection } from "packages/features/brokerage/components/campaigns/CampaignCategorySection";
import { CampaignRevenueProjectionSummary } from "packages/features/brokerage/components/campaigns/CampaignRevenueProjectionSummary";
import { CreateCampaignVariantModal } from "packages/features/brokerage/components/campaigns/CreateCampaignVariantModal";
import { useAncillaryAnalytics } from "packages/features/brokerage/hooks/useAncillaryAnalytics";
import {
  type CampaignVariantDraft,
  useCampaignCategories,
} from "packages/features/brokerage/hooks/useCampaigns";
import { useCampaignScrollActiveSection } from "packages/features/brokerage/hooks/useCampaignScrollActiveSection";
import type { CategoryCampaign } from "packages/features/brokerage/utils/campaigns/campaignFixtures";
import { buildCampaignRevenueProjections } from "packages/features/brokerage/utils/campaigns/campaignRevenueProjections";
import { scrollToCampaignSection } from "packages/features/brokerage/utils/campaigns/campaignScrollActiveSection";
import type { NavItem } from "packages/navigation";
import { BodyText } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import SidebarNavigation from "packages/ui/components/structure/sidebar/SidebarNavigation";
import { TwoColumnInsetPageLayout } from "packages/ui/components/structure/sidebar/TwoColumnInsetPageLayout";
import { getWindow } from "packages/utils/core/platform";

const CATEGORY_ICONS: Record<string, "shield" | "key" | "home" | "file" | "building"> = {
  title_insurance: "shield",
  mortgage: "key",
  homeowners_insurance: "home",
  home_warranty: "file",
  move_concierge: "building",
};

export function BrokerageCampaignsShell() {
  const { categories, sectionIds, addVariant, statusMessage, clearStatusMessage } =
    useCampaignCategories();
  const { data: ancillary } = useAncillaryAnalytics("year");
  const [activeSection, setActiveSection] = useState(sectionIds[0] ?? "");
  const [composerCategory, setComposerCategory] = useState<CategoryCampaign | null>(null);

  const projection = useMemo(
    () => buildCampaignRevenueProjections(categories, ancillary.total_transactions),
    [categories, ancillary.total_transactions]
  );

  const projectionByCategoryId = useMemo(() => {
    const map = new Map(projection.rows.map((row) => [row.categoryId, row] as const));
    return map;
  }, [projection.rows]);

  useCampaignScrollActiveSection(sectionIds, setActiveSection);

  useEffect(() => {
    if (!statusMessage) return;
    const win = getWindow();
    if (!win) return;
    const timer = win.setTimeout(() => clearStatusMessage(), 2500);
    return () => win.clearTimeout(timer);
  }, [statusMessage, clearStatusMessage]);

  const navItems = useMemo(
    (): NavItem[] =>
      categories.map((category) => {
        const iconName = CATEGORY_ICONS[category.id] ?? "mail";
        return {
          key: category.id,
          to: `#${category.id}`,
          label: category.label,
          icon: (props: { size?: number; className?: string }) => (
            <Icon name={iconName} {...props} />
          ),
        };
      }),
    [categories]
  );

  const handleNavClick = useCallback((itemKey: string) => {
    setActiveSection(itemKey);
    scrollToCampaignSection(itemKey);
  }, []);

  const handleSubmitVariant = useCallback(
    (draft: CampaignVariantDraft) => {
      if (!composerCategory) return;
      addVariant(composerCategory.id, draft);
    },
    [addVariant, composerCategory]
  );

  return (
    <TwoColumnInsetPageLayout
      maxWidthClassName="max-w-7xl"
      regionClassName="flex w-full flex-1 flex-col gap-6"
      sidebar={
        <SidebarNavigation
          sectionTitle="Campaigns"
          items={navItems}
          activeItem={activeSection}
          onItemClick={handleNavClick}
        />
      }
    >
      <Box className="flex w-full flex-col gap-6" data-testid="brokerage-campaigns-shell">
        {statusMessage ? (
          <BodyText
            size="sm"
            className="text-state-success"
            data-testid="campaign-status-banner"
            role="status"
          >
            {statusMessage}
          </BodyText>
        ) : null}
        <CampaignRevenueProjectionSummary projection={projection} />
        {categories.map((category) => {
          const yearProjection = projectionByCategoryId.get(category.id);
          if (!yearProjection) return null;
          return (
            <CampaignCategorySection
              key={category.id}
              category={category}
              yearProjection={yearProjection}
              onNewVariant={setComposerCategory}
            />
          );
        })}
      </Box>
      <CreateCampaignVariantModal
        isOpen={composerCategory !== null}
        category={composerCategory}
        onClose={() => setComposerCategory(null)}
        onSubmit={handleSubmitVariant}
      />
    </TwoColumnInsetPageLayout>
  );
}
