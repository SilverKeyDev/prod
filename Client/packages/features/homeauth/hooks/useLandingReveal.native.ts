import { useRef } from "react";

/** Native: reveal immediately (no IntersectionObserver). */
export function useLandingReveal() {
  const ref = useRef<unknown>(null);
  return { ref, inView: true };
}
