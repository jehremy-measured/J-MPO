import type { PlanTarget } from "../mpo/types";
import { formatTargetLabel } from "../mpo/buildPlan/logic";
import styles from "./PlanInfoBar.module.css";

type Props = {
  periodLabel: string;
  target: PlanTarget;
  targetValue: number | null;
  conversionType: string;
};

export function PlanInfoBar({ periodLabel, target, targetValue, conversionType }: Props) {
  return (
    <div className={styles.bar}>
      <span className={styles.item}>
        Planning for <strong>{periodLabel}</strong>
      </span>
      <span className={styles.divider} aria-hidden />
      <span className={styles.item}>
        Target <strong>{formatTargetLabel(target, targetValue)}</strong>
      </span>
      <span className={styles.divider} aria-hidden />
      <span className={styles.item}>
        Conversion type <strong>{conversionType}</strong>
      </span>
    </div>
  );
}
