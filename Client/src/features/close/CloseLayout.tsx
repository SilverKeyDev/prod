import { useState, useEffect, ReactNode } from "react";
import { apiRequest } from "../../api/utils/index";
import { CheckSquare } from "lucide-react";
import ChecklistCheckbox from "../../components/ui/form/ChecklistCheckbox";
import Card from "../../components/layout/Card";

// Shared CSS classes - now using Card component instead with mobile-first responsive design
const sectionTitle =
  "text-responsive-sm font-semibold text-navy flex items-center gap-responsive-xs mb-responsive-sm";
const checkboxContainer = "flex items-start gap-responsive-xs mb-responsive-sm";
const itemLabel = "font-medium text-navy text-responsive-xs";
const itemExplanation =
  "text-navy/80 text-responsive-xs mt-1 transition-opacity duration-300 ease-in-out";

// Shared interfaces
export interface ResourceLink {
  label: string;
  href?: string;
}

export interface ChecklistItem {
  id: number;
  label: string;
  explanation: string;
  bullets?: string[];
  tip?: string;
  resource?: ResourceLink;
}

interface ClosePageHeaderData {
  title: string;
  subtitle: string;
  completedCount: number;
  totalCount: number;
  loading: boolean;
}

interface CloseLayoutProps {
  title: string;
  subtitle: string;
  sectionTitle: string;
  apiEndpoint: string;
  items: ChecklistItem[];
  children?: ReactNode;
  showLoadingScreen?: boolean;
  containerClassName?: string;
  showMinLoadingText?: boolean;
  setClosePageHeaderData?: React.Dispatch<
    React.SetStateAction<ClosePageHeaderData | null>
  >;
}

export default function CloseLayout({
  title,
  subtitle,
  sectionTitle: sectionTitleText,
  apiEndpoint,
  items,
  children,
  showLoadingScreen = false,
  containerClassName = "py-0",
  showMinLoadingText = false,
  setClosePageHeaderData,
}: CloseLayoutProps) {
  const [checked, setChecked] = useState<{ [id: number]: boolean }>({});
  const [loading, setLoading] = useState(false);

  // Utility function to convert checked state to array of IDs
  const idsFromChecked = (state: { [id: number]: boolean }) =>
    Object.entries(state)
      .filter(([_, v]) => v)
      .map(([k]) => Number(k));

  // Fetch existing checklist from API
  const fetchChecklist = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<{ success: boolean; data: number[] }>(
        apiEndpoint,
      );

      // Handle backend response format: {success: true, data: [1, 3, 5]}
      const checklist = res?.data || res;

      if (Array.isArray(checklist)) {
        const mapping: { [id: number]: boolean } = {};
        checklist.forEach((id: number) => (mapping[id] = true));
        setChecked(mapping);
      }
    } catch (err) {
      console.error(`❌ Failed to fetch ${apiEndpoint} checklist`, err);
    } finally {
      setLoading(false);
    }
  };

  // Update checklist via API
  const updateChecklist = async (newState: { [id: number]: boolean }) => {
    try {
      const body = idsFromChecked(newState);
      await apiRequest(apiEndpoint, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    } catch (err) {
      console.error(`❌ Failed to update ${apiEndpoint} checklist`, err);
    }
  };

  // Toggle checkbox state with optimistic update
  const toggle = (id: number) =>
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      updateChecklist(next);
      return next;
    });

  // Fetch checklist on component mount
  useEffect(() => {
    fetchChecklist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update header data when checklist state changes
  useEffect(() => {
    if (setClosePageHeaderData) {
      const completedCount = Object.values(checked).filter(Boolean).length;
      const totalCount = items.length;

      setClosePageHeaderData({
        title,
        subtitle,
        completedCount,
        totalCount,
        loading,
      });
    }
  }, [checked, loading, title, subtitle, items.length, setClosePageHeaderData]);

  // Cleanup header data when component unmounts
  useEffect(() => {
    return () => {
      if (setClosePageHeaderData) {
        setClosePageHeaderData(null);
      }
    };
  }, [setClosePageHeaderData]);

  // Show loading screen for pages that need it
  if (loading && showLoadingScreen) {
    return (
      <div className="flex items-center justify-center bg-off-white text-navy">
        Loading checklist...
      </div>
    );
  }

  return (
    <div className="bg-off-white">
      {/* Custom content before checklist */}
      {children && <div className="mb-responsive-sm">{children}</div>}

      {/* Main checklist section */}
      <div className={containerClassName}>
        {loading && showMinLoadingText && (
          <p className="mb-responsive-sm">Loading checklist…</p>
        )}

        <div className="w-full max-w-none px-responsive-sm mx-auto">
          <Card className="mb-responsive-sm" padding="sm">
            <div className={sectionTitle}>
              <CheckSquare className="mobile-icon-sm text-brown flex-shrink-0" />
              <span className="break-words min-w-0">{sectionTitleText}</span>
            </div>

            <fieldset className="mt-responsive-xs">
              <legend className="sr-only">Checklist</legend>
              <div className="space-y-responsive-xs">
                {items.map((item) => (
                  <ChecklistCheckbox
                    key={item.id}
                    item={item}
                    checked={!!checked[item.id]}
                    onToggle={() => toggle(item.id)}
                    itemLabelClass={itemLabel}
                    itemExplanationClass={itemExplanation}
                    checkboxContainerClass={checkboxContainer}
                  />
                ))}
              </div>
            </fieldset>
          </Card>
        </div>
      </div>
    </div>
  );
}
