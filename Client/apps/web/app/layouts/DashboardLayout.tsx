// React imports
import React, { useState, useMemo, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

// Headers
import ClosePageHeader from "../../features/close/ClosePageHeader.tsx";

// Layout components
import { DashboardHeader } from "./DashboardHeader";
import { DashboardContent } from "./DashboardContent";

// Stores
import {
  useViewStore,
  type ViewState,
} from "../../../../packages/store/view.slice";

// Hooks
import useMobile from "../../../../packages/hooks/ui/useMobile";

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
  "/buyer-checklists": 90,
  "/dashboard": 90,
  "/settings": 90,
  "/saved": 90,
  "/messaging": 90,
  "/calendar": 90,
};

// Mobile-specific width configuration
const MOBILE_WIDTH_CONFIG: PageWidthConfig = {
  "/search": 100,
  "/buyer-checklists": 90,
  "/dashboard": 90,
  "/settings": 90,
  "/saved": 90,
  "/messaging": 90,
  "/calendar": 90,
};

// Checklist tabs
type ChecklistTab = "escrow" | "inspections" | "financing" | "closing";
const CHECKLIST_TABS: ChecklistTab[] = [
  "escrow",
  "inspections",
  "financing",
  "closing",
];

export default function DashboardLayout({
  user,
  onLogout,
  header,
  mobileHeader,
  maxWidth = 85, // Default to 85% if not specified
}: DashboardProps) {
  const location = useLocation();
  const path = location.pathname;
  const search = location.search;
  const isMobile = useMobile();

  // Route helpers
  const isSearch = path.startsWith("/search");
  const isBuyerChecklists = path.startsWith("/buyer-checklists");
  const isDashboard = path.startsWith("/dashboard");
  const isPersonalization = path.startsWith("/settings");
  const isSaved = path.startsWith("/saved");
  const isAgent = path.startsWith("/messaging");
  const isCalendar = path.startsWith("/calendar");

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
  const searchPageRef = React.useRef<{
    triggerSearch: () => Promise<void>;
  } | null>(null);

  // Page width percentage (0-100) - CSS calc() accounts for sidebar on desktop
  const computedMaxWidthVW = useMemo(() => {
    const config = isMobile ? MOBILE_WIDTH_CONFIG : PAGE_WIDTH_CONFIG;
    const configPath = Object.keys(config).find((p) => path.startsWith(p));
    const width = configPath ? config[configPath] : (maxWidth ?? 85);
    return Math.max(0, Math.min(100, width)); // Clamp to [0,100]
  }, [path, maxWidth, isMobile]);

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

    if (isBuyerChecklists) {
      return {
        type: "rheader",
        title: SIDEBAR_TABS.close.name,
        subtitle: SIDEBAR_TABS.close.description,
      };
    }

    if (isSaved) {
      const params = new URLSearchParams(search);
      const view = params.get("view");
      if (view === "homes" || view === null) {
        return { type: "none" };
      }
      return { type: "none" };
    }

    if (isAgent) {
      return { type: "none" };
    }

    if (isCalendar) {
      return { type: "none" };
    }

    // Default: no special header
    return { type: "none" };
  }, [
    header,
    isSearch,
    isPersonalization,
    isBuyerChecklists,
    isSaved,
    isCalendar,
    path,
    search,
  ]);

  // Desktop header content
  const headerContent = useMemo(() => {
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
      return null;
    }

    return null;
  }, [
    isBuyerChecklists,
    closePageHeaderData,
    buyerChecklistsActiveTab,
    config,
  ]);

  return (
    <div className="flex min-h-screen bg-off-white">
      {/* Desktop Sidebar - Hidden only when mobile bottom nav appears (< 768px) */}
      <div className="hidden md:block">
        <Sidebar
          user={user}
          onLogout={onLogout}
          expanded={true}
          isMobile={false}
          onLinkClick={undefined}
        />
      </div>

      {/* Mobile Sidebar - Only on mobile (< 768px) */}
      <div className="block md:hidden">
        <MobileSidebar user={user} onLogout={onLogout} />
      </div>

      <main className="ml-0 flex-1 transition-all duration-200 md:ml-52 max-md:pb-20">
        <DashboardHeader
          isMobile={isMobile}
          isSearch={isSearch}
          isSaved={isSaved}
          isAgent={isAgent}
          isCalendar={isCalendar}
          isBuyerChecklists={isBuyerChecklists}
          isPersonalization={isPersonalization}
          mobileHeaderActions={mobileHeaderActions}
          mobileHeader={mobileHeader}
          closePageHeaderData={closePageHeaderData}
          buyerChecklistsActiveTab={buyerChecklistsActiveTab}
          onTabChange={setBuyerChecklistsActiveTab}
          headerContent={headerContent}
          computedMaxWidthVW={computedMaxWidthVW}
        />

        <DashboardContent
          isSearch={isSearch}
          isBuyerChecklists={isBuyerChecklists}
          isPersonalization={isPersonalization}
          isSaved={isSaved}
          isAgent={isAgent}
          isCalendar={isCalendar}
          isDashboard={isDashboard}
          computedMaxWidthVW={computedMaxWidthVW}
          setMobileHeaderActions={setMobileHeaderActions}
          searchPageRef={searchPageRef}
          setClosePageHeaderData={setClosePageHeaderData}
          buyerChecklistsActiveTab={buyerChecklistsActiveTab}
          onTabChange={setBuyerChecklistsActiveTab}
        />
      </main>
    </div>
  );
}
