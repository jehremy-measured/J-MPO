import type { PlanTarget } from "../mpo/types";
import { computeGoalProgress } from "../mpo/goalProgress";
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
  const subtext = "Manually adjust tactic budgets, or optimize to auto-reallocate for maximum gains.";

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
