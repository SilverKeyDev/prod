import { useCallback, useEffect, useMemo, useState } from "react";

import { Icon } from "@ui/icons";

import { AnalyticsMotionSection } from "packages/features/brokerage/components/analytics/AnalyticsMotionSection";
import { CampaignCategorySection } from "packages/features/brokerage/components/campaigns/CampaignCategorySection";
import { CampaignEmailPreviewModal } from "packages/features/brokerage/components/campaigns/CampaignEmailPreviewModal";
import { CampaignLearningPanel } from "packages/features/brokerage/components/campaigns/CampaignLearningPanel";
import { CampaignRevenueProjectionSummary } from "packages/features/brokerage/components/campaigns/CampaignRevenueProjectionSummary";
import { CampaignSettingsModal } from "packages/features/brokerage/components/campaigns/CampaignSettingsModal";
import { CreateCampaignModal } from "packages/features/brokerage/components/campaigns/CreateCampaignModal";
import { CampaignVariantModal } from "packages/features/brokerage/components/campaigns/CreateCampaignVariantModal";
import {
  type CampaignSettingsDraft,
  type CampaignVariantContentDraft,
  type CampaignVariantDraft,
  useCampaignCategories,
} from "packages/features/brokerage/hooks/useCampaigns";
import { useCampaignScrollActiveSection } from "packages/features/brokerage/hooks/useCampaignScrollActiveSection";
import { YEAR_TRANSACTIONS } from "packages/features/brokerage/utils/brokerageDemoVolumeAssumptions";
import type {
  BuiltInCampaignCategoryId,
  CategoryCampaign,
  SampleEmail,
} from "packages/features/brokerage/utils/campaigns/campaignFixtures";
import { buildCampaignRevenueProjections } from "packages/features/brokerage/utils/campaigns/campaignRevenueProjections";
import { scrollToCampaignSection } from "packages/features/brokerage/utils/campaigns/campaignScrollActiveSection";
import type { NavItem } from "packages/navigation";
import { BodyText, Button, Title } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import SidebarNavigation from "packages/ui/components/structure/sidebar/SidebarNavigation";
import { TwoColumnInsetPageLayout } from "packages/ui/components/structure/sidebar/TwoColumnInsetPageLayout";
import type { IconName } from "packages/ui/types/icons";
import { getWindow } from "packages/utils/core/platform";

const CATEGORY_ICONS: Record<string, IconName> = {
  title_insurance: "shield",
  mortgage: "key",
  homeowners_insurance: "home",
  home_warranty: "file",
  move_concierge: "building",
  transaction_fall_off: "clock",
};

type EmailModalTarget = {
  category: CategoryCampaign;
  email: SampleEmail;
};

export function BrokerageCampaignsShell() {
  const {
    categories,
    sectionIds,
    addVariant,
    updateVariant,
    updateCampaignSettings,
    removeControl,
    includeControl,
    addTemplateCampaign,
    addCustomCampaign,
    statusMessage,
    clearStatusMessage,
  } = useCampaignCategories();
  const [activeSection, setActiveSection] = useState(sectionIds[0] ?? "");
  const [composerCategory, setComposerCategory] = useState<CategoryCampaign | null>(null);
  const [previewTarget, setPreviewTarget] = useState<EmailModalTarget | null>(null);
  const [editTarget, setEditTarget] = useState<EmailModalTarget | null>(null);
  const [settingsTarget, setSettingsTarget] = useState<CategoryCampaign | null>(null);
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);

  const projection = useMemo(
    () => buildCampaignRevenueProjections(categories, YEAR_TRANSACTIONS),
    [categories]
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

  const handleUpdateVariant = useCallback(
    (draft: CampaignVariantContentDraft) => {
      if (!editTarget) return;
      updateVariant(editTarget.category.id, editTarget.email.id, draft);
    },
    [editTarget, updateVariant]
  );

  const handleSaveSettings = useCallback(
    (draft: CampaignSettingsDraft) => {
      if (!settingsTarget) return;
      updateCampaignSettings(settingsTarget.id, draft);
    },
    [settingsTarget, updateCampaignSettings]
  );

  const handleSelectTemplate = useCallback(
    (templateId: BuiltInCampaignCategoryId) => {
      const result = addTemplateCampaign(templateId);
      setIsCreateCampaignOpen(false);
      setActiveSection(result.categoryId);
      const win = getWindow();
      if (win) {
        win.requestAnimationFrame(() => scrollToCampaignSection(result.categoryId));
      } else {
        scrollToCampaignSection(result.categoryId);
      }
    },
    [addTemplateCampaign]
  );

  const handleCreateCustom = useCallback(
    (name: string, description?: string) => {
      const categoryId = addCustomCampaign(name, description);
      setActiveSection(categoryId);
      const win = getWindow();
      if (win) {
        win.requestAnimationFrame(() => scrollToCampaignSection(categoryId));
      } else {
        scrollToCampaignSection(categoryId);
      }
    },
    [addCustomCampaign]
  );

  return (
    <TwoColumnInsetPageLayout
      maxWidthClassName="max-w-none"
      regionClassName="flex w-full min-w-0 flex-1 flex-col gap-6"
      sidebar={
        <SidebarNavigation
          sectionTitle="Campaigns"
          items={navItems}
          activeItem={activeSection}
          onItemClick={handleNavClick}
          footerContent={
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="w-full"
              onClick={() => setIsCreateCampaignOpen(true)}
              data-testid="new-campaign-sidebar-button"
            >
              New campaign
            </Button>
          }
        />
      }
    >
      <Box className="flex w-full min-w-0 flex-col gap-6" data-testid="brokerage-campaigns-shell">
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
        <AnalyticsMotionSection index={0} testId="campaigns-section-hero">
          <CampaignRevenueProjectionSummary projection={projection} />
        </AnalyticsMotionSection>
        <AnalyticsMotionSection index={1} testId="campaigns-section-learning-loop">
          <Box
            id="learning-loop"
            className="border-border bg-background-surface scroll-mt-24 rounded-xl border p-5"
          >
            <Title size="sm" as="h2" className="mb-1">
              Campaign learning loop
            </Title>
            <BodyText size="xs" muted className="mb-4">
              SIL-309 — model picks winners from seeded A/B results, reviews what worked, drafts the
              next variant pair for approval
            </BodyText>
            <CampaignLearningPanel />
          </Box>
        </AnalyticsMotionSection>
        {categories.map((category, index) => (
          <AnalyticsMotionSection
            key={category.id}
            index={index + 2}
            testId={`campaigns-section-${category.id}`}
          >
            <CampaignCategorySection
              category={category}
              yearProjection={projectionByCategoryId.get(category.id)}
              onNewVariant={setComposerCategory}
              onOpenSettings={setSettingsTarget}
              onOpenEmail={(cat, email) => setPreviewTarget({ category: cat, email })}
              onEditEmail={(cat, email) => setEditTarget({ category: cat, email })}
              onRemoveControl={removeControl}
              onIncludeControl={includeControl}
            />
          </AnalyticsMotionSection>
        ))}
      </Box>
      <CampaignVariantModal
        isOpen={composerCategory !== null}
        mode="create"
        category={composerCategory}
        onClose={() => setComposerCategory(null)}
        onSubmit={handleSubmitVariant}
      />
      <CampaignVariantModal
        isOpen={editTarget !== null}
        mode="edit"
        category={editTarget?.category ?? null}
        email={editTarget?.email ?? null}
        onClose={() => setEditTarget(null)}
        onSubmit={handleSubmitVariant}
        onUpdate={handleUpdateVariant}
      />
      <CampaignEmailPreviewModal
        isOpen={previewTarget !== null}
        email={previewTarget?.email ?? null}
        categoryLabel={previewTarget?.category.label}
        onClose={() => setPreviewTarget(null)}
      />
      <CampaignSettingsModal
        isOpen={settingsTarget !== null}
        category={settingsTarget}
        onClose={() => setSettingsTarget(null)}
        onSave={handleSaveSettings}
      />
      <CreateCampaignModal
        isOpen={isCreateCampaignOpen}
        activeCategoryIds={sectionIds}
        onClose={() => setIsCreateCampaignOpen(false)}
        onSelectTemplate={handleSelectTemplate}
        onCreateCustom={handleCreateCustom}
      />
    </TwoColumnInsetPageLayout>
  );
}
