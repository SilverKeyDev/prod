import NavigationButton from "../base/NavigationButton";
import KeyTurnLoader from "../base/KeyTurnLoader";

interface SearchActionsProps {
  onUpdatePreferences: () => void;
  onSearchProperties: () => void;
  isSearching: boolean;
  variant?: "desktop" | "mobile";
}

export default function SearchActions({
  onUpdatePreferences,
  onSearchProperties,
  isSearching,
  variant = "desktop",
}: SearchActionsProps) {
  if (variant === "mobile") {
    return (
      <div className="flex gap-2 w-full">
        <NavigationButton
          onClick={() => onUpdatePreferences()}
          size="md"
          arrowType="chevron"
          className="flex-1 touch-friendly text-sm"
        >
          Preferences
        </NavigationButton>
        <button
          onClick={onSearchProperties}
          disabled={isSearching}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gold text-black rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50 touch-friendly text-sm"
        >
          {isSearching ? (
            <KeyTurnLoader message="Searching..." />
          ) : (
            <>
              <svg
                className="w-4 h-4"
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
    <div className="flex gap-2 flex-shrink-0">
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
        className="inline-flex items-center px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed gap-2 flex-shrink-0"
      >
        {isSearching ? (
          <KeyTurnLoader message="Searching..." />
        ) : (
          <>
            <svg
              className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6"
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
