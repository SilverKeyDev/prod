import NavigationButton from "../../../components/ui/button/NavigationButton";
import KeyTurnLoader from "../../../components/ui/loading/KeyTurnLoader";

type SearchActionsProps = {
  onUpdatePreferences: () => void;
  onSearchProperties: () => void;
  isSearching: boolean;
  variant?: "desktop" | "mobile";
};

export default function SearchActions({
  onUpdatePreferences,
  onSearchProperties,
  isSearching,
  variant = "desktop",
}: SearchActionsProps) {
  if (variant === "mobile") {
    return (
      <div className="flex w-full gap-2">
        <NavigationButton
          onClick={() => onUpdatePreferences()}
          size="md"
          arrowType="chevron"
          className="touch-friendly flex-1 text-sm"
        >
          Preferences
        </NavigationButton>
        <button
          onClick={onSearchProperties}
          disabled={isSearching}
          className="touch-friendly flex flex-1 items-center justify-center gap-1 rounded-lg bg-gold px-3 py-2 text-sm text-black transition-colors hover:bg-gold/90 disabled:opacity-50"
        >
          {isSearching ? (
            <KeyTurnLoader message="Searching..." />
          ) : (
            <>
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {isSearching ? "Searching..." : "Search"}
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-shrink-0 gap-2">
      <NavigationButton
        onClick={() => onUpdatePreferences()}
        size="md"
        arrowType="chevron"
      >
        Preferences
      </NavigationButton>
      <button
        onClick={onSearchProperties}
        disabled={isSearching}
        className="inline-flex flex-shrink-0 items-center gap-2 rounded-lg bg-gold px-4 py-2 text-black transition-colors hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSearching ? (
          <KeyTurnLoader message="Searching..." />
        ) : (
          <>
            <svg
              className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            Search Properties
          </>
        )}
      </button>
    </div>
  );
}
