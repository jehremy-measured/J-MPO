import type { PlanTarget } from "../mpo/types";
import { formatBudget } from "../mpo/types";
import styles from "./TargetBanner.module.css";

type Props = {
  target: PlanTarget;
  targetValue: number | null;
  incrementalSales: number;
  roas: number;
  incrementalOrders: number;
  cpo: number;
};

const METRIC_LABEL: Record<PlanTarget, string> = {
  "incremental-sales": "Incremental Sales",
  "incremental-orders": "Incremental Orders",
  "incremental-roas": "Incremental ROAS",
  "incremental-cpo": "Incremental CPO",
};

export function TargetBanner({ target, targetValue, incrementalSales, roas, incrementalOrders, cpo }: Props) {
  if (targetValue == null || targetValue <= 0) return null;

  const isCostMetric = target === "incremental-cpo";
  const actual =
    target === "incremental-roas"
      ? roas
      : target === "incremental-cpo"
      ? cpo
      : target === "incremental-orders"
      ? incrementalOrders
      : incrementalSales;

  // CPO is a cost: coming in under target is on-track, so the ratio flips.
  const pct = isCostMetric ? (targetValue / Math.max(actual, 0.01)) * 100 : (actual / targetValue) * 100;
  const pctLabel = `${Math.round(pct)}%`;
  const onTrack = pct >= 90;

  const formatMetric = (value: number) =>
    target === "incremental-roas" || target === "incremental-cpo"
      ? `$${value.toFixed(2)}`
      : target === "incremental-orders"
      ? Math.round(value).toLocaleString()
      : formatBudget(value);

  const detail = isCostMetric
    ? `Your plan is projected to cost ${formatMetric(actual)} per incremental order, ${pctLabel} of your ${formatMetric(
        targetValue
      )} target CPO for this period.`
    : `Your plan is projected to generate ${formatMetric(actual)} in ${METRIC_LABEL[target].toLowerCase()}, ${pctLabel} of your ${formatMetric(
        targetValue
      )} target for this period.`;

  return (
    <div className={`${styles.banner} ${onTrack ? styles.onTrack : styles.offTrack}`}>
      <span className={styles.pct}>{pctLabel}</span>
      <div className={styles.text}>
        <span className={styles.label}>Target: {METRIC_LABEL[target]}</span>
        <span className={styles.detail}>{detail}</span>
      </div>
    </div>
  );
}
