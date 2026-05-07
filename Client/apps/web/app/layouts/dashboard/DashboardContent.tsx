import { lazy, type ReactNode, Suspense, useEffect } from "react";

import { useIsMobile } from "packages/hooks/ui";
import { log, LOG_CATEGORIES, type LogCategory } from "packages/logger";
import { Box } from "packages/ui/components/primitives";
import {
  shellRouteNavigateStart,
  traceLazyImport,
} from "packages/utils/perf/shellRouteLoadTiming";

import PageErrorBoundary from "@/app/error/PageErrorBoundary";

import {
  DashboardRouteFallback,
  type DashboardRouteFallbackVariant,
} from "./DashboardRouteFallback";
import { type DashboardAreaKey, useDashboardRoute } from "./useDashboardRoute";

const SearchPage = lazy(
  traceLazyImport(LOG_CATEGORIES.ROUTING, "lazy:SearchPage", () => import("@/pages/property/SearchPage"))
);
const SavedHomes = lazy(
  traceLazyImport(LOG_CATEGORIES.ROUTING, "lazy:SavedPage", () => import("@/pages/property/SavedPage"))
);
const ProfilePage = lazy(
  traceLazyImport(LOG_CATEGORIES.ROUTING, "lazy:ProfilePage", () => import("@/pages/account/ProfilePage"))
);
const DashboardPage = lazy(
  traceLazyImport(LOG_CATEGORIES.DASHBOARD, "lazy:DashboardPage", () =>
    import("@/pages/workspace/DashboardPage")
  )
);
const AgreementSigningCompletePage = lazy(
  traceLazyImport(LOG_CATEGORIES.ROUTING, "lazy:AgreementSigningCompletePage", () =>
    import("@/pages/workspace/AgreementSigningCompletePage")
  )
);
const FindAgentsPage = lazy(
  traceLazyImport(LOG_CATEGORIES.ROUTING, "lazy:FindAgentsPage", () => import("@/pages/misc/FindAgentsPage"))
);
const AgentPage = lazy(
  traceLazyImport(LOG_CATEGORIES.MESSAGES, "lazy:AgentPage", () => import("@/pages/workspace/AgentPage"))
);

type DashboardContentProps = {
  setMobileHeaderActions: React.Dispatch<React.SetStateAction<ReactNode | null>>;
  searchPageRef: React.RefObject<{
    triggerSearch: () => Promise<void>;
  }>;
  maxWidth?: number;
};

const MOBILE_SIDE_PX = "px-4";

function suspenseFallbackVariant(
  activeKey: DashboardAreaKey | null
): DashboardRouteFallbackVariant {
  if (activeKey === "search") return "search";
  if (activeKey === "messaging") return "messaging";
  if (activeKey === "dashboard") return "dashboard";
  return "generic";
}

function logCategoryForSuspenseVariant(variant: DashboardRouteFallbackVariant): LogCategory {
  if (variant === "messaging") return LOG_CATEGORIES.MESSAGES;
  if (variant === "dashboard") return LOG_CATEGORIES.DASHBOARD;
  return LOG_CATEGORIES.ROUTING;
}

function ReportingSuspenseFallback({ variant }: { variant: DashboardRouteFallbackVariant }) {
  useEffect(() => {
    const tVisible = performance.now();
    const cat = logCategoryForSuspenseVariant(variant);
    log.info(cat, "[PERF] Suspense fallback visible (lazy chunk loading)", { variant });
    return () => {
      log.info(cat, "[PERF] Suspense fallback hidden (chunk resolved or navigated away)", {
        variant,
        visibleMs: Math.round((performance.now() - tVisible) * 100) / 100,
      });
    };
  }, [variant]);
  return <DashboardRouteFallback variant={variant} />;
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
  const loadingFallback = <ReportingSuspenseFallback variant={fbVariant} />;

  useEffect(() => {
    if (activeKey === "dashboard") {
      shellRouteNavigateStart("dashboard", route.pathname);
    } else if (activeKey === "messaging") {
      shellRouteNavigateStart("messaging", route.pathname);
    }
  }, [activeKey, route.pathname]);

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
