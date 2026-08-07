import { useState } from "react";
import { BudgetTable } from "../components/BudgetTable";
import { BuildPlanPage } from "../components/BuildPlanPage";
import { CurveAndGoal } from "../components/CurveAndGoal";
import { HeroBanner } from "../components/HeroBanner";
import { MiaSidePanel } from "../components/MiaSidePanel";
import { PlanSummaryCards } from "../components/PlanSummaryCards";
import { PlanTabs } from "../components/PlanTabs";
import { PrototypeBar } from "../components/PrototypeBar";
import { TargetBanner } from "../components/TargetBanner";
import { TopNavigation } from "../components/TopNavigation";
import type { BuildPlanState } from "../mpo/buildPlan/types";
import type { CreatePlanInput } from "../mpo/types";
import { useMpoState } from "../mpo/useMpoState";
import styles from "./MpoPage.module.css";

/** MPO 1 screen — interactive prototype (Figma node 1:33651) */
export function MpoPage() {
  const state = useMpoState();
  const [miaOpen, setMiaOpen] = useState(false);
  const [buildPlanOpen, setBuildPlanOpen] = useState(false);
  const [buildPlanSeed, setBuildPlanSeed] = useState<BuildPlanState | null>(null);
  const [buildPlanKey, setBuildPlanKey] = useState(0);

  const openBuildPlanPage = (seed?: BuildPlanState) => {
    setBuildPlanSeed(seed ?? null);
    setBuildPlanKey((k) => k + 1);
    setBuildPlanOpen(true);
  };

  const handleCreatePlan = (input: CreatePlanInput) => {
    const result = state.createPlan(input);
    setBuildPlanOpen(false);
    return result;
  };

  return (
    <div className={styles.page} data-node-id="1:33651">
      <TopNavigation miaOpen={miaOpen} onMiaToggle={() => setMiaOpen((open) => !open)} />
      <div className={styles.body}>
        <div className={styles.contentCol}>
          <main className={styles.main}>
            {buildPlanOpen ? (
              <BuildPlanPage
                key={buildPlanKey}
                onComplete={handleCreatePlan}
                onExit={() => setBuildPlanOpen(false)}
                initialState={buildPlanSeed ?? undefined}
              />
            ) : (
              <>
                {!state.heroDismissed && (
                  <HeroBanner
                    onCreatePlan={() => {
                      state.setHeroDismissed(true);
                      openBuildPlanPage();
                    }}
                  />
                )}
                <PlanTabs
                  plans={state.plans}
                  activePlanId={state.activePlanId}
                  onSelectPlan={(id) => {
                    state.selectPlan(id);
                    state.notify(
                      `Switched to ${state.plans.find((p) => p.id === id)?.label ?? "plan"}`
                    );
                  }}
                />
                <div className={styles.content}>
                  {state.newPlanSummary && state.newPlanSummary.planId === state.activePlanId ? (
                    <>
                      <TargetBanner
                        target={state.newPlanSummary.target}
                        targetValue={state.newPlanSummary.targetValue}
                        incrementalSales={state.totals.sales}
                        roas={state.totals.roas}
                      />
                      <PlanSummaryCards
                        planningWindow={state.newPlanSummary.planningWindow}
                        conversionType={state.newPlanSummary.conversionType}
                        tacticsCount={state.newPlanSummary.tacticsCount}
                        totalBudget={state.newPlanSummary.totalBudget}
                      />
                    </>
                  ) : (
                    <CurveAndGoal />
                  )}
                  <BudgetTable />
                </div>
              </>
            )}
          </main>
          <footer className={styles.footer}>
            <span>© 2020-2024 Measured All Rights Reserved</span>
            <span className={styles.footerDivider} aria-hidden />
            <a href="#">Privacy Policy</a>
          </footer>
        </div>
        <MiaSidePanel
          open={miaOpen}
          onClose={() => setMiaOpen(false)}
          onEditInMainFlow={(seed) => openBuildPlanPage(seed)}
        />
      </div>
      <PrototypeBar
        message={state.statusMessage}
        onDismiss={() => state.setStatusMessage(null)}
        totalBudget={state.totals.budget}
        totalSales={state.totals.sales}
        blendedRoas={state.totals.roas}
      />
    </div>
  );
}
