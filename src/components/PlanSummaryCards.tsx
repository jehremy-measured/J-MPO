import { formatBudget } from "../mpo/types";
import styles from "./PlanSummaryCards.module.css";

type Props = {
  planningWindow: string;
  conversionType: string;
  tacticsCount: number;
  totalBudget: number;
};

export function PlanSummaryCards({
  planningWindow,
  conversionType,
  tacticsCount,
  totalBudget,
}: Props) {
  return (
    <section className={styles.section}>
      <div className={styles.card}>
        <header className={styles.header}>
          <span className={styles.title}>Plan created</span>
          <span className={styles.subtitle}>
            Adjust included tactics and budgets in the table below.
          </span>
        </header>
        <div className={styles.grid}>
          <div className={styles.scard}>
            <div className={styles.sl}>Plan period</div>
            <div className={styles.sv}>{planningWindow}</div>
          </div>
          <div className={styles.scard}>
            <div className={styles.sl}>Conversion type</div>
            <div className={styles.sv}>{conversionType}</div>
          </div>
          <div className={styles.scard}>
            <div className={styles.sl}>Tactics included</div>
            <div className={styles.sv}>{tacticsCount}</div>
          </div>
          <div className={styles.scard}>
            <div className={styles.sl}>Total budget</div>
            <div className={styles.sv}>{formatBudget(totalBudget)}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
