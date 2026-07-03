import { useEffect, useRef, useState } from "react";

type UseLandingRevealOptions = {
  threshold?: number;
  rootMargin?: string;
};

export function useLandingReveal({ threshold = 0.05, rootMargin }: UseLandingRevealOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return { ref, inView };
}
