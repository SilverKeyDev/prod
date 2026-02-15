export function Tabs(props: {
  active: "results" | "saved";
  onChange: (tab: "results" | "saved") => void;
  counts: { results: number; saved: number };
  compact?: boolean; // mobile
}): JSX.Element {
  const { active, onChange, counts, compact = false } = props;

  if (compact) {
    // Mobile version
    return (
      <div className="flex items-center justify-center border-b border-gray-200">
        <button
          onClick={() => onChange("results")}
          className={`flex items-center justify-center px-responsive-sm py-responsive-sm border-b-2 transition-colors ${
            active === "results"
              ? "border-olive text-base font-semibold text-gray-500"
              : "border-transparent text-responsive-sm font-medium text-gray-500 hover:text-gray-700"
          }`}
        >
          Search
        </button>
        <button
          onClick={() => onChange("saved")}
          className={`px-responsive-sm py-responsive-sm border-b-2 transition-colors ${
            active === "saved"
              ? "border-olive text-base font-semibold text-gray-500"
              : "border-transparent text-responsive-sm font-medium text-gray-500 hover:text-gray-700"
          }`}
        >
          <div className="flex items-center gap-2">
            Saved
            <span className="ml-1 text-xs bg-olive text-white rounded-full px-2 py-1">
              {counts.saved}
            </span>
          </div>
        </button>
      </div>
    );
  }

  // Desktop version
  return (
    <div className="mb-4 flex flex-shrink-0 border-b border-gray-200">
      <button
        onClick={() => onChange("results")}
        className={`flex flex-1 items-center justify-center border-b-2 px-4 py-2 transition-colors ${
          active === "results"
            ? "border-olive text-base font-semibold text-gray-500"
            : "border-transparent text-sm font-medium text-gray-500 hover:text-gray-700"
        }`}
      >
        Search
      </button>
      <button
        onClick={() => onChange("saved")}
        className={`flex-1 border-b-2 px-4 py-2 transition-colors ${
          active === "saved"
            ? "border-olive text-base font-semibold text-gray-500"
            : "border-transparent text-sm font-medium text-gray-500 hover:text-gray-700"
        }`}
      >
        <div className="flex items-center gap-2">
          Saved
          <span className="ml-1 text-xs bg-olive text-white rounded-full px-2 py-1">
            {counts.saved}
          </span>
        </div>
      </button>
    </div>
  );
}
