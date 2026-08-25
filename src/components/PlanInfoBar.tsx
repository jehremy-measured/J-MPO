import type { PlanTarget } from "../mpo/types";
import { formatTargetLabel } from "../mpo/buildPlan/logic";
import { EditIcon } from "./icons/BuildPlanIcons";
import styles from "./PlanInfoBar.module.css";

type Props = {
  periodLabel: string;
  target: PlanTarget;
  targetValue: number | null;
  conversionType: string;
  channelsLabel: string;
  budgetSourceLabel: string;
  tacticsIncluded: number;
  tacticsTotal: number;
  onEditPlan?: () => void;
};

export function PlanInfoBar({
  periodLabel,
  target,
  targetValue,
  conversionType,
  channelsLabel,
  budgetSourceLabel,
  tacticsIncluded,
  tacticsTotal,
  onEditPlan,
}: Props) {
  return (
    <div className={styles.bar}>
      <div className={styles.items}>
        <div className={styles.item}>
          <span className={styles.itemLabel}>Planning for</span>
          <span className={styles.itemValue}>{periodLabel}</span>
        </div>
        <div className={styles.item}>
          <span className={styles.itemLabel}>Conversion type</span>
          <span className={styles.itemValue}>{conversionType}</span>
        </div>
        <div className={styles.item}>
          <span className={styles.itemLabel}>Channels</span>
          <span className={styles.itemValue}>{channelsLabel}</span>
        </div>
        <div className={styles.item}>
          <span className={styles.itemLabel}>Tactics</span>
          <span className={styles.itemValue}>
            {tacticsIncluded} of {tacticsTotal} included
          </span>
        </div>
        <div className={styles.item}>
          <span className={styles.itemLabel}>Target</span>
          <span className={styles.itemValue}>{formatTargetLabel(target, targetValue)}</span>
        </div>
        <div className={styles.item}>
          <span className={styles.itemLabel}>Budget from</span>
          <span className={styles.itemValue}>{budgetSourceLabel}</span>
        </div>
      </div>
      <div className={styles.actions}>
        {onEditPlan && (
          <button type="button" className={styles.editLink} onClick={onEditPlan}>
            <EditIcon size={18} />
            Plan settings
          </button>
        )}
      </div>
    </div>
  );
}
