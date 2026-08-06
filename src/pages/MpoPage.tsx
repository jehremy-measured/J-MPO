import { useState } from "react";
import { BudgetTable } from "../components/BudgetTable";
import { BuildPlanPage } from "../components/BuildPlanPage";
import { CurveAndGoal } from "../components/CurveAndGoal";
import { HeroBanner } from "../components/HeroBanner";
import { MiaSidePanel } from "../components/MiaSidePanel";
import { PlanReviewPage } from "../components/PlanReviewPage";
import { PlanTabs } from "../components/PlanTabs";
import { PrototypeBar } from "../components/PrototypeBar";
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
  const [planReviewOpen, setPlanReviewOpen] = useState(false);

  const openBuildPlanPage = (seed?: BuildPlanState) => {
    setPlanReviewOpen(false);
    setBuildPlanSeed(seed ?? null);
    setBuildPlanKey((k) => k + 1);
    setBuildPlanOpen(true);
  };

  const handleOpenPlanReview = (input: CreatePlanInput) => {
    const result = state.createPlan(input);
    setBuildPlanOpen(false);
    setPlanReviewOpen(true);
    return result;
  };

  const handleReviewSave = () => {
    setPlanReviewOpen(false);
    state.notify(`Saved "${state.activePlanLabel}"`);
  };

  const handleReviewBack = () => {
    setPlanReviewOpen(false);
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
                onComplete={handleOpenPlanReview}
                onExit={() => setBuildPlanOpen(false)}
                initialState={buildPlanSeed ?? undefined}
              />
            ) : planReviewOpen ? (
              <PlanReviewPage
                planLabel={state.activePlanLabel}
                planningWindow={state.planningWindow}
                referencePeriod={state.referencePeriod}
                conversionType={state.conversionType}
                channelCount={state.channelCount}
                referenceBudgetTotal={state.referenceBudgetTotal}
                baselineSalesForecast={state.baselineSalesForecast}
                optimizationMode={state.optimizationMode}
                metricMode={state.metricMode}
                goalType={state.goalType}
                totalSalesGoal={state.totalSalesGoal}
                pacingEnabled={state.pacingEnabled}
                tactics={state.tactics}
                onOptimizationModeChange={state.setOptimizationMode}
                onMetricModeChange={state.setMetricMode}
                onBaselineChange={state.setBaselineSalesForecast}
                onBack={handleReviewBack}
                onSave={handleReviewSave}
                onEdit={() => openBuildPlanPage()}
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
                  <CurveAndGoal />
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
          onOpenPlanReview={handleOpenPlanReview}
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
