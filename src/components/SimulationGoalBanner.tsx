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
  onOptimize: () => void;
};

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
  const metricLabel = GOAL_METRIC_LABEL[target].toLowerCase();

  const title = progress ? `${progress.pctLabel} of target achieved in this simulation` : "No target set for this simulation";
  const subtext = progress
    ? `This plan is projected to reach ${formatGoalMetric(target, progress.actual)} of your ${formatGoalMetric(
        target,
        targetValue as number
      )} ${metricLabel} goal. To reach your target, manually adjust tactic-level budgets, or run an optimization to automatically reallocate tactic budgets.`
    : `Manually adjust tactic-level budgets, or run an optimization to automatically reallocate tactic budgets toward your goal.`;

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
