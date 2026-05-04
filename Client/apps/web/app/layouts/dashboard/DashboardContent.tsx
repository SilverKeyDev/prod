import { lazy, type ReactNode, Suspense } from "react";

import { useIsMobile } from "packages/hooks/ui";
import { Box } from "packages/ui/components/primitives";

import PageErrorBoundary from "@/app/error/PageErrorBoundary";

import { DashboardRouteFallback, type DashboardRouteFallbackVariant } from "./DashboardRouteFallback";
import { type DashboardAreaKey, useDashboardRoute } from "./useDashboardRoute";

const SearchPage = lazy(() => import("@/pages/property/SearchPage"));
const SavedHomes = lazy(() => import("@/pages/property/SavedPage"));
const ProfilePage = lazy(() => import("@/pages/account/ProfilePage"));
const DashboardPage = lazy(() => import("@/pages/workspace/DashboardPage"));
const AgreementSigningCompletePage = lazy(
  () => import("@/pages/workspace/AgreementSigningCompletePage")
);
const FindAgentsPage = lazy(() => import("@/pages/misc/FindAgentsPage"));
const AgentPage = lazy(() => import("@/pages/workspace/AgentPage"));

type DashboardContentProps = {
  setMobileHeaderActions: React.Dispatch<React.SetStateAction<ReactNode | null>>;
  searchPageRef: React.RefObject<{
    triggerSearch: () => Promise<void>;
  }>;
  maxWidth?: number;
};

const MOBILE_SIDE_PX = "px-4";

function suspenseFallbackVariant(activeKey: DashboardAreaKey | null): DashboardRouteFallbackVariant {
  if (activeKey === "search") return "search";
  if (activeKey === "messaging") return "messaging";
  if (activeKey === "dashboard") return "dashboard";
  return "generic";
}

export function DashboardContent({
  setMobileHeaderActions,
  searchPageRef,
  maxWidth = 85,
}: DashboardContentProps) {
  const route = useDashboardRoute(maxWidth);
  const isMobile = useIsMobile();

  const { activeKey, isSearch, isMessaging, widthPercent } = route;
  const contentTopMargin = route.isDashboard || route.isProfile || route.isFindAgents;
  const contentBottomMargin =
    route.isDashboard ||
    route.isProfile ||
    route.isSaved ||
    route.isFindAgents ||
    route.isAgreementSigningComplete;

  const searchHeightClass =
    isSearch && isMobile
      ? "flex-1 min-h-0 overflow-hidden md:h-[calc(100dvh-0px)] mx-0"
      : isSearch
        ? "h-[calc(100dvh-80px)] md:h-[calc(100dvh-0px)] mx-0"
        : "";

  const wrapperClass = isSearch
    ? searchHeightClass
    : isMessaging
      ? "relative mx-0 flex max-h-full min-h-0 w-full flex-1 flex-col overflow-hidden"
      : `mx-auto ${MOBILE_SIDE_PX} md:px-0 ${
          contentTopMargin ? "pt-4 md:pt-8" : ""
        } ${contentBottomMargin ? "pb-4 sm:pb-6 md:pb-8" : ""}`;

  const fullWidth = isSearch || isMessaging;
  const style = fullWidth
    ? ({ "--max-width-desktop": "100" } as React.CSSProperties & {
        "--max-width-desktop": string;
      })
    : ({
        "--max-width-desktop": `${widthPercent}`,
      } as React.CSSProperties & { "--max-width-desktop": string });

  const fbVariant = suspenseFallbackVariant(activeKey);
  const loadingFallback = <DashboardRouteFallback variant={fbVariant} />;

  const content =
    activeKey === "search" ? (
      <PageErrorBoundary key="search" pageLabel="Search">
        <Suspense fallback={loadingFallback}>
          <SearchPage setMobileHeaderActions={setMobileHeaderActions} searchRef={searchPageRef} />
        </Suspense>
      </PageErrorBoundary>
    ) : activeKey === "profile" ? (
      <Suspense fallback={loadingFallback}>
        <ProfilePage setMobileHeaderActions={setMobileHeaderActions} />
      </Suspense>
    ) : activeKey === "saved" ? (
      <PageErrorBoundary key="saved" pageLabel="Saved">
        <Suspense fallback={loadingFallback}>
          <SavedHomes setMobileHeaderActions={setMobileHeaderActions} />
        </Suspense>
      </PageErrorBoundary>
    ) : activeKey === "messaging" ? (
      <PageErrorBoundary key="messaging" pageLabel="Messaging">
        <Suspense fallback={loadingFallback}>
          <AgentPage setMobileHeaderActions={setMobileHeaderActions} />
        </Suspense>
      </PageErrorBoundary>
    ) : activeKey === "dashboard" ? (
      <Suspense fallback={loadingFallback}>
        <DashboardPage setMobileHeaderActions={setMobileHeaderActions} />
      </Suspense>
    ) : activeKey === "find_agents" ? (
      <PageErrorBoundary key="find-agents" pageLabel="Find agents">
        <Suspense fallback={loadingFallback}>
          <FindAgentsPage setMobileHeaderActions={setMobileHeaderActions} />
        </Suspense>
      </PageErrorBoundary>
    ) : activeKey === "agreement_signing_complete" ? (
      <PageErrorBoundary key="agreement-signing-complete" pageLabel="Signing">
        <Suspense fallback={loadingFallback}>
          <AgreementSigningCompletePage />
        </Suspense>
      </PageErrorBoundary>
    ) : null;

  const displayContent = content ?? (
    <DashboardRouteFallback variant={suspenseFallbackVariant(activeKey)} />
  );

  return (
    <Box
      key={route.pathname}
      className={`dashboard-content w-full min-w-0 ${wrapperClass}`}
      style={style}
    >
      {displayContent}
    </Box>
  );
}
