/**
 * Branded abstract placeholder when poster/thumbnail fails to load.
 * Maintains layout stability per Master System Reference.
 */
export function FeedPosterPlaceholder() {
  return (
    <div className="bg-text-primary absolute inset-0 flex items-center justify-center" aria-hidden>
      <div className="bg-primary flex h-20 w-20 items-center justify-center rounded-xl">
        <svg
          className="text-primary h-10 w-10"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"
          />
        </svg>
      </div>
    </div>
  );
}
