// React imports
import React, { useState, useMemo, useCallback, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Headers
import PageHeader from "../../components/widgets/header/PageHeader.tsx";
import GenerateReportPage from "../../features/decide/generate/GenerateReport.tsx";
import ClosePageHeader from "../../features/close/ClosePageHeader.tsx";
import DashboardButtonHeader from "../../features/dashboard/DashboardButtonHeader.tsx";
import MobileTopBar from "../../components/widgets/header/MobileTopBar";

// Pages
import BuyerChecklists from "../../pages/BuyerChecklistsPage.tsx";
import DashboardPage from "../../pages/DashboardPage.tsx";
import NegotiationStrategy from "../../pages/NegotiationPage.tsx";
import PersonalizationPage from "../../pages/PersonalizationPage.tsx";
import SavedHomes from "../../pages/SavedPage.tsx";
import SearchPage from "../../pages/SearchPage.tsx";

// Stores
import {
  useViewStore,
  type ViewState,
} from "../../../../packages/store/view.slice";
import { useFiltersStore } from "../../../../packages/store";

// Sidebar
import {
  getTabByPath,
  SIDEBAR_TABS,
} from "../../../../packages/schemas/sidebar";
import MobileSidebar from "../../components/widgets/sidebar/MobileSidebar.tsx";
import Sidebar from "../../components/widgets/sidebar/Sidebar.tsx";
import type { UserProfile } from "../../../../packages/schemas/user";

type HeaderConfig =
  | { type: "rheader"; title: string; subtitle?: string }
  | { type: "none"; title?: string; subtitle?: string };

type ClosePageHeaderData = {
  title: string;
  subtitle: string;
  completedCount: number;
  totalCount: number;
  loading: boolean;
};

type DashboardProps = {
  user?: UserProfile;
  onLogout: () => void;
  header?: HeaderConfig;
  mobileHeader?: React.ReactNode; // Allow passing a custom mobile header
  maxWidth?: number; // Percentage of viewport width (e.g., 85 => 85vw)
};

// Page-specific width configuration
type PageWidthConfig = Record<string, number>;
const PAGE_WIDTH_CONFIG: PageWidthConfig = {
  "/search": 100,
  "/buyer-checklists": 95,
};

// Buyer checklist tabs
type ChecklistTab = "escrow" | "inspections" | "financing" | "closing";
const CHECKLIST_TABS: ChecklistTab[] = [
  "escrow",
  "inspections",
  "financing",
  "closing",
];

// Mobile layout constants to match MobileTopBar / sidebar button spacing
const MOBILE_SIDE_PX = "px-4"; // keep children aligned with the button padding
const MOBILE_TOP_SPACER_CLASS = "transition-all duration-300 ease-in-out"; // matches old pattern

export default function DashboardLayout({
  user,
  onLogout,
  header,
  mobileHeader,
  maxWidth = 85, // Default to 85% if not specified
}: DashboardProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const search = location.search;

  // Route helpers
  const isSearch = path.startsWith("/search");
  const isBuyerChecklists = path.startsWith("/buyer-checklists");
  const isDashboard = path.startsWith("/dashboard");
  const isPersonalization = path.startsWith("/personalization");
  const isNegotiation = path.startsWith("/negotiation-strategy");
  const isSaved = path.startsWith("/saved");

  // Sidebar state
  const sidebarExpanded = useViewStore((s: ViewState) => s.sidebarExpanded);
  const setSidebarExpanded = useViewStore(
    (s: ViewState) => s.setSidebarExpanded
  );
  const toggleSidebar = useCallback(
    () => setSidebarExpanded(!sidebarExpanded),
    [setSidebarExpanded, sidebarExpanded]
  );

  // Persisted buyer-checklists tab state
  const persistedTab = useViewStore(
    (s: ViewState) =>
      s.dropdownSelections["buyerChecklists.activeTab"] as
        | ChecklistTab
        | undefined
  );
  const setDropdownSelection = useViewStore(
    (s: ViewState) => s.setDropdownSelection
  );

  const initialTab = useMemo<ChecklistTab>(() => {
    return persistedTab && CHECKLIST_TABS.includes(persistedTab)
      ? persistedTab
      : "escrow";
  }, [persistedTab]);

  const [buyerChecklistsActiveTab, setBuyerChecklistsActiveTab] =
    useState<ChecklistTab>(initialTab);

  React.useEffect(() => {
    setDropdownSelection(
      "buyerChecklists.activeTab",
      buyerChecklistsActiveTab as string
    );
  }, [buyerChecklistsActiveTab, setDropdownSelection]);

  // Mobile header actions + ClosePageHeader data
  const [mobileHeaderActions, setMobileHeaderActions] =
    useState<ReactNode | null>(null);
  const [closePageHeaderData, setClosePageHeaderData] =
    useState<ClosePageHeaderData | null>(null);

  // Search functionality
  const isSearching = useFiltersStore((s) => s.isSearching);
  const searchPageRef = React.useRef<{
    triggerSearch: () => Promise<void>;
  } | null>(null);

  // Search handlers
  const handleUpdatePreferences = useCallback(() => {
    navigate("/dashboard/personalization");
  }, [navigate]);

  const handleSearchProperties = useCallback(async () => {
    // Trigger search through the SearchPage ref
    if (searchPageRef.current) {
      await searchPageRef.current.triggerSearch();
    }
  }, []);

  // Page width (vw)
  const computedMaxWidthVW = useMemo(() => {
    const configPath = Object.keys(PAGE_WIDTH_CONFIG).find((p) =>
      path.startsWith(p)
    );
    const width = configPath ? PAGE_WIDTH_CONFIG[configPath] : (maxWidth ?? 85);
    return Math.max(0, Math.min(100, width)); // Clamp to [0,100]
  }, [path, maxWidth]);

  // Header configuration (stable default)
  const config: HeaderConfig = useMemo(() => {
    if (header) return header;

    if (isSearch) {
      const tab = getTabByPath(path);
      return { type: "none", title: tab?.name ?? "Search" };
    }

    if (isPersonalization) {
      const tab = getTabByPath(path);
      return {
        type: "rheader",
        title: tab?.name ?? "Personalization",
        subtitle: tab?.description ?? "Customize your home search preferences",
      };
    }

    if (isNegotiation) {
      const tab = getTabByPath(path);
      return {
        type: "rheader",
        title: tab?.name ?? "Negotiation Strategy",
        subtitle:
          tab?.description ?? "Develop winning strategies for your offers",
      };
    }

    if (isBuyerChecklists) {
      return {
        type: "rheader",
        title: SIDEBAR_TABS.close.name,
        subtitle: SIDEBAR_TABS.close.description,
      };
    }

    if (isSaved) {
      const tab = getTabByPath(path);
      const params = new URLSearchParams(search);
      const view = params.get("view");
      if (view === "homes" || view === null) {
        return {
          type: "rheader",
          title: tab?.name ?? "Saved",
          subtitle: tab?.description ?? undefined,
        };
      }
      return { type: "none" };
    }

    // Default: no special header
    return { type: "none" };
  }, [
    header,
    isSearch,
    isPersonalization,
    isNegotiation,
    isBuyerChecklists,
    isSaved,
    path,
    search,
  ]);

  // Desktop header content
  const headerContent = useMemo(() => {
    if (isDashboard) {
      return (
        <DashboardButtonHeader
          variant="horizontal"
          completedStepKey={undefined}
        />
      );
    }

    if (isBuyerChecklists) {
      return (
        <ClosePageHeader
          title={closePageHeaderData?.title ?? SIDEBAR_TABS.close.name}
          subtitle={
            closePageHeaderData?.subtitle ?? SIDEBAR_TABS.close.description
          }
          completedCount={closePageHeaderData?.completedCount ?? 0}
          totalCount={closePageHeaderData?.totalCount ?? 0}
          loading={closePageHeaderData?.loading ?? true}
          activeTab={buyerChecklistsActiveTab}
          onTabChange={setBuyerChecklistsActiveTab}
        />
      );
    }

    if (config.type === "rheader" && config.title) {
      return <PageHeader title={config.title} subtitle={config.subtitle} />;
    }

    return null;
  }, [
    isSearch,
    isDashboard,
    isBuyerChecklists,
    closePageHeaderData,
    buyerChecklistsActiveTab,
    config,
    handleUpdatePreferences,
    handleSearchProperties,
    isSearching,
  ]);

  const isSavedReportsView = useMemo(() => {
    if (!isSaved) return false;
    const params = new URLSearchParams(search);
    return params.get("view") === "reports";
  }, [isSaved, search]);

  // Mobile header content
  const mobileHeaderContent = useMemo(() => {
    // For Search on mobile, use mobile header actions from SearchPage
    if (isSearch && mobileHeaderActions) {
      return mobileHeaderActions;
    }

    if (mobileHeaderActions) return mobileHeaderActions;

    if (isDashboard) {
      return (
        <DashboardButtonHeader
          variant="horizontal"
          completedStepKey={undefined}
        />
      );
    }

    if (isBuyerChecklists) {
      return (
        <ClosePageHeader
          title={closePageHeaderData?.title ?? SIDEBAR_TABS.close.name}
          subtitle={
            closePageHeaderData?.subtitle ?? SIDEBAR_TABS.close.description
          }
          completedCount={closePageHeaderData?.completedCount ?? 0}
          totalCount={closePageHeaderData?.totalCount ?? 0}
          loading={closePageHeaderData?.loading ?? true}
          activeTab={buyerChecklistsActiveTab}
          onTabChange={setBuyerChecklistsActiveTab}
        />
      );
    }

    // For personalization, ensure no other header content is shown when actions are not present
    if (isPersonalization) return null;

    // Explicitly passed mobileHeader for other pages
    if (mobileHeader) return mobileHeader;

    // Mobile overrides placeholder (extend as needed)
    const mobileOverrides: Record<string, React.ReactNode> = {
      // "/search": <SearchHeaderComponent />,
    };
    const overrideKey = Object.keys(mobileOverrides).find((k) =>
      path.startsWith(k)
    );
    if (overrideKey) return mobileOverrides[overrideKey];

    if (config.title) return <PageHeader title={config.title} />;

    return null;
  }, [
    isSearch,
    mobileHeaderActions,
    isDashboard,
    isBuyerChecklists,
    isPersonalization,
    mobileHeader,
    path,
    config,
    closePageHeaderData,
    buyerChecklistsActiveTab,
  ]);

  return (
    <div className="flex min-h-screen bg-off-white">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar
          user={user}
          onLogout={onLogout}
          expanded={sidebarExpanded}
          onToggleExpanded={toggleSidebar}
          isMobile={false}
          onLinkClick={undefined}
        />
      </div>

      {/* Mobile Sidebar - Hidden on desktop */}
      <div className="block lg:hidden">
        <MobileSidebar
          user={user}
          onLogout={onLogout}
          expanded={sidebarExpanded}
          onToggleExpanded={toggleSidebar}
        />
      </div>

      <main
        className={`ml-0 flex-1 transition-all duration-200 ${
          sidebarExpanded ? "lg:ml-64" : "lg:ml-16"
        }`}
      >
        {/* Mobile Header - Hidden on desktop */}
        <div className="lg:hidden">
          <MobileTopBar
            sidebarExpanded={sidebarExpanded}
            dynamicHeight={isSavedReportsView}
          >
            {/* Center the dynamic header content between the back/menu + actions, like in the reference */}
            <div
              className={`flex flex-grow items-center justify-center text-center ${MOBILE_SIDE_PX}`}
            >
              {isSavedReportsView ? (
                <GenerateReportPage />
              ) : (
                (mobileHeaderContent ?? <PageHeader title="SilverKey" />)
              )}
            </div>
          </MobileTopBar>

          {/* Spacer to keep content clear of the fixed MobileTopBar */}
          <div
            className={`${MOBILE_TOP_SPACER_CLASS} ${
              sidebarExpanded ? "h-0" : isSavedReportsView ? "h-32" : "h-24"
            }`}
          />
        </div>

        {/* Desktop Header (consistent width) - Hidden on mobile and search pages */}
        <div
          className={`hidden lg:block mx-auto w-full ${isSaved ? "" : "pt-8"} ${isSearch ? "!hidden" : ""}`}
          style={{ maxWidth: `${computedMaxWidthVW}vw` }}
        >
          {headerContent}
        </div>

        {/* Content area with centralized width parameter */}
        <div
          className={`mx-auto w-full ${
            isSearch
              ? // Full-height search canvas; add mobile horizontal padding to align with top bar button
                `h-[calc(100vh-80px)] lg:h-[calc(100vh-0px)] ${MOBILE_SIDE_PX} lg:px-0`
              : isBuyerChecklists
                ? // Buyer checklists keeps its own internal spacing; still align sides on mobile
                  `${MOBILE_SIDE_PX} lg:px-0`
                : // Default pages: standard padding on desktop; on mobile align with top bar button
                  `mt-4 lg:mt-0 p-4 sm:p-6 lg:p-8 lg:pt-8 ${MOBILE_SIDE_PX} lg:px-0`
          }`}
          style={{ maxWidth: `${computedMaxWidthVW}vw` }}
        >
          {isSearch && (
            <SearchPage
              setMobileHeaderActions={setMobileHeaderActions}
              searchRef={searchPageRef}
            />
          )}
          {isPersonalization && (
            <PersonalizationPage
              setMobileHeaderActions={setMobileHeaderActions}
            />
          )}
          {isNegotiation && <NegotiationStrategy />}
          {isBuyerChecklists && (
            <BuyerChecklists
              setClosePageHeaderData={setClosePageHeaderData}
              activeTab={buyerChecklistsActiveTab}
              onTabChange={setBuyerChecklistsActiveTab}
            />
          )}
          {isSaved && <SavedHomes />}
          {isDashboard && <DashboardPage />}
        </div>
      </main>
    </div>
  );
}
