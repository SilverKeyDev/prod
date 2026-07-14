/**
 * Shared threshold → design-token color helpers for analytics tables.
 */
import { color } from "packages/design-tokens";

/** Higher rate is worse (fall-through, cancellation). */
export function rateColorHighBad(rate: number, high: number, mid: number): string {
  if (rate >= high) return color("state.danger.DEFAULT");
  if (rate >= mid) return color("state.warning.DEFAULT");
  return color("state.success.DEFAULT");
}

/** Higher rate is better (attach rate, momentum). */
export function rateColorHighGood(rate: number, high: number, mid: number): string {
  if (rate >= high) return color("state.success.DEFAULT");
  if (rate >= mid) return color("state.warning.DEFAULT");
  return color("state.danger.DEFAULT");
}

/** 90d momentum: positive / flat / negative. */
export function momentumColor(momentum: number): string {
  if (momentum >= 5) return color("state.success.DEFAULT");
  if (momentum <= -5) return color("state.danger.DEFAULT");
  return color("chart.1");
}

export function agentStatusColor(status: "top" | "healthy" | "at_risk"): string {
  if (status === "top") return color("state.success.DEFAULT");
  if (status === "at_risk") return color("state.danger.DEFAULT");
  return color("chart.1");
}
