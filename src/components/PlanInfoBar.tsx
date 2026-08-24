import type { PlanTarget } from "../mpo/types";
import { currencyFormatter } from "../mpo/buildPlan/data";
import { formatTargetLabel } from "../mpo/buildPlan/logic";
import { EditIcon } from "./icons/BuildPlanIcons";
import styles from "./PlanInfoBar.module.css";

type Props = {
  periodLabel: string;
  target: PlanTarget;
  targetValue: number | null;
  conversionType: string;
  budget: number;
  tacticsIncluded: number;
  tacticsTotal: number;
  onEditPlan?: () => void;
};

export function PlanInfoBar({
  periodLabel,
  target,
  targetValue,
  conversionType,
  budget,
  tacticsIncluded,
  tacticsTotal,
  onEditPlan,
}: Props) {
  return (
    <div className={styles.bar}>
      <div className={styles.items}>
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
        <span className={styles.divider} aria-hidden />
        <span className={styles.item}>
          Budget <strong>{currencyFormatter.format(budget)}</strong>
        </span>
        <span className={styles.divider} aria-hidden />
        <span className={styles.item}>
          Tactics{" "}
          <strong>
            {tacticsIncluded} of {tacticsTotal} included
          </strong>
        </span>
      </div>
      <div className={styles.actions}>
        {onEditPlan && (
          <button type="button" className={styles.editLink} onClick={onEditPlan}>
            <EditIcon size={18} />
            Edit plan
          </button>
        )}
      </div>
    </div>
  );
}
