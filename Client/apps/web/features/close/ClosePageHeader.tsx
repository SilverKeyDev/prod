import Card from "../../components/layout/Card";
import MiniLogo from "../../components/ui/asset/MiniLogo";
import {
  CHECKLIST_TITLES,
  type ChecklistTab,
} from "../../../../packages/schemas";

type ClosePageHeaderProps = {
  title: string;
  subtitle: string;
  completedCount: number;
  totalCount: number;
  loading?: boolean;
  activeTab?: ChecklistTab;
  onTabChange?: (tab: ChecklistTab) => void;
};

const tabs: Array<{ id: ChecklistTab; label: string }> = [
  { id: "escrow", label: CHECKLIST_TITLES.escrow },
  { id: "inspections", label: CHECKLIST_TITLES.inspections },
  { id: "financing", label: CHECKLIST_TITLES.financing },
  { id: "closing", label: CHECKLIST_TITLES.closing },
];

export default function ClosePageHeader({
  title,
  subtitle: _subtitle, // hidden below the main title per design
  completedCount,
  totalCount,
  loading = false,
  activeTab,
  onTabChange,
}: ClosePageHeaderProps) {
  return (
    <div className="mx-auto w-full max-w-[90vw] px-4 xl:px-6 2xl:px-8">
      <Card
        className="relative z-30 border-b border-beige/40 px-3 pt-3"
        padding="none"
      >
        <div className="flex justify-center">
          <div className="flex flex-col items-center">
            {/* Title row with logo */}
            <div className="flex items-center justify-center">
              <div className="flex-shrink-0">
                <MiniLogo size="xs" className="sm:hidden" />
                <MiniLogo size="sm" className="hidden sm:block lg:hidden" />
                <MiniLogo size="md" className="hidden lg:block xl:hidden" />
                <MiniLogo size="lg" className="hidden xl:block" />
              </div>
              <h1 className="text-sm sm:text-base lg:heading-responsive-md font-semibold lg:font-normal text-navy">
                {title}
              </h1>
            </div>

            {/* Subtitle visible on sm+ screens, hidden on small */}
            <p className="hidden sm:block text-sm lg:text-responsive-sm text-navy/70 mt-1">
              {_subtitle}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {!loading && (
          <div className="mt-1 lg:mt-2">
            <div className="h-1 lg:h-2 w-full rounded bg-beige/30">
              <div
                className="h-full rounded bg-olive transition-all duration-500"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Tabs Bar */}
        {activeTab && onTabChange && (
          <div className="mt-2 lg:mt-3">
            <div className="flex justify-center overflow-x-auto scrollbar-hide">
              {tabs.map((tab, index) => (
                <div
                  key={tab.id}
                  className="flex items-center flex-1 max-w-[23.75%]"
                >
                  <button
                    onClick={() => onTabChange(tab.id)}
                    className={`w-full px-2 lg:px-responsive-xs py-0.5 lg:py-responsive-2xs text-[10px] lg:text-xs font-medium transition-all duration-200 mx-1 ${
                      activeTab === tab.id
                        ? "text-olive border-b-2 border-olive"
                        : "text-navy/70 hover:bg-olive/10 hover:text-olive hover:shadow-sm rounded-lg"
                    }`}
                  >
                    <div className="text-center text-[10px] lg:text-xs font-medium">
                      {tab.label}
                    </div>
                  </button>
                  {index < tabs.length - 1 && (
                    <div className="h-4 lg:h-6 w-px bg-gray-300 mx-1 lg:mx-2" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
