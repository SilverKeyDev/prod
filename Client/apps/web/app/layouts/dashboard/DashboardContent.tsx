import { lazy, type ReactNode, Suspense, useEffect, useRef } from "react";

import { WorkspacePlaceholderPage } from "packages/features/workspace";
import { useActiveWorkspace } from "packages/hooks/store";
import { useIsMobile } from "packages/hooks/ui";
import { log, type LogCategory } from "packages/logger";
import { Box } from "packages/ui/components/structure/primitives";
import {
  shellRouteNavigateStart,
  traceLazyImport,
} from "packages/utils/core/perf/shellRouteLoadTiming";
import { isPlaceholderWorkspace } from "packages/utils/product/workspace";

import PageErrorBoundary from "@/app/error/PageErrorBoundary";

import {
  DashboardRouteFallback,
  type DashboardRouteFallbackVariant,
} from "./DashboardRouteFallback";
import { type DashboardAreaKey, useDashboardRoute } from "./useDashboardRoute";

const SearchPage = lazy(
  traceLazyImport("ROUTING", "lazy:SearchPage", () => import("@/pages/property/SearchPage"))
);
const SavedHomes = lazy(
  traceLazyImport("ROUTING", "lazy:LibraryPage", () => import("@/pages/property/LibraryPage"))
);
const ProfilePage = lazy(
  traceLazyImport("ROUTING", "lazy:ProfilePage", () => import("@/pages/account/ProfilePage"))
);
const BrokerageDashboardPage = lazy(
  traceLazyImport(
    "DASHBOARD",
    "lazy:BrokerageDashboardPage",
    () => import("@/pages/workspace/BrokerageDashboardPage")
  )
);
const IntegrationPartnerDashboardPage = lazy(
  traceLazyImport(
    "DASHBOARD",
    "lazy:IntegrationPartnerDashboardPage",
    () => import("@/pages/workspace/IntegrationPartnerDashboardPage")
  )
);
const SellerDashboardPage = lazy(
  traceLazyImport(
    "DASHBOARD",
    "lazy:SellerDashboardPage",
    () => import("@/pages/workspace/SellerDashboardPage")
  )
);
const RenterDashboardPage = lazy(
  traceLazyImport(
    "DASHBOARD",
    "lazy:RenterDashboardPage",
    () => import("@/pages/workspace/RenterDashboardPage")
  )
);
const DashboardPage = lazy(
  traceLazyImport(
    "DASHBOARD",
    "lazy:DashboardPage",
    () => import("@/pages/workspace/DashboardPage")
  )
);
const AgreementSigningCompletePage = lazy(
  traceLazyImport(
    "ROUTING",
    "lazy:AgreementSigningCompletePage",
    () => import("@/pages/workspace/AgreementSigningCompletePage")
  )
);
const AgentPage = lazy(
  traceLazyImport("MESSAGES", "lazy:AgentPage", () => import("@/pages/workspace/AgentPage"))
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
  if (variant === "messaging") return "MESSAGES";
  if (variant === "dashboard") return "DASHBOARD";
  return "ROUTING";
}

function ReportingSuspenseFallback({ variant }: { variant: DashboardRouteFallbackVariant }) {
  useEffect(() => {
    const tVisible = performance.now();
    const cat = logCategoryForSuspenseVariant(variant);
    log.info(cat, "[PERF] Suspense fallback visible (lazy chunk loading)", {
      variant,
    });
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
  const activeWorkspace = useActiveWorkspace();

  const { activeKey, isSearch, isMessaging, widthPercent } = route;
  const placeholderShell = isPlaceholderWorkspace(activeWorkspace);
  const showPlaceholderForRoute =
    placeholderShell &&
    activeKey !== "dashboard" &&
    activeKey !== "messaging" &&
    activeKey !== null;
  const contentTopMargin =
    route.isDashboard || route.isProfile || route.isFindAgents || route.isAnalytics;
  const contentBottomMargin =
    route.isDashboard ||
    route.isProfile ||
    route.isLibrary ||
    route.isFindAgents ||
    route.isAnalytics ||
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
      ? "relative mx-0 flex min-h-0 w-full flex-1 flex-col overflow-hidden"
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

  const shellNavPerfDedupRef = useRef<{ key: string; at: number } | null>(null);

  useEffect(() => {
    if (activeKey !== "dashboard" && activeKey !== "messaging") return;
    const routeKey = activeKey === "dashboard" ? "dashboard" : "messaging";
    const dedupeKey = `${routeKey}|${route.pathname}`;
    const now = performance.now();
    const prev = shellNavPerfDedupRef.current;
    if (prev && prev.key === dedupeKey && now - prev.at < 48) {
      return;
    }
    shellNavPerfDedupRef.current = { key: dedupeKey, at: now };
    shellRouteNavigateStart(routeKey, route.pathname);
  }, [activeKey, route.pathname]);

  const content = showPlaceholderForRoute ? (
    <WorkspacePlaceholderPage workspace={activeWorkspace} />
  ) : activeKey === "search" ? (
    <PageErrorBoundary key="search" pageLabel="Search">
      <Suspense fallback={loadingFallback}>
        <SearchPage setMobileHeaderActions={setMobileHeaderActions} searchRef={searchPageRef} />
      </Suspense>
    </PageErrorBoundary>
  ) : activeKey === "profile" ? (
    <Suspense fallback={loadingFallback}>
      <ProfilePage setMobileHeaderActions={setMobileHeaderActions} />
    </Suspense>
  ) : activeKey === "library" ? (
    <PageErrorBoundary key="library" pageLabel="Library">
      <Suspense fallback={loadingFallback}>
        <SavedHomes setMobileHeaderActions={setMobileHeaderActions} />
      </Suspense>
    </PageErrorBoundary>
  ) : activeKey === "messaging" ? (
    placeholderShell ? (
      <WorkspacePlaceholderPage workspace={activeWorkspace} />
    ) : (
      <PageErrorBoundary key="messaging" pageLabel="Messaging">
        <Suspense fallback={loadingFallback}>
          <AgentPage setMobileHeaderActions={setMobileHeaderActions} />
        </Suspense>
      </PageErrorBoundary>
    )
  ) : activeKey === "dashboard" ? (
    <Suspense fallback={loadingFallback}>
      {activeWorkspace === "brokerage" ? (
        <BrokerageDashboardPage />
      ) : activeWorkspace === "integration_partner" ? (
        <IntegrationPartnerDashboardPage />
      ) : activeWorkspace === "seller" ? (
        <SellerDashboardPage />
      ) : activeWorkspace === "renter" ? (
        <RenterDashboardPage />
      ) : (
        <DashboardPage setMobileHeaderActions={setMobileHeaderActions} />
      )}
    </Suspense>
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
