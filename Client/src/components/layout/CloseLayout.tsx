import { useState, useEffect, ReactNode } from "react";
import { apiRequest } from "../../lib/api";
import { CheckSquare } from "lucide-react";
import ChecklistCheckbox from "../ui/base/ChecklistCheckbox";
import Card from "../ui/base/Card";

// Shared CSS classes - now using Card component instead
const sectionTitle = "text-lg font-semibold text-navy flex items-center gap-3 mb-4";
const checkboxContainer = "flex items-start gap-3 mb-5";
const itemLabel = "font-medium text-navy";
const itemExplanation = "text-navy/80 text-sm mt-1 transition-opacity duration-300 ease-in-out";

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
  setClosePageHeaderData?: React.Dispatch<React.SetStateAction<ClosePageHeaderData | null>>;
}

export default function CloseLayout({
  title,
  subtitle,
  sectionTitle: sectionTitleText,
  apiEndpoint,
  items,
  children,
  showLoadingScreen = false,
  containerClassName = "py-10",
  showMinLoadingText = false,
  setClosePageHeaderData
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
      const res = await apiRequest<number[]>(apiEndpoint);
      if (res.success && Array.isArray(res.data)) {
        const mapping: { [id: number]: boolean } = {};
        res.data.forEach((id) => (mapping[id] = true));
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
        loading
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
      {children}

      {/* Main checklist section */}
      <div className={containerClassName}>
        {loading && showMinLoadingText && <p className="mb-4">Loading checklist…</p>}
        
        <div className="w-[92%] mx-auto">
          <Card className="mb-6" padding="lg">
          <div className={sectionTitle}>
            <CheckSquare className="h-5 w-5 text-brown" />
            {sectionTitleText}
          </div>

          <fieldset>
            <legend className="sr-only">Checklist</legend>
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
          </fieldset>
        </Card>
        </div>
      </div>
    </div>
  );
}
