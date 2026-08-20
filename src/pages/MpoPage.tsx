import { useState } from "react";
import { BudgetTable } from "../components/BudgetTable";
import { BuildPlanPage } from "../components/BuildPlanPage";
import { CurveAndGoal } from "../components/CurveAndGoal";
import { HeroBanner } from "../components/HeroBanner";
import { MiaSidePanel } from "../components/MiaSidePanel";
import { BackArrowIcon } from "../components/icons/BuildPlanIcons";
import { PlanInfoBar } from "../components/PlanInfoBar";
import { PlanOverviewCard } from "../components/PlanOverviewCard";
import { PlansTable } from "../components/PlansTable";
import { PrototypeBar } from "../components/PrototypeBar";
import { TargetBanner } from "../components/TargetBanner";
import { TopNavigation } from "../components/TopNavigation";
import type { BuildPlanState, BuildScreen } from "../mpo/buildPlan/types";
import { formatRangeLabel } from "../mpo/buildPlan/dateUtils";
import { applyMethodChoice } from "../mpo/buildPlan/logic";
import { defaultBuildPlanState } from "../mpo/buildPlan/useBuildPlanFlow";
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
  const [buildPlanScreen, setBuildPlanScreen] = useState<BuildScreen | null>(null);
  const [planBuildStates, setPlanBuildStates] = useState<Record<string, BuildPlanState>>({});
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [miaStart, setMiaStart] = useState<{ token: number; planType: "outcomes" | "spend" } | null>(null);

  const openBuildPlanPage = (seed?: BuildPlanState) => {
    setBuildPlanSeed(seed ?? null);
    setBuildPlanKey((k) => k + 1);
    setBuildPlanOpen(true);
  };

  const openPlan = (id: string) => {
    state.selectPlan(id);
    setViewMode("detail");
  };

  const startMiaFlow = (planType: "outcomes" | "spend") => {
    setMiaOpen(true);
    setMiaStart({ token: Date.now(), planType });
  };

  const handleCreatePlan = (input: CreatePlanInput, rawState: BuildPlanState) => {
    const result = state.createPlan(input);
    setPlanBuildStates((prev) => ({ ...prev, [result.id]: { ...rawState, screen: "review" } }));
    setBuildPlanOpen(false);
    setViewMode("detail");
    return result;
  };

  const openPlanForEdit = (planId: string) => {
    const stored = planBuildStates[planId];
    if (stored) {
      openBuildPlanPage(stored);
      return;
    }
    const plan = state.plans.find((p) => p.id === planId);
    if (!plan) return;
    const seed = defaultBuildPlanState();
    seed.planStart = plan.planStart;
    seed.planEnd = plan.planEnd;
    seed.target = plan.target === "not-sure" ? null : plan.target;
    openBuildPlanPage(applyMethodChoice(seed, "fetch"));
  };

  const activePlan = state.plans.find((p) => p.id === state.activePlanId);

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
                onScreenChange={setBuildPlanScreen}
              />
            ) : viewMode === "list" ? (
              <>
                <HeroBanner
                  onSimulate={() => startMiaFlow("outcomes")}
                  onOptimize={() => startMiaFlow("spend")}
                />
                <PlansTable
                  plans={state.plans}
                  onOpenPlan={openPlan}
                  onDuplicatePlan={state.duplicatePlan}
                  onDeletePlan={state.deletePlan}
                />
              </>
            ) : (
              <>
                <div className={styles.detailHeader}>
                  <button type="button" className={styles.backLink} onClick={() => setViewMode("list")}>
                    <BackArrowIcon size={20} />
                    Back to plans
                  </button>
                  <span className={styles.detailPlanLabel}>{state.activePlanLabel}</span>
                </div>
                <div className={styles.content}>
                  {state.newPlanSummary && state.newPlanSummary.planId === state.activePlanId ? (
                    <>
                      <TargetBanner
                        target={state.newPlanSummary.target}
                        targetValue={state.newPlanSummary.targetValue}
                        incrementalSales={state.totals.sales}
                        roas={state.totals.roas}
                      />
                      <PlanInfoBar
                        periodLabel={state.newPlanSummary.planningWindow}
                        target={state.newPlanSummary.target}
                        targetValue={state.newPlanSummary.targetValue}
                        conversionType={state.newPlanSummary.conversionType}
                      />
                      <PlanOverviewCard
                        planStart={state.newPlanSummary.planStart}
                        planEnd={state.newPlanSummary.planEnd}
                        totalBudget={state.totals.budget}
                        incrementalSales={state.totals.sales}
                        incrementalRoas={state.totals.roas}
                        onEditPlan={() => openPlanForEdit(state.newPlanSummary!.planId)}
                      />
                    </>
                  ) : activePlan?.kind === "simulation" ? (
                    <>
                      <TargetBanner
                        target={activePlan.target}
                        targetValue={null}
                        incrementalSales={state.totals.sales}
                        roas={state.totals.roas}
                      />
                      <PlanInfoBar
                        periodLabel={formatRangeLabel(activePlan.planStart, activePlan.planEnd)}
                        target={activePlan.target}
                        targetValue={null}
                        conversionType="All Orders"
                      />
                      <PlanOverviewCard
                        planStart={activePlan.planStart}
                        planEnd={activePlan.planEnd}
                        totalBudget={state.totals.budget}
                        incrementalSales={state.totals.sales}
                        incrementalRoas={state.totals.roas}
                        onEditPlan={() => openPlanForEdit(activePlan.id)}
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
          {!(buildPlanOpen && buildPlanScreen === "review") && (
            <footer className={styles.footer}>
              <span>© 2020-2024 Measured All Rights Reserved</span>
              <span className={styles.footerDivider} aria-hidden />
              <a href="#">Privacy Policy</a>
            </footer>
          )}
        </div>
        <MiaSidePanel
          open={miaOpen}
          onClose={() => setMiaOpen(false)}
          onEditInMainFlow={(seed) => openBuildPlanPage(seed)}
          startSignal={miaStart}
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
