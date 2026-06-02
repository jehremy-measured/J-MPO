import styles from "./PlanTabs.module.css";

const plans = [
  { label: "Default Plan", active: true },
  { label: "Optimized budget Q1 2025", active: false },
  { label: "Quick calc", active: false },
  { label: "Trevor’s plan", active: false },
  { label: "Quarterly Expense Tracker", active: false },
  { label: "Q3 2024 scenario", active: false },
  { label: "My Plan & Pacing", active: false },
  { label: "Test Plan 2026", active: false },
];

export function PlanTabs() {
  return (
    <div className={styles.wrap} data-node-id="1:33656">
      <div className={styles.tabs}>
        {plans.map((plan, index) => (
          <div key={plan.label} className={styles.tabGroup}>
            {index === 1 && <span className={styles.tabDivider} aria-hidden />}
            <button
              type="button"
              className={plan.active ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            >
              {plan.label}
              {plan.active && <span className={styles.underline} />}
            </button>
          </div>
        ))}
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
