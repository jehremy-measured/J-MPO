import type { PlanTarget } from "./types";
import { formatBudget } from "./types";

export const GOAL_METRIC_LABEL: Record<PlanTarget, string> = {
  "incremental-sales": "Incremental Sales",
  "incremental-orders": "Incremental Orders",
  "incremental-roas": "Incremental ROAS",
  "incremental-cpo": "Incremental CPO",
};

export type GoalMetrics = {
  incrementalSales: number;
  roas: number;
  incrementalOrders: number;
  cpo: number;
};

export function formatGoalMetric(target: PlanTarget, value: number): string {
  if (target === "incremental-roas" || target === "incremental-cpo") return `$${value.toFixed(2)}`;
  if (target === "incremental-orders") return Math.round(value).toLocaleString();
  return formatBudget(value);
}

/** Shared "how close is this plan to its target" math, used by both the post-creation
 * TargetBanner and the simulation plan's goal-progress banner. */
export function computeGoalProgress(target: PlanTarget, targetValue: number, metrics: GoalMetrics) {
  const isCostMetric = target === "incremental-cpo";
  const actual =
    target === "incremental-roas"
      ? metrics.roas
      : target === "incremental-cpo"
      ? metrics.cpo
      : target === "incremental-orders"
      ? metrics.incrementalOrders
      : metrics.incrementalSales;

  // CPO is a cost: coming in under target is on-track, so the ratio flips.
  const pct = isCostMetric ? (targetValue / Math.max(actual, 0.01)) * 100 : (actual / targetValue) * 100;

  return {
    actual,
    pct,
    pctLabel: `${Math.round(pct)}%`,
    onTrack: pct >= 90,
    isCostMetric,
  };
}
