import type { Plan } from "../mpo/types";
import styles from "./PlanTabs.module.css";

type Props = {
  plans: Plan[];
  activePlanId: string;
  onSelectPlan: (id: string) => void;
};

export function PlanTabs({ plans, activePlanId, onSelectPlan }: Props) {
  return (
    <div className={styles.wrap} data-node-id="1:33656">
      <div className={styles.tabs}>
        {plans.map((plan, index) => {
          const active = plan.id === activePlanId;
          return (
            <div key={plan.id} className={styles.tabGroup}>
              {index === 1 && <span className={styles.tabDivider} aria-hidden />}
              <button
                type="button"
                className={active ? `${styles.tab} ${styles.tabActive}` : styles.tab}
                onClick={() => onSelectPlan(plan.id)}
              >
                {plan.label}
                {active && <span className={styles.underline} />}
              </button>
            </div>
          );
        })}
        <button type="button" className={styles.scrollBtn} aria-label="More plans">
          ›
        </button>
      </div>
      <span className={styles.actionsDivider} aria-hidden />
      <button type="button" className={styles.iconAction} aria-label="Compare">
        ⧉
      </button>
      <button type="button" className={styles.iconAction} aria-label="Menu">
        ☰
      </button>
    </div>
  );
}
