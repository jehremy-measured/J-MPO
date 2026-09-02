import { useEffect, useRef, useState } from "react";
import { BudgetTable } from "../components/BudgetTable";
import { BuildPlanPage } from "../components/BuildPlanPage";
import { CreatingPlanOverlay } from "../components/CreatingPlanOverlay";
import { CurveAndGoal } from "../components/CurveAndGoal";
import { DuplicatePlanDialog } from "../components/DuplicatePlanDialog";
import { DuplicatePlanPopover } from "../components/DuplicatePlanPopover";
import { HeroBanner } from "../components/HeroBanner";
import { MiaSidePanel } from "../components/MiaSidePanel";
import { CloseIcon } from "../components/icons/CloseIcon";
import { SparkleIcon } from "../components/icons/SparkleIcon";
import { PlanInfoBar } from "../components/PlanInfoBar";
import { PlanOptionsMenu } from "../components/PlanOptionsMenu";
import { PlanOverviewCard } from "../components/PlanOverviewCard";
import { PlansTable, downloadPlansCsv } from "../components/PlansTable";
import { PrototypeBar } from "../components/PrototypeBar";
import { SharedPlanIcon } from "../components/SharedPlanIcon";
import { SidebarEditPlanPage } from "../components/SidebarEditPlanPage";
import { TopNavigation } from "../components/TopNavigation";
import { UpdateModelDialog } from "../components/UpdateModelDialog";
import type { BuildPlanState } from "../mpo/buildPlan/types";
import { formatRangeLabel, subtractYears } from "../mpo/buildPlan/dateUtils";
import {
  applyMethodChoice,
  budgetFromWindow,
  buildPlanToCreatePlanInput,
  channelsPresent,
  formatTargetLabel,
} from "../mpo/buildPlan/logic";
import { defaultBuildPlanState } from "../mpo/buildPlan/useBuildPlanFlow";
import { CURRENT_MODEL } from "../mpo/modelOptions";
import { formatBudget, type CreatePlanInput, type PlanKind, type PlanTarget } from "../mpo/types";
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

type OptimizeRow = { label: string; value: string; subtext?: string };

/** Summarizes an existing plan for the "Optimize this plan" review card Mia shows before
 * handing off to the (not-yet-built) real optimizer — same shape as the guided create-plan
 * flow's summary rows, minus anything upload-specific, since there's no BuildPlanState here. */
function buildOptimizeRows(
  planStart: Date,
  planEnd: Date,
  conversionType: string,
  channelsLabel: string,
  tacticsCount: number,
  target: PlanTarget,
  targetValue: number | null,
  totalBudget: number
): OptimizeRow[] {
  const rows: OptimizeRow[] = [
    { label: "Planning period", value: formatRangeLabel(planStart, planEnd) },
    { label: "Conversion type", value: conversionType },
    { label: "Channels", value: channelsLabel },
  ];
  if (target) rows.push({ label: "Target", value: formatTargetLabel(target, targetValue) });
  rows.push({ label: "Tactics", value: `${tacticsCount} tactics` });
  rows.push({ label: "Budget", value: formatBudget(totalBudget) });
  return rows;
}

/** MPO 1 screen — interactive prototype (Figma node 1:33651) */
export function MpoPage() {
  const state = useMpoState();
  const [miaOpen, setMiaOpen] = useState(false);
  const [buildPlanOpen, setBuildPlanOpen] = useState(false);
  const [buildPlanSeed, setBuildPlanSeed] = useState<BuildPlanState | null>(null);
  const [buildPlanKey, setBuildPlanKey] = useState(0);
  const [buildPlanMode, setBuildPlanMode] = useState<"create" | "edit">("create");
  const [planBuildStates, setPlanBuildStates] = useState<Record<string, BuildPlanState>>({});
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [miaStart, setMiaStart] = useState<{ token: number; planType: "outcomes" | "spend" } | null>(null);
  const [optimizeSignal, setOptimizeSignal] = useState<{
    token: number;
    periodLabel: string;
    rows: OptimizeRow[];
  } | null>(null);
  const [sidebarEditPlanId, setSidebarEditPlanId] = useState<string | null>(null);
  const [renamingTitle, setRenamingTitle] = useState(false);
  const [titleRenameValue, setTitleRenameValue] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);
  // Demo-only toggle: the seeded demo plans show by default; "Watch tutorial" can still hide
  // and reveal them for a live walkthrough, until a real plan is created — then all plans show
  // regardless.
  const [demoPlansVisible, setDemoPlansVisible] = useState(true);
  const [hasCreatedPlan, setHasCreatedPlan] = useState(false);
  const visiblePlans = hasCreatedPlan ? state.plans : demoPlansVisible ? state.plans : [];
  const [creatingPlan, setCreatingPlan] = useState(false);

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

  const startOptimizeFlow = (periodLabel: string, rows: OptimizeRow[]) => {
    setMiaOpen(true);
    setOptimizeSignal({ token: Date.now(), periodLabel, rows });
  };

  const handleCreatePlan = (input: CreatePlanInput, rawState: BuildPlanState, modeOverride?: "create" | "edit") => {
    const mode = modeOverride ?? buildPlanMode;
    const finish = () => {
      const result = state.createPlan(input);
      setPlanBuildStates((prev) => ({ ...prev, [result.id]: { ...rawState, screen: "review" } }));
      setViewMode("detail");
    };

    if (mode === "edit") {
      setBuildPlanOpen(false);
      finish();
      return;
    }

    setBuildPlanOpen(false);
    setCreatingPlan(true);
    setHasCreatedPlan(true);
    setTimeout(() => {
      finish();
      setCreatingPlan(false);
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

  // Nudges toward duplicating a simulation plan to explore what-if variants, a few seconds
  // after landing on it — resets whenever the viewed plan changes.
  const [showDuplicatePopover, setShowDuplicatePopover] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [updateModelDialogOpen, setUpdateModelDialogOpen] = useState(false);
  useEffect(() => {
    setShowDuplicatePopover(false);
    if (viewMode !== "detail" || activePlan?.kind !== "simulation") return;
    const timer = window.setTimeout(() => setShowDuplicatePopover(true), 10000);
    return () => window.clearTimeout(timer);
  }, [viewMode, activePlan?.id, activePlan?.kind]);

  const currentTarget =
    state.newPlanSummary && state.newPlanSummary.planId === state.activePlanId
      ? state.newPlanSummary.target
      : activePlan?.target ?? "incremental-sales";
  const currentPlanStart =
    state.newPlanSummary && state.newPlanSummary.planId === state.activePlanId
      ? state.newPlanSummary.planStart
      : activePlan?.planStart ?? new Date();
  const currentPlanEnd =
    state.newPlanSummary && state.newPlanSummary.planId === state.activePlanId
      ? state.newPlanSummary.planEnd
      : activePlan?.planEnd ?? new Date();
  // The plan-ready summary shown right after creation hasn't had any real time to accrue
  // actuals against, even if its dates happen to already be in-flight.
  const isNewlyCreatedPlan = !!(state.newPlanSummary && state.newPlanSummary.planId === state.activePlanId);
  // Plan detail and plan settings both take over the whole page, like a popup — the global
  // header steps aside while either is open instead of staying pinned above them.
  const headerHidden = buildPlanOpen || viewMode === "detail";

  return (
    <div className={`${styles.page} ${headerHidden ? styles.headerHidden : ""}`} data-node-id="1:33651">
      {!headerHidden && <TopNavigation miaOpen={miaOpen} onMiaToggle={() => setMiaOpen((open) => !open)} />}
      {headerHidden && !miaOpen && (
        <button
          type="button"
          className={styles.miaFloatingTab}
          onClick={() => setMiaOpen(true)}
          aria-label="Ask Mia"
          aria-expanded={miaOpen}
          aria-controls="mia-side-panel"
        >
          <SparkleIcon size={18} variant="fill" />
          <span>Ask Mia</span>
        </button>
      )}
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
              <div className={styles.detailPopup}>
                <div className={styles.detailHeader}>
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
                    <div className={styles.detailTitleGroup}>
                      {state.activePlanId ? (
                        <PlanOptionsMenu
                          planId={state.activePlanId}
                          planLabel={state.activePlanLabel}
                          title={state.activePlanLabel}
                          shared={activePlan?.shared}
                          onRenameRequest={startRenameTitle}
                          onToggleSharePlan={state.toggleSharePlan}
                          onDuplicatePlan={() => setDuplicateDialogOpen(true)}
                          onExportPlan={() => activePlan && downloadPlansCsv([activePlan])}
                          onDeletePlan={handleDeleteActivePlan}
                          onUpdateModel={() => setUpdateModelDialogOpen(true)}
                          currentModelLabel={`Current: ${CURRENT_MODEL.date}`}
                          variant="chevron"
                        />
                      ) : (
                        <span className={styles.detailPlanTitle}>{state.activePlanLabel}</span>
                      )}
                      {activePlan && (
                        <span
                          className={`${styles.kindBadge} ${
                            activePlan.kind === "optimization" ? styles.kindBadgeOptimization : styles.kindBadgeSimulation
                          }`}
                        >
                          {KIND_LABEL[activePlan.kind]}
                        </span>
                      )}
                      {activePlan?.shared && <SharedPlanIcon createdBy={activePlan.createdBy} />}
                      {showDuplicatePopover && activePlan && (
                        <DuplicatePlanPopover
                          onDuplicate={() => {
                            setShowDuplicatePopover(false);
                            setDuplicateDialogOpen(true);
                          }}
                          onDismiss={() => setShowDuplicatePopover(false)}
                        />
                      )}
                    </div>
                  )}
                  <div className={styles.detailHeaderActions}>
                    <button
                      type="button"
                      className={styles.detailCloseBtn}
                      aria-label="Close"
                      onClick={() => setViewMode("list")}
                    >
                      <CloseIcon size={20} />
                    </button>
                  </div>
                </div>
                <div className={styles.content}>
                  {state.newPlanSummary && state.newPlanSummary.planId === state.activePlanId ? (
                    <>
                      <PlanInfoBar
                        periodLabel={state.newPlanSummary.planningWindow}
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
                        onOptimize={() =>
                          startOptimizeFlow(
                            formatRangeLabel(state.newPlanSummary!.planStart, state.newPlanSummary!.planEnd),
                            buildOptimizeRows(
                              state.newPlanSummary!.planStart,
                              state.newPlanSummary!.planEnd,
                              state.newPlanSummary!.conversionType,
                              channelsLabelFor(state.channelCount),
                              state.tactics.length,
                              state.newPlanSummary!.target,
                              state.newPlanSummary!.targetValue,
                              state.totals.budget
                            )
                          )
                        }
                        allowActual={!isNewlyCreatedPlan}
                      />
                    </>
                  ) : activePlan?.kind === "simulation" ? (
                    <>
                      <PlanInfoBar
                        periodLabel={formatRangeLabel(activePlan.planStart, activePlan.planEnd)}
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
                        onOptimize={() =>
                          startOptimizeFlow(
                            formatRangeLabel(activePlan.planStart, activePlan.planEnd),
                            buildOptimizeRows(
                              activePlan.planStart,
                              activePlan.planEnd,
                              "Total Orders",
                              channelsLabelFor(state.channelCount),
                              state.tactics.length,
                              activePlan.target,
                              activePlan.targetValue ?? null,
                              state.totals.budget
                            )
                          )
                        }
                      />
                    </>
                  ) : (
                    <CurveAndGoal />
                  )}
                  <BudgetTable
                    target={currentTarget}
                    planStart={currentPlanStart}
                    planEnd={currentPlanEnd}
                    allowActual={!isNewlyCreatedPlan}
                  />
                </div>
              </div>
            )}
          </main>
          {!sidebarEditPlan && !headerHidden && (
            <footer className={styles.footer}>
              <span>© 2020-2026 Measured All Rights Reserved</span>
              <span className={styles.footerDivider} aria-hidden />
              <a href="#">Privacy Policy</a>
            </footer>
          )}
        </div>
        <MiaSidePanel
          open={miaOpen}
          onClose={() => setMiaOpen(false)}
          onEditInMainFlow={(seed) => openBuildPlanPage(seed)}
          onCreatePlan={(seed) => handleCreatePlan(buildPlanToCreatePlanInput(seed), seed, "create")}
          startSignal={miaStart}
          optimizeSignal={optimizeSignal}
          onEditConstraints={() => {
            const planId = state.newPlanSummary?.planId ?? activePlan?.id;
            if (planId) openPlanForEdit(planId);
          }}
          onOptimizePlan={() => state.notify(`Optimized "${state.activePlanLabel}" with Mia`)}
        />
      </div>
      <PrototypeBar
        message={state.statusMessage}
        onDismiss={() => state.setStatusMessage(null)}
        totalBudget={state.totals.budget}
        totalSales={state.totals.sales}
        blendedRoas={state.totals.roas}
      />
      {creatingPlan && <CreatingPlanOverlay />}
      {duplicateDialogOpen && activePlan && (
        <DuplicatePlanDialog
          planLabel={activePlan.label}
          onClose={() => setDuplicateDialogOpen(false)}
          onConfirm={(name) => {
            state.duplicatePlan(activePlan.id, name);
            setDuplicateDialogOpen(false);
          }}
        />
      )}
      {updateModelDialogOpen && activePlan && (
        <UpdateModelDialog
          onClose={() => setUpdateModelDialogOpen(false)}
          onConfirm={(model) => {
            state.notify(`Updated "${activePlan.label}" to the ${model.date} model`);
            setUpdateModelDialogOpen(false);
          }}
        />
      )}
    </div>
  );
}
