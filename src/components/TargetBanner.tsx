import type { PlanTarget } from "../mpo/types";
import { formatBudget } from "../mpo/types";
import styles from "./TargetBanner.module.css";

type Props = {
  target: PlanTarget;
  targetValue: number | null;
  incrementalSales: number;
  roas: number;
};

export function TargetBanner({ target, targetValue, incrementalSales, roas }: Props) {
  if (target === "not-sure" || targetValue == null || targetValue <= 0) return null;

  const pct = target === "incremental-roas" ? (roas / targetValue) * 100 : (incrementalSales / targetValue) * 100;
  const pctLabel = `${Math.round(pct)}%`;
  const onTrack = pct >= 90;

  const metricLabel = target === "incremental-roas" ? "Incremental ROAS" : "Incremental Sales";
  const detail =
    target === "incremental-roas"
      ? `Your plan is projected to deliver a ${roas.toFixed(2)} ROAS, ${pctLabel} of your ${targetValue.toFixed(
          2
        )} target ROAS for this period.`
      : `Your plan is projected to generate ${formatBudget(incrementalSales)} in incremental sales, ${pctLabel} of your ${formatBudget(
          targetValue
        )} target for this period.`;

  return (
    <div className={`${styles.banner} ${onTrack ? styles.onTrack : styles.offTrack}`}>
      <span className={styles.pct}>{pctLabel}</span>
      <div className={styles.text}>
        <span className={styles.label}>Target: {metricLabel}</span>
        <span className={styles.detail}>{detail}</span>
      </div>
    </div>
  );
}
