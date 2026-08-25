import type { PlanTarget } from "../mpo/types";
import { computeGoalProgress, formatGoalMetric } from "../mpo/goalProgress";
import styles from "./SimulationGoalBanner.module.css";

type Props = {
  target: PlanTarget;
  targetValue?: number;
  incrementalSales: number;
  roas: number;
  incrementalOrders: number;
  cpo: number;
  onOptimize: () => void;
};

/** Compact "$1.1M" / "$120K" style, used for the headline's gap-to-goal figure. */
function formatCompactGap(target: PlanTarget, value: number): string {
  if (target === "incremental-roas" || target === "incremental-cpo") return formatGoalMetric(target, value);
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return formatGoalMetric(target, value);
}

export function SimulationGoalBanner({
  target,
  targetValue,
  incrementalSales,
  roas,
  incrementalOrders,
  cpo,
  onOptimize,
}: Props) {
  const hasTarget = targetValue != null && targetValue > 0;
  const progress = hasTarget
    ? computeGoalProgress(target, targetValue as number, { incrementalSales, roas, incrementalOrders, cpo })
    : null;

  let title = "No target set for this simulation";
  if (progress) {
    if (progress.onTrack) {
      title = `${progress.pctLabel} to goal — on track`;
    } else {
      const gap = progress.isCostMetric ? progress.actual - (targetValue as number) : (targetValue as number) - progress.actual;
      const gapLabel = progress.isCostMetric ? `${formatCompactGap(target, gap)} over` : `${formatCompactGap(target, gap)} short`;
      title = `${progress.pctLabel} to goal — ${gapLabel}`;
    }
  }
  const subtext = "Manually adjust tactic budgets, or optimize to auto-reallocate for maximum gains.";

  return (
    <div className={`${styles.banner} ${progress ? (progress.onTrack ? styles.onTrack : styles.offTrack) : ""}`}>
      <div className={styles.textCol}>
        <p className={styles.title}>{title}</p>
        <p className={styles.subtext}>{subtext}</p>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.optimizeBtn} onClick={onOptimize}>
          Optimize
        </button>
      </div>
    </div>
  );
}
