import { useEffect, useRef } from "react";

/**
 * Hook that ensures an effect runs only once per mount, even under React.StrictMode
 * which intentionally double-invokes effects in development.
 * 
 * @param effect - The effect function to run once
 */
export function useOnceEffect(effect: () => void | (() => void)) {
  const didRun = useRef(false);
  
  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;
    return effect();
  }, []);
}
