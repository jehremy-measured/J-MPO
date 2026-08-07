import type { PlanTarget } from "../mpo/types";
import { formatBudget } from "../mpo/types";
import styles from "./TargetBanner.module.css";

type Props = {
  target: PlanTarget;
  incrementalSales: number;
  roas: number;
  salesForecast: number;
  targetBudget: number;
};

export function TargetBanner({ target, incrementalSales, roas, salesForecast, targetBudget }: Props) {
  if (target === "not-sure") return null;

  const targetRoas = targetBudget > 0 ? salesForecast / targetBudget : 0;
  const pct =
    target === "incremental-roas"
      ? targetRoas > 0
        ? (roas / targetRoas) * 100
        : 0
      : salesForecast > 0
      ? (incrementalSales / salesForecast) * 100
      : 0;
  const pctLabel = `${Math.round(pct)}%`;
  const onTrack = pct >= 90;

  const metricLabel = target === "incremental-roas" ? "Inc ROAS" : "Incremental Sales";
  const detail =
    target === "incremental-roas"
      ? `Your plan is projected to deliver a ${roas.toFixed(2)} ROAS, ${pctLabel} of your ${targetRoas.toFixed(
          2
        )} target ROAS for this period.`
      : `Your plan is projected to generate ${formatBudget(incrementalSales)} in incremental sales, ${pctLabel} of your ${formatBudget(
          salesForecast
        )} sales forecast for this period.`;

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
