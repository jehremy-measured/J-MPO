import { useEffect, useRef, useState } from "react";
import { BudgetTable } from "../components/BudgetTable";
import { BuildPlanPage } from "../components/BuildPlanPage";
import { CurveAndGoal } from "../components/CurveAndGoal";
import { HeroBanner } from "../components/HeroBanner";
import { MiaSidePanel } from "../components/MiaSidePanel";
import { BackArrowIcon, EditIcon } from "../components/icons/BuildPlanIcons";
import { MaterialIcon } from "../components/icons/MaterialIcon";
import { PlanInfoBar } from "../components/PlanInfoBar";
import { PlanOptionsMenu } from "../components/PlanOptionsMenu";
import { PlanOverviewCard } from "../components/PlanOverviewCard";
import { PlansTable } from "../components/PlansTable";
import { PrototypeBar } from "../components/PrototypeBar";
import { SidebarEditPlanPage } from "../components/SidebarEditPlanPage";
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
  const [sidebarEditPlanId, setSidebarEditPlanId] = useState<string | null>(null);
  const [renamingTitle, setRenamingTitle] = useState(false);
  const [titleRenameValue, setTitleRenameValue] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingTitle) titleInputRef.current?.select();
  }, [renamingTitle]);

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
    const plan = state.plans.find((p) => p.id === planId);
    if (plan?.editVariant === "sidebar") {
      setSidebarEditPlanId(planId);
      return;
    }
    const stored = planBuildStates[planId];
    if (stored) {
      openBuildPlanPage(stored);
      return;
    }
    if (!plan) return;
    const seed = defaultBuildPlanState();
    seed.planStart = plan.planStart;
    seed.planEnd = plan.planEnd;
    seed.target = plan.target;
    seed.singleCT = "total";
    openBuildPlanPage(applyMethodChoice(seed, "fetch"));
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
                      style={{ width: `${Math.max(14, titleRenameValue.length + 2)}ch` }}
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
                    <button type="button" className={styles.detailPlanTitleBtn} onClick={startRenameTitle}>
                      <span className={styles.detailPlanTitle}>{state.activePlanLabel}</span>
                      <span className={styles.detailPlanTitleEditIcon}>
                        <EditIcon size={20} />
                      </span>
                    </button>
                  )}
                  <div className={styles.syncPill}>
                    <span className={styles.syncDot} aria-hidden />
                    <span className={styles.syncText}>Updated 2 hours ago</span>
                    <span className={styles.syncDivider} aria-hidden />
                    <button type="button" className={styles.syncRefreshBtn}>
                      <MaterialIcon name="autorenew" size={20} />
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
                      <TargetBanner
                        target={state.newPlanSummary.target}
                        targetValue={state.newPlanSummary.targetValue}
                        incrementalSales={state.totals.sales}
                        roas={state.totals.roas}
                        incrementalOrders={state.totals.orders}
                        cpo={state.totals.cpo}
                      />
                      <PlanInfoBar
                        periodLabel={state.newPlanSummary.planningWindow}
                        target={state.newPlanSummary.target}
                        targetValue={state.newPlanSummary.targetValue}
                        conversionType={state.newPlanSummary.conversionType}
                        budget={state.totals.budget}
                        tacticsIncluded={state.tactics.length}
                        tacticsTotal={state.tactics.length}
                        onEditPlan={() => openPlanForEdit(state.newPlanSummary!.planId)}
                      />
                      <PlanOverviewCard
                        planStart={state.newPlanSummary.planStart}
                        planEnd={state.newPlanSummary.planEnd}
                        totalBudget={state.totals.budget}
                        incrementalSales={state.totals.sales}
                        incrementalRoas={state.totals.roas}
                      />
                    </>
                  ) : activePlan?.kind === "simulation" ? (
                    <>
                      <TargetBanner
                        target={activePlan.target}
                        targetValue={null}
                        incrementalSales={state.totals.sales}
                        roas={state.totals.roas}
                        incrementalOrders={state.totals.orders}
                        cpo={state.totals.cpo}
                      />
                      <PlanInfoBar
                        periodLabel={formatRangeLabel(activePlan.planStart, activePlan.planEnd)}
                        target={activePlan.target}
                        targetValue={null}
                        conversionType="All Orders"
                        budget={state.totals.budget}
                        tacticsIncluded={state.tactics.length}
                        tacticsTotal={state.tactics.length}
                        onEditPlan={() => openPlanForEdit(activePlan.id)}
                      />
                      <PlanOverviewCard
                        planStart={activePlan.planStart}
                        planEnd={activePlan.planEnd}
                        totalBudget={state.totals.budget}
                        incrementalSales={state.totals.sales}
                        incrementalRoas={state.totals.roas}
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
    </div>
  );
}
