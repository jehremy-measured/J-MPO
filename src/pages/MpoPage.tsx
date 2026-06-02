import { BudgetTable } from "../components/BudgetTable";
import { CurveAndGoal } from "../components/CurveAndGoal";
import { HeroBanner } from "../components/HeroBanner";
import { PlanTabs } from "../components/PlanTabs";
import { TopNavigation } from "../components/TopNavigation";
import styles from "./MpoPage.module.css";

/** MPO 1 screen — Figma node 1:33651 */
export function MpoPage() {
  return (
    <div className={styles.page} data-node-id="1:33651">
      <TopNavigation />
      <main className={styles.main}>
        <HeroBanner />
        <PlanTabs />
        <div className={styles.content}>
          <CurveAndGoal />
          <BudgetTable />
        </div>
      </main>
      <footer className={styles.footer}>
        <span>© 2020-2024 Measured All Rights Reserved</span>
        <span className={styles.footerDivider} aria-hidden />
        <a href="#">Privacy Policy</a>
      </footer>
    </div>
  );
}
