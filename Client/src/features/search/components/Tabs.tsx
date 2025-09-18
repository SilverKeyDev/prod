import { ChevronUp, ChevronDown } from "lucide-react";

export function Tabs(props: {
  active: "results" | "saved";
  onChange: (tab: "results" | "saved") => void;
  counts: { results: number; saved: number };
  compact?: boolean; // mobile
  isCarouselCollapsed?: boolean;
  onToggleCarousel?: () => void;
}): JSX.Element {
  const {
    active,
    onChange,
    counts,
    compact = false,
    isCarouselCollapsed,
    onToggleCarousel,
  } = props;

  if (compact) {
    // Mobile version
    return (
      <div className="flex items-center justify-center border-b border-gray-200">
        <button
          onClick={() => onChange("results")}
          className={`px-responsive-sm py-responsive-sm text-responsive-sm border-b-2 font-medium transition-colors ${
            active === "results"
              ? "border-brown text-brown"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>Search</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-olive text-xs font-medium text-white">
              {counts.results}
            </span>
          </div>
        </button>
        <button
          onClick={() => onChange("saved")}
          className={`px-responsive-sm py-responsive-sm text-responsive-sm border-b-2 font-medium transition-colors ${
            active === "saved"
              ? "border-brown text-brown"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>Saved</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-olive text-xs font-medium text-white">
              {counts.saved}
            </span>
          </div>
        </button>

        {/* Collapse/Expand Button - inline with tabs */}
        {onToggleCarousel && (
          <button
            onClick={onToggleCarousel}
            className="ml-2 p-1 text-gray-500 transition-colors hover:text-gray-700"
          >
            {isCarouselCollapsed ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    );
  }

  // Desktop version
  return (
    <div className="mb-4 flex flex-shrink-0 border-b border-gray-200">
      <button
        onClick={() => onChange("results")}
        className={`flex-1 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
          active === "results"
            ? "border-brown text-brown"
            : "border-transparent text-gray-500 hover:text-gray-700"
        }`}
      >
        <div className="flex items-center gap-2">
          <span>Search</span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-olive text-xs font-medium text-white">
            {counts.results}
          </span>
        </div>
      </button>
      <button
        onClick={() => onChange("saved")}
        className={`flex-1 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
          active === "saved"
            ? "border-brown text-brown"
            : "border-transparent text-gray-500 hover:text-gray-700"
        }`}
      >
        <div className="flex items-center gap-2">
          <span>Saved</span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-olive text-xs font-medium text-white">
            {counts.saved}
          </span>
        </div>
      </button>
    </div>
  );
}
