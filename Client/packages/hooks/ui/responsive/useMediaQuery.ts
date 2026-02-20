import { useEffect, useMemo, useState } from "react";

import { getWindow } from "packages/utils/core/platform";

type Options = {
  /**
   * Initial value used during SSR / first render before `matchMedia` is available.
   * Prefer `false` to avoid rendering a "mobile" layout briefly on desktop.
   */
  defaultValue?: boolean;
};

export function useMediaQuery(query: string, options: Options = {}): boolean {
  const defaultValue = options.defaultValue ?? false;

  const getInitial = useMemo(() => {
    return () => {
      const win = getWindow();
      if (!win || !("matchMedia" in win)) return defaultValue;
      return win.matchMedia(query).matches;
    };
  }, [defaultValue, query]);

  const [matches, setMatches] = useState<boolean>(getInitial);

  useEffect(() => {
    const win = getWindow();
    if (!win || !("matchMedia" in win)) return;

    const media = win.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);

    // Ensure state is correct if query changes.
    setMatches(media.matches);

    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [query]);

  return matches;
}
