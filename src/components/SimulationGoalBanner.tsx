import type { PlanTarget } from "../mpo/types";
import { computeGoalProgress, formatGoalMetric, GOAL_METRIC_LABEL } from "../mpo/goalProgress";
import { TargetIcon } from "./icons/BuildPlanIcons";
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

  const title = progress ? `${progress.pctLabel} of target achieved` : "No target set for this simulation";

  let subtext = "Set a target when building this simulation to see how close it gets you.";
  if (progress) {
    const metricLabel = GOAL_METRIC_LABEL[target].toLowerCase();
    const targetLabel = formatGoalMetric(target, targetValue as number);
    const met = progress.isCostMetric ? progress.actual <= (targetValue as number) : progress.actual >= (targetValue as number);
    if (met) {
      subtext = `You've reached your ${metricLabel} target of ${targetLabel}. Run an optimization to maximize gains further.`;
    } else {
      const gap = progress.isCostMetric ? progress.actual - (targetValue as number) : (targetValue as number) - progress.actual;
      const verb = progress.isCostMetric ? "over" : "short of";
      subtext = `You are ${formatGoalMetric(target, gap)} ${verb} your ${metricLabel} target of ${targetLabel}. You can run an optimization to reach your target.`;
    }
  }

  return (
    <div className={styles.banner}>
      <span className={styles.icon}>
        <TargetIcon size={20} />
      </span>
      <div className={styles.body}>
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
    </div>
  );
}
