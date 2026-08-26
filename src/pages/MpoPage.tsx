import { useEffect, useRef, useState } from "react";
import { BudgetTable } from "../components/BudgetTable";
import { BuildPlanPage } from "../components/BuildPlanPage";
import { CurveAndGoal } from "../components/CurveAndGoal";
import { HeroBanner } from "../components/HeroBanner";
import { MiaSidePanel } from "../components/MiaSidePanel";
import { BackArrowIcon } from "../components/icons/BuildPlanIcons";
import { MaterialIcon } from "../components/icons/MaterialIcon";
import { PlanInfoBar } from "../components/PlanInfoBar";
import { PlanOptionsMenu } from "../components/PlanOptionsMenu";
import { PlanOverviewCard } from "../components/PlanOverviewCard";
import { PlansTable } from "../components/PlansTable";
import { PrototypeBar } from "../components/PrototypeBar";
import { SidebarEditPlanPage } from "../components/SidebarEditPlanPage";
import { TopNavigation } from "../components/TopNavigation";
import type { BuildPlanState, BuildScreen } from "../mpo/buildPlan/types";
import { formatRangeLabel, subtractYears } from "../mpo/buildPlan/dateUtils";
import { applyMethodChoice, budgetFromWindow, channelsPresent } from "../mpo/buildPlan/logic";
import { defaultBuildPlanState } from "../mpo/buildPlan/useBuildPlanFlow";
import type { CreatePlanInput, PlanKind } from "../mpo/types";
import { useMpoState } from "../mpo/useMpoState";
import styles from "./MpoPage.module.css";

const KIND_LABEL: Record<PlanKind, string> = {
  optimization: "Optimization",
  simulation: "Simulation",
};

function channelsLabelFor(count: number): string {
  const total = channelsPresent().length;
  if (count >= total) return "All channels";
  return `${count} channel${count === 1 ? "" : "s"}`;
}

/** MPO 1 screen — interactive prototype (Figma node 1:33651) */
export function MpoPage() {
  const state = useMpoState();
  const [miaOpen, setMiaOpen] = useState(false);
  const [buildPlanOpen, setBuildPlanOpen] = useState(false);
  const [buildPlanSeed, setBuildPlanSeed] = useState<BuildPlanState | null>(null);
  const [buildPlanKey, setBuildPlanKey] = useState(0);
  const [buildPlanScreen, setBuildPlanScreen] = useState<BuildScreen | null>(null);
  const [buildPlanMode, setBuildPlanMode] = useState<"create" | "edit">("create");
  const [planBuildStates, setPlanBuildStates] = useState<Record<string, BuildPlanState>>({});
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [miaStart, setMiaStart] = useState<{ token: number; planType: "outcomes" | "spend" } | null>(null);
  const [sidebarEditPlanId, setSidebarEditPlanId] = useState<string | null>(null);
  const [renamingTitle, setRenamingTitle] = useState(false);
  const [titleRenameValue, setTitleRenameValue] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);
  // Demo-only toggle: the plans list starts empty; "Watch tutorial" flips it to the seeded
  // demo plans and back, until a real plan is created — then all plans show regardless.
  const [demoPlansVisible, setDemoPlansVisible] = useState(false);
  const [hasCreatedPlan, setHasCreatedPlan] = useState(false);
  const visiblePlans = hasCreatedPlan ? state.plans : demoPlansVisible ? state.plans : [];
  const [creatingPlanPhase, setCreatingPlanPhase] = useState<"creating" | "simulating" | null>(null);

  useEffect(() => {
    if (renamingTitle) titleInputRef.current?.select();
  }, [renamingTitle]);

  const openBuildPlanPage = (seed?: BuildPlanState, planMode: "create" | "edit" = "create") => {
    setBuildPlanSeed(seed ?? null);
    setBuildPlanKey((k) => k + 1);
    setBuildPlanOpen(true);
    setBuildPlanMode(planMode);
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
    const finish = () => {
      const result = state.createPlan(input);
      setPlanBuildStates((prev) => ({ ...prev, [result.id]: { ...rawState, screen: "review" } }));
      setViewMode("detail");
    };

    if (buildPlanMode === "edit") {
      setBuildPlanOpen(false);
      finish();
      return;
    }

    setBuildPlanOpen(false);
    setCreatingPlanPhase("creating");
    setHasCreatedPlan(true);
    setTimeout(() => setCreatingPlanPhase("simulating"), 1500);
    setTimeout(() => {
      finish();
      setCreatingPlanPhase(null);
    }, 3000);
  };

  const openPlanForEdit = (planId: string) => {
    const plan = state.plans.find((p) => p.id === planId);
    if (plan?.editVariant === "sidebar") {
      setSidebarEditPlanId(planId);
      return;
    }
    const stored = planBuildStates[planId];
    if (stored) {
      openBuildPlanPage(stored, "edit");
      return;
    }
    if (!plan) return;
    const seed = defaultBuildPlanState();
    seed.planStart = plan.planStart;
    seed.planEnd = plan.planEnd;
    seed.target = plan.target;
    seed.singleCT = "total";
    const seeded = applyMethodChoice(seed, "fetch");
    // Match the reference period already shown on the plan-detail page (one year back from
    // the plan's own dates), rather than the wizard's "most recent window" default.
    seeded.sourceStart = subtractYears(plan.planStart, 1);
    seeded.budget = budgetFromWindow(seeded).budget;
    openBuildPlanPage(seeded, "edit");
  };

  const sidebarEditPlan = sidebarEditPlanId ? state.plans.find((p) => p.id === sidebarEditPlanId) ?? null : null;

  const handleDeleteActivePlan = (id: string) => {
    state.deletePlan(id);
    setViewMode("list");
  };

  const startRenameTitle = () => {
    setTitleRenameValue(state.activePlanLabel);
    setRenamingTitle(true);
  };

  const commitRenameTitle = () => {
    if (state.activePlanId) state.renamePlan(state.activePlanId, titleRenameValue);
    setRenamingTitle(false);
  };

  const activePlan = state.plans.find((p) => p.id === state.activePlanId);
  const currentTarget =
    state.newPlanSummary && state.newPlanSummary.planId === state.activePlanId
      ? state.newPlanSummary.target
      : activePlan?.target ?? "incremental-sales";

  return (
    <div className={styles.page} data-node-id="1:33651">
      <TopNavigation miaOpen={miaOpen} onMiaToggle={() => setMiaOpen((open) => !open)} />
      <div className={styles.body}>
        <div className={styles.contentCol}>
          <main className={styles.main}>
            {sidebarEditPlan ? (
              <SidebarEditPlanPage plan={sidebarEditPlan} onExit={() => setSidebarEditPlanId(null)} />
            ) : buildPlanOpen ? (
              <BuildPlanPage
                key={buildPlanKey}
                onComplete={handleCreatePlan}
                onExit={() => setBuildPlanOpen(false)}
                initialState={buildPlanSeed ?? undefined}
                onScreenChange={setBuildPlanScreen}
                mode={buildPlanMode}
              />
            ) : viewMode === "list" ? (
              <>
                <HeroBanner
                  onSimulate={() => startMiaFlow("outcomes")}
                  onOptimize={() => startMiaFlow("spend")}
                  onWatchTutorial={() => setDemoPlansVisible((v) => !v)}
                />
                <PlansTable
                  plans={visiblePlans}
                  onOpenPlan={openPlan}
                  onDuplicatePlan={state.duplicatePlan}
                  onDeletePlan={state.deletePlan}
                  onRenamePlan={state.renamePlan}
                  onToggleSharePlan={state.toggleSharePlan}
                />
              </>
            ) : (
              <>
                <div className={styles.detailHeader}>
                  <button
                    type="button"
                    className={styles.backBtn}
                    aria-label="Back to plans"
                    onClick={() => setViewMode("list")}
                  >
                    <BackArrowIcon size={20} />
                  </button>
                  {renamingTitle ? (
                    <input
                      ref={titleInputRef}
                      type="text"
                      className={styles.detailPlanTitleInput}
                      value={titleRenameValue}
                      onChange={(e) => setTitleRenameValue(e.target.value)}
                      onBlur={commitRenameTitle}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitRenameTitle();
                        if (e.key === "Escape") setRenamingTitle(false);
                      }}
                      autoFocus
                    />
                  ) : (
                    <>
                      <span className={styles.detailPlanTitle}>{state.activePlanLabel}</span>
                      {activePlan && (
                        <span
                          className={`${styles.kindBadge} ${
                            activePlan.kind === "optimization" ? styles.kindBadgeOptimization : styles.kindBadgeSimulation
                          }`}
                        >
                          {KIND_LABEL[activePlan.kind]}
                        </span>
                      )}
                    </>
                  )}
                  <div className={styles.syncPill}>
                    <span className={styles.syncDot} aria-hidden />
                    <span className={styles.syncText}>Updated 2 hours ago</span>
                    <span className={styles.syncDivider} aria-hidden />
                    <button type="button" className={styles.syncRefreshBtn}>
                      <MaterialIcon name="autorenew" size={18} />
                      Refresh
                    </button>
                  </div>
                  {state.activePlanId && (
                    <PlanOptionsMenu
                      planId={state.activePlanId}
                      planLabel={state.activePlanLabel}
                      shared={activePlan?.shared}
                      onRenameRequest={startRenameTitle}
                      onToggleSharePlan={state.toggleSharePlan}
                      onDuplicatePlan={state.duplicatePlan}
                      onDeletePlan={handleDeleteActivePlan}
                    />
                  )}
                </div>
                <div className={styles.content}>
                  {state.newPlanSummary && state.newPlanSummary.planId === state.activePlanId ? (
                    <>
                      <PlanInfoBar
                        periodLabel={state.newPlanSummary.planningWindow}
                        target={state.newPlanSummary.target}
                        targetValue={state.newPlanSummary.targetValue}
                        conversionType={state.newPlanSummary.conversionType}
                        channelsLabel={channelsLabelFor(state.channelCount)}
                        budgetSourceLabel={state.referencePeriod}
                        tacticsIncluded={state.tactics.length}
                        onEditPlan={() => openPlanForEdit(state.newPlanSummary!.planId)}
                      />
                      <PlanOverviewCard
                        planStart={state.newPlanSummary.planStart}
                        planEnd={state.newPlanSummary.planEnd}
                        totalBudget={state.totals.budget}
                        incrementalSales={state.totals.sales}
                        incrementalRoas={state.totals.roas}
                        target={state.newPlanSummary.target}
                        targetValue={state.newPlanSummary.targetValue}
                        incrementalOrders={state.totals.orders}
                        cpo={state.totals.cpo}
                        onOptimize={() => startMiaFlow("spend")}
                      />
                    </>
                  ) : activePlan?.kind === "simulation" ? (
                    <>
                      <PlanInfoBar
                        periodLabel={formatRangeLabel(activePlan.planStart, activePlan.planEnd)}
                        target={activePlan.target}
                        targetValue={activePlan.targetValue ?? null}
                        conversionType="Total Orders"
                        channelsLabel={channelsLabelFor(state.channelCount)}
                        budgetSourceLabel={state.referencePeriod}
                        tacticsIncluded={state.tactics.length}
                        onEditPlan={() => openPlanForEdit(activePlan.id)}
                      />
                      <PlanOverviewCard
                        planStart={activePlan.planStart}
                        planEnd={activePlan.planEnd}
                        totalBudget={state.totals.budget}
                        incrementalSales={state.totals.sales}
                        incrementalRoas={state.totals.roas}
                        target={activePlan.target}
                        targetValue={activePlan.targetValue}
                        incrementalOrders={state.totals.orders}
                        cpo={state.totals.cpo}
                        onOptimize={() => startMiaFlow("spend")}
                      />
                    </>
                  ) : (
                    <CurveAndGoal />
                  )}
                  <BudgetTable target={currentTarget} />
                </div>
              </>
            )}
          </main>
          {!sidebarEditPlan && !(buildPlanOpen && buildPlanScreen === "review") && (
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
      {creatingPlanPhase && (
        <div className={styles.loadingOverlay} role="status" aria-live="polite">
          <span className={styles.loadingSpinner} aria-hidden />
          <p className={styles.loadingText}>
            {creatingPlanPhase === "creating" ? "Creating your plan.." : "Running simulations.."}
          </p>
        </div>
      )}
    </div>
  );
}
