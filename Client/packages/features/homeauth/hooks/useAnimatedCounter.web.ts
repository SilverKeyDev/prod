import { useEffect, useState } from "react";

export function useAnimatedCounter(
  target: number,
  suffix: string,
  active: boolean,
  delayMs = 0
): string {
  const [val, setVal] = useState(`0${suffix}`);

  useEffect(() => {
    if (!active) {
      return;
    }

    const timer = window.setTimeout(() => {
      const durationMs = 1200;
      const start = performance.now();

      const tick = (now: number) => {
        const progress = Math.min((now - start) / durationMs, 1);
        const eased = 1 - (1 - progress) ** 3;
        setVal(`${Math.round(eased * target)}${suffix}`);
        if (progress < 1) {
          requestAnimationFrame(tick);
        }
      };

      requestAnimationFrame(tick);
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [active, delayMs, suffix, target]);

  return val;
}
