/**
 * Derive experiment credibility signals from existing funnel counts / attach rates.
 * Does not alter seeded rates or attach totals — presentation only.
 */

export type SignificanceStatus = "significant" | "collecting";

export type VariantSignificance = {
  variantKey: string;
  zScore: number | null;
  status: SignificanceStatus;
  label: string;
};

const Z_95 = 1.96;

/**
 * Two-proportion z-test of treatment attach rate vs control.
 * Returns null when samples are too small to evaluate.
 */
export function twoProportionZ(
  treatmentSuccesses: number,
  treatmentTrials: number,
  controlSuccesses: number,
  controlTrials: number
): number | null {
  if (treatmentTrials <= 0 || controlTrials <= 0) return null;
  const p1 = treatmentSuccesses / treatmentTrials;
  const p2 = controlSuccesses / controlTrials;
  const pooled = (treatmentSuccesses + controlSuccesses) / (treatmentTrials + controlTrials);
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / treatmentTrials + 1 / controlTrials));
  if (se <= 0 || !Number.isFinite(se)) return null;
  return (p1 - p2) / se;
}

export function significanceFromZ(z: number | null): {
  status: SignificanceStatus;
  label: string;
} {
  if (z == null || !Number.isFinite(z)) {
    return { status: "collecting", label: "Collecting data" };
  }
  if (Math.abs(z) >= Z_95) {
    return { status: "significant", label: "95% conf reached" };
  }
  return { status: "collecting", label: "Collecting data" };
}

type FunnelLike = {
  variant_key: string;
  funnel: { sent: number; attached: number };
  is_control?: boolean;
  is_winner?: boolean;
  performance_weekly?: Array<{ attach_rate_percent: number }>;
};

function lastAttachRatePercent(email: FunnelLike): number | null {
  const weeks = email.performance_weekly;
  if (!weeks || weeks.length === 0) return null;
  const last = weeks[weeks.length - 1];
  return typeof last?.attach_rate_percent === "number" ? last.attach_rate_percent : null;
}

/**
 * Control holdout often has sent=0 (no email). Use the largest treatment arm size
 * and control's baseline attach % to synthesize comparable counts for the z-test.
 */
function controlTrialCounts(
  control: FunnelLike,
  emails: FunnelLike[]
): {
  successes: number;
  trials: number;
} | null {
  if (control.funnel.sent > 0) {
    return { successes: control.funnel.attached, trials: control.funnel.sent };
  }
  const armSize = Math.max(0, ...emails.filter((e) => e !== control).map((e) => e.funnel.sent));
  const rate = lastAttachRatePercent(control);
  if (armSize <= 0 || rate == null) return null;
  return {
    trials: armSize,
    successes: Math.round((armSize * rate) / 100),
  };
}

/**
 * Per-variant significance vs the control arm using existing funnel / rate data.
 */
export function buildVariantSignificance(emails: FunnelLike[]): VariantSignificance[] {
  const control = emails.find((e) => e.is_control || e.variant_key === "Control");
  if (!control) {
    return emails.map((email) => ({
      variantKey: email.variant_key,
      zScore: null,
      status: "collecting" as const,
      label: "Collecting data",
    }));
  }

  const controlCounts = controlTrialCounts(control, emails);

  return emails.map((email) => {
    if (email === control || email.is_control || email.variant_key === "Control") {
      return {
        variantKey: email.variant_key,
        zScore: null,
        status: "collecting" as const,
        label: "Holdout arm",
      };
    }
    if (!controlCounts || email.funnel.sent <= 0) {
      return {
        variantKey: email.variant_key,
        zScore: null,
        ...significanceFromZ(null),
      };
    }
    const z = twoProportionZ(
      email.funnel.attached,
      email.funnel.sent,
      controlCounts.successes,
      controlCounts.trials
    );
    const { status, label } = significanceFromZ(z);
    return {
      variantKey: email.variant_key,
      zScore: z == null ? null : Math.round(z * 100) / 100,
      status,
      label,
    };
  });
}

/**
 * Soft ±band around weekly rate points for chart display only.
 * Does not change the center values.
 */
export function weeklyRateConfidenceBounds(
  rates: number[],
  trialsPerWeek: number,
  z = 1.64
): { loBound: number; hiBound: number }[] {
  const n = Math.max(1, trialsPerWeek);
  return rates.map((p) => {
    const proportion = Math.min(1, Math.max(0, p / 100));
    const se = Math.sqrt((proportion * (1 - proportion)) / n) * 100;
    const half = z * se;
    return {
      loBound: Math.round(Math.max(0, p - half) * 10) / 10,
      hiBound: Math.round((p + half) * 10) / 10,
    };
  });
}
