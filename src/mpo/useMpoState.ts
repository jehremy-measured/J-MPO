import { useCallback, useMemo, useState } from "react";
import {
  applyTargetBudget,
  blendedCpo,
  blendedRoas,
  clampTargetBudget,
  setTacticAdjustment,
  tacticAdjustment,
  totalBudget,
  totalOrders,
  totalSales,
} from "./calc";
import { DEFAULT_TARGET_BUDGET, INITIAL_TACTICS, PLANS } from "./data";
import type {
  BudgetView,
  CreatePlanInput,
  MetricMode,
  OptimizationMode,
  Plan,
  PlanSnapshot,
  PlanTarget,
  Tactic,
} from "./types";

function cloneTactics(tactics: Tactic[]): Tactic[] {
  return tactics.map((t) => ({ ...t }));
}

function freshSnapshot(): PlanSnapshot {
  const tactics = cloneTactics(INITIAL_TACTICS);
  return {
    tactics,
    baseline: cloneTactics(tactics),
    targetBudget: DEFAULT_TARGET_BUDGET,
    optimizationMode: "balanced",
    metricMode: "roas",
    segment: "US Online Orders",
    planningWindow: "Rolling 30 days",
    referencePeriod: "Last 30 days",
    goalType: "incremental-roas",
    totalSalesGoal: 0,
    baselineSalesForecast: totalBudget(tactics) * 16,
    pacingEnabled: false,
    conversionType: "All Orders",
    channelCount: 3,
  };
}

function snapshotFromInput(input: CreatePlanInput): PlanSnapshot {
  const tactics = input.tactics.length ? cloneTactics(input.tactics) : cloneTactics(INITIAL_TACTICS);
  return {
    tactics,
    baseline: cloneTactics(tactics),
    targetBudget: input.targetBudget,
    optimizationMode: input.optimizationMode,
    metricMode: input.metricMode,
    segment: input.segment,
    planningWindow: input.planningWindow,
    referencePeriod: input.referencePeriod,
    goalType: input.goalType,
    totalSalesGoal: input.totalSalesGoal,
    baselineSalesForecast: input.baselineSalesForecast,
    pacingEnabled: input.pacingEnabled,
    conversionType: input.conversionType,
    channelCount: input.channelCount,
  };
}

function initialPlanData(): Record<string, PlanSnapshot> {
  return { default: freshSnapshot() };
}

export function useMpoState() {
  const [plans, setPlans] = useState<Plan[]>(PLANS);
  const [planData, setPlanData] = useState<Record<string, PlanSnapshot>>(initialPlanData);
  const [activePlanId, setActivePlanId] = useState("default");
  const [tactics, setTactics] = useState<Tactic[]>(() =>
    cloneTactics(INITIAL_TACTICS)
  );
  const [baseline, setBaseline] = useState<Tactic[]>(() =>
    cloneTactics(INITIAL_TACTICS)
  );
  const [targetBudget, setTargetBudget] = useState(DEFAULT_TARGET_BUDGET);
  const [optimizationMode, setOptimizationMode] =
    useState<OptimizationMode>("balanced");
  const [metricMode, setMetricMode] = useState<MetricMode>("roas");
  const [segment, setSegment] = useState("US Online Orders");
  const [planningWindow, setPlanningWindow] = useState("Rolling 30 days");
  const [referencePeriod, setReferencePeriod] = useState("Last 30 days");
  const [goalType, setGoalType] = useState<PlanSnapshot["goalType"]>("incremental-roas");
  const [totalSalesGoal, setTotalSalesGoal] = useState(0);
  const [baselineSalesForecast, setBaselineSalesForecast] = useState(
    totalBudget(INITIAL_TACTICS) * 16
  );
  const [pacingEnabled, setPacingEnabled] = useState(false);
  const [conversionType, setConversionType] = useState("All Orders");
  const [channelCount, setChannelCount] = useState(3);
  const [csBannerDismissed, setCsBannerDismissed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [budgetView, setBudgetView] = useState<BudgetView>("tactics");
  const [selectedTacticId, setSelectedTacticId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [newPlanSummary, setNewPlanSummary] = useState<{
    planId: string;
    planningWindow: string;
    planStart: Date;
    planEnd: Date;
    conversionType: string;
    tacticsCount: number;
    totalBudget: number;
    target: PlanTarget;
    targetValue: number | null;
  } | null>(null);

  const notify = useCallback((message: string) => {
    setStatusMessage(message);
  }, []);

  const currentSnapshot = useCallback(
    (): PlanSnapshot => ({
      tactics: cloneTactics(tactics),
      baseline: cloneTactics(baseline),
      targetBudget,
      optimizationMode,
      metricMode,
      segment,
      planningWindow,
      referencePeriod,
      goalType,
      totalSalesGoal,
      baselineSalesForecast,
      pacingEnabled,
      conversionType,
      channelCount,
    }),
    [
      tactics,
      baseline,
      targetBudget,
      optimizationMode,
      metricMode,
      segment,
      planningWindow,
      referencePeriod,
      goalType,
      totalSalesGoal,
      baselineSalesForecast,
      pacingEnabled,
      conversionType,
      channelCount,
    ]
  );

  const applySnapshot = useCallback((snapshot: PlanSnapshot) => {
    setTactics(cloneTactics(snapshot.tactics));
    setBaseline(cloneTactics(snapshot.baseline));
    setTargetBudget(snapshot.targetBudget);
    setOptimizationMode(snapshot.optimizationMode);
    setMetricMode(snapshot.metricMode);
    setSegment(snapshot.segment);
    setPlanningWindow(snapshot.planningWindow);
    setReferencePeriod(snapshot.referencePeriod);
    setGoalType(snapshot.goalType);
    setTotalSalesGoal(snapshot.totalSalesGoal);
    setBaselineSalesForecast(snapshot.baselineSalesForecast);
    setPacingEnabled(snapshot.pacingEnabled);
    setConversionType(snapshot.conversionType);
    setChannelCount(snapshot.channelCount);
  }, []);

  const selectPlan = useCallback(
    (id: string) => {
      if (id === activePlanId) return;

      setPlanData((prev) => ({
        ...prev,
        [activePlanId]: currentSnapshot(),
      }));

      const snapshot = planData[id] ?? freshSnapshot();
      applySnapshot(snapshot);
      setActivePlanId(id);
      setSelectedTacticId(null);
    },
    [activePlanId, applySnapshot, currentSnapshot, planData]
  );

  const createPlan = useCallback(
    (input: CreatePlanInput) => {
      setPlanData((prev) => ({
        ...prev,
        [activePlanId]: currentSnapshot(),
      }));

      const id = `mia-${Date.now()}`;
      const label = input.name.trim() || `Mia Plan ${plans.length + 1}`;
      const snapshot = snapshotFromInput(input);

      setPlans((prev) => [
        ...prev,
        {
          id,
          label,
          kind: input.planKind,
          createdBy: "JH",
          lastEdited: new Date(),
          target: input.target,
          planStart: input.planStart,
          planEnd: input.planEnd,
        },
      ]);
      setPlanData((prev) => ({ ...prev, [id]: snapshot }));
      applySnapshot(snapshot);
      setActivePlanId(id);
      setSelectedTacticId(null);
      setNewPlanSummary({
        planId: id,
        planningWindow: input.planningWindow,
        planStart: input.planStart,
        planEnd: input.planEnd,
        conversionType: input.conversionType,
        tacticsCount: input.tactics.length,
        totalBudget: input.targetBudget,
        target: input.target,
        targetValue: input.targetValue,
      });
      notify(`Created "${label}" with Mia`);

      return { id, label };
    },
    [activePlanId, applySnapshot, currentSnapshot, notify, plans]
  );

  const duplicatePlan = useCallback(
    (id: string) => {
      const source = plans.find((p) => p.id === id);
      if (!source) return;

      const sourceSnapshot = id === activePlanId ? currentSnapshot() : planData[id] ?? freshSnapshot();
      const newId = `copy-${Date.now()}`;
      const copy: Plan = {
        ...source,
        id: newId,
        label: `${source.label} (copy)`,
        createdBy: "JH",
        lastEdited: new Date(),
      };

      setPlans((prev) => [...prev, copy]);
      setPlanData((prev) => ({
        ...prev,
        [newId]: {
          ...sourceSnapshot,
          tactics: cloneTactics(sourceSnapshot.tactics),
          baseline: cloneTactics(sourceSnapshot.baseline),
        },
      }));
      notify(`Duplicated "${source.label}"`);
    },
    [plans, planData, activePlanId, currentSnapshot, notify]
  );

  const deletePlan = useCallback((id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
    setPlanData((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const totals = useMemo(
    () => ({
      budget: totalBudget(tactics),
      sales: totalSales(tactics, optimizationMode),
      roas: blendedRoas(tactics, optimizationMode),
      orders: totalOrders(tactics, optimizationMode),
      cpo: blendedCpo(tactics, optimizationMode),
    }),
    [tactics, optimizationMode]
  );

  const filteredTactics = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tactics;
    return tactics.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.channel.toLowerCase().includes(q)
    );
  }, [tactics, searchQuery]);

  const groupedRows = useMemo(() => {
    if (budgetView !== "channels") {
      return filteredTactics.map((t) => ({ key: t.id, label: null, tactic: t }));
    }
    const byChannel = new Map<string, Tactic[]>();
    for (const tactic of filteredTactics) {
      const list = byChannel.get(tactic.channel) ?? [];
      list.push(tactic);
      byChannel.set(tactic.channel, list);
    }
    const rows: { key: string; label: string | null; tactic: Tactic }[] = [];
    for (const [channel, channelTactics] of byChannel) {
      channelTactics.forEach((tactic, index) => {
        rows.push({
          key: tactic.id,
          label: index === 0 ? channel : null,
          tactic,
        });
      });
    }
    return rows;
  }, [filteredTactics, budgetView]);

  const handleTargetBudgetChange = useCallback((value: number) => {
    const clamped = clampTargetBudget(value);
    setTargetBudget(clamped);
    setTactics((prev) => applyTargetBudget(prev, clamped));
  }, []);

  const handleTacticAdjustmentChange = useCallback(
    (id: string, adjustment: number) => {
      setTactics((prev) =>
        prev.map((t) =>
          t.id === id ? setTacticAdjustment(t, adjustment) : t
        )
      );
    },
    []
  );

  const handleToggleLock = useCallback((id: string) => {
    setTactics((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, locked: !t.locked } : t
      )
    );
  }, []);

  const handleResetGoals = useCallback(() => {
    setTactics(cloneTactics(baseline));
    setTargetBudget(DEFAULT_TARGET_BUDGET);
    setOptimizationMode("balanced");
  }, [baseline]);

  const handleSaveBaseline = useCallback(() => {
    setBaseline(cloneTactics(tactics));
  }, [tactics]);

  const handleBaselineSalesForecastChange = useCallback((value: number) => {
    setBaselineSalesForecast(value);
  }, []);

  const activePlanLabel =
    plans.find((p) => p.id === activePlanId)?.label ?? "Untitled plan";
  const referenceBudgetTotal = useMemo(() => totalBudget(baseline), [baseline]);

  return {
    plans,
    activePlanId,
    activePlanLabel,
    selectPlan,
    createPlan,
    duplicatePlan,
    deletePlan,
    tactics,
    filteredTactics,
    groupedRows,
    targetBudget,
    optimizationMode,
    setOptimizationMode,
    metricMode,
    setMetricMode,
    segment,
    planningWindow,
    referencePeriod,
    goalType,
    totalSalesGoal,
    baselineSalesForecast,
    setBaselineSalesForecast: handleBaselineSalesForecastChange,
    pacingEnabled,
    conversionType,
    channelCount,
    referenceBudgetTotal,
    csBannerDismissed,
    setCsBannerDismissed,
    searchQuery,
    setSearchQuery,
    budgetView,
    setBudgetView,
    selectedTacticId,
    setSelectedTacticId,
    statusMessage,
    setStatusMessage,
    newPlanSummary,
    totals,
    notify,
    handleTargetBudgetChange,
    handleTacticAdjustmentChange,
    handleToggleLock,
    handleResetGoals,
    handleSaveBaseline,
    tacticAdjustment,
  };
}

export type MpoState = ReturnType<typeof useMpoState>;
