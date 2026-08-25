import type { PlanTarget } from "../mpo/types";
import { computeGoalProgress, formatGoalMetric, GOAL_METRIC_LABEL } from "../mpo/goalProgress";
import styles from "./SimulationGoalBanner.module.css";

type Props = {
  target: PlanTarget;
  targetValue?: number;
  incrementalSales: number;
  roas: number;
  incrementalOrders: number;
  cpo: number;
  onCreateVariant: () => void;
  onOptimize: () => void;
};

export function SimulationGoalBanner({
  target,
  targetValue,
  incrementalSales,
  roas,
  incrementalOrders,
  cpo,
  onCreateVariant,
  onOptimize,
}: Props) {
  const hasTarget = targetValue != null && targetValue > 0;
  const progress = hasTarget
    ? computeGoalProgress(target, targetValue as number, { incrementalSales, roas, incrementalOrders, cpo })
    : null;
  const metricLabel = GOAL_METRIC_LABEL[target].toLowerCase();

  const progressCopy = progress
    ? `This plan is projected to reach ${formatGoalMetric(target, progress.actual)} of your ${formatGoalMetric(
        target,
        targetValue as number
      )} ${metricLabel} goal — ${progress.pctLabel} of target${progress.onTrack ? "." : ", short of where you want to be."}`
    : `Set a target to see how this plan's projected ${metricLabel} compares to your goal.`;

  return (
    <div className={`${styles.banner} ${progress ? (progress.onTrack ? styles.onTrack : styles.offTrack) : ""}`}>
      <div className={styles.textCol}>
        {progress && <span className={styles.pct}>{progress.pctLabel}</span>}
        <p className={styles.copy}>
          {progressCopy} Create a variant to manually adjust tactic-level budgets yourself, or run an optimization to
          automatically reallocate tactic budgets for maximum gains — in optimization mode you can also change the
          overall budget and tactics will reallocate to match.
        </p>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.variantBtn} onClick={onCreateVariant}>
          Create variant
        </button>
        <button type="button" className={styles.optimizeBtn} onClick={onOptimize}>
          Optimize
        </button>
      </div>
    </div>
  );
}
