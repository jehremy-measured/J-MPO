import type { PlanTarget } from "../mpo/types";
import { computeGoalProgress, formatGoalMetric, GOAL_METRIC_LABEL } from "../mpo/goalProgress";
import styles from "./TargetBanner.module.css";

type Props = {
  target: PlanTarget;
  targetValue: number | null;
  incrementalSales: number;
  roas: number;
  incrementalOrders: number;
  cpo: number;
};

export function TargetBanner({ target, targetValue, incrementalSales, roas, incrementalOrders, cpo }: Props) {
  if (targetValue == null || targetValue <= 0) return null;

  const { actual, pctLabel, onTrack, isCostMetric } = computeGoalProgress(target, targetValue, {
    incrementalSales,
    roas,
    incrementalOrders,
    cpo,
  });
  const formatMetric = (value: number) => formatGoalMetric(target, value);

  const detail = isCostMetric
    ? `Your plan is projected to cost ${formatMetric(actual)} per incremental order, ${pctLabel} of your ${formatMetric(
        targetValue
      )} target CPO for this period.`
    : `Your plan is projected to generate ${formatMetric(actual)} in ${GOAL_METRIC_LABEL[target].toLowerCase()}, ${pctLabel} of your ${formatMetric(
        targetValue
      )} target for this period.`;

  return (
    <div className={`${styles.banner} ${onTrack ? styles.onTrack : styles.offTrack}`}>
      <span className={styles.pct}>{pctLabel}</span>
      <div className={styles.text}>
        <span className={styles.label}>Target: {GOAL_METRIC_LABEL[target]}</span>
        <span className={styles.detail}>{detail}</span>
      </div>
    </div>
  );
}
