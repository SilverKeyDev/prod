/**
 * Staggered section entrance for analytics/campaigns demo polish.
 * Respects prefers-reduced-motion.
 */
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  index?: number;
  className?: string;
  testId?: string;
};

export function AnalyticsMotionSection({ children, index = 0, className, testId }: Props) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div className={className} data-testid={testId}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      data-testid={testId}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
