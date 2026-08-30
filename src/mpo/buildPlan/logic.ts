import { assets } from "../../assets/figma";
import type { CreatePlanInput, Tactic } from "../types";
import {
  BUILD_TACTICS,
  CHANNEL_COLORS,
  CT_LOOKUP,
  DAILY_RATE,
  XLS_BUDGET,
  pastWindows,
} from "./data";
import { daysBetweenInclusive, formatRangeLabel } from "./dateUtils";
import type { BuildPlanState, BuildTactic, PastWindow } from "./types";

export function planDaysFor(state: BuildPlanState): number {
  return daysBetweenInclusive(state.planStart, state.planEnd);
}

export function currentWindows(state: BuildPlanState): PastWindow[] {
  return pastWindows(planDaysFor(state));
}

export function activeWindow(state: BuildPlanState): PastWindow {
  const windows = currentWindows(state);
  return windows.find((w) => w.id === state.win) ?? windows[0];
}

/** Recompute non-overridden budgets from the selected past window. */
export function budgetFromWindow(
  state: BuildPlanState
): { budget: Record<string, number | null>; window: PastWindow } {
  const n = planDaysFor(state);
  const window = activeWindow(state);
  const budget = { ...state.budget };
  BUILD_TACTICS.forEach((t) => {
    if (state.overridden[t.id]) return;
    budget[t.id] = t.dormant ? 0 : Math.round(DAILY_RATE[t.id] * n * window.mult);
  });
  return { budget, window };
}

export function budgetFromUpload(): Record<string, number | null> {
  const budget: Record<string, number | null> = {};
  BUILD_TACTICS.forEach((t) => {
    budget[t.id] = XLS_BUDGET[t.id];
  });
  return budget;
}

/** Split an amount across tactics, weighted by recent daily spend (even split if no signal). */
function allocateTotalBudget(amount: number, tacticIds: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  if (tacticIds.length === 0) return out;
  const weights = tacticIds.map((id) => DAILY_RATE[id] ?? 0);
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const raw = tacticIds.map((_, i) => (weightSum > 0 ? (amount * weights[i]) / weightSum : amount / tacticIds.length));
  const rounded = raw.map((v) => Math.max(0, Math.round(v)));
  const roundingError = amount - rounded.reduce((a, b) => a + b, 0);
  if (rounded.length > 0) rounded[rounded.length - 1] = Math.max(0, rounded[rounded.length - 1] + roundingError);
  tacticIds.forEach((id, i) => (out[id] = rounded[i]));
  return out;
}

/**
 * Split a single total budget across tactics for brands with no tactic-wise numbers.
 * Hand-edited (overridden) tactics keep their value; the rest share what's left,
 * weighted by recent daily spend, so re-running after an edit only moves the remainder.
 */
export function budgetFromTotal(state: BuildPlanState): { budget: Record<string, number | null> } {
  const total = state.totalBudget ?? 0;
  const budget = { ...state.budget };
  BUILD_TACTICS.forEach((t) => {
    if (t.dormant && !state.overridden[t.id]) budget[t.id] = 0;
  });
  const overriddenSum = BUILD_TACTICS.reduce(
    (sum, t) => sum + (state.overridden[t.id] ? budget[t.id] ?? 0 : 0),
    0
  );
  const remainderIds = BUILD_TACTICS.filter((t) => !state.overridden[t.id] && !t.dormant).map((t) => t.id);
  const allocation = allocateTotalBudget(Math.max(0, total - overriddenSum), remainderIds);
  remainderIds.forEach((id) => (budget[id] = allocation[id]));
  return { budget };
}

export function defaultIncludes(
  method: BuildPlanState["method"],
  budget: Record<string, number | null>
): Record<string, boolean> {
  const included: Record<string, boolean> = {};
  BUILD_TACTICS.forEach((t) => {
    if (method === "upload") {
      const v = budget[t.id];
      included[t.id] = v != null && v > 0;
    } else {
      included[t.id] = !t.dormant;
    }
  });
  return included;
}

export function channelsPresent(): string[] {
  const list: string[] = [];
  BUILD_TACTICS.forEach((t) => {
    if (!list.includes(t.channel)) list.push(t.channel);
  });
  return list;
}

export function visibleTactics(state: BuildPlanState) {
  const q = state.query.trim().toLowerCase();
  return BUILD_TACTICS.filter(
    (t) =>
      (state.channel === "All" || t.channel === state.channel) &&
      t.name.toLowerCase().includes(q)
  );
}

/** Tactics that made the cut, in catalog order — used by read-only summaries. */
export function includedTactics(state: BuildPlanState): BuildTactic[] {
  return BUILD_TACTICS.filter((t) => state.included[t.id]);
}

export function includedCount(state: BuildPlanState): number {
  return BUILD_TACTICS.filter((t) => state.included[t.id]).length;
}

export function includedTotal(state: BuildPlanState): number {
  return BUILD_TACTICS.reduce(
    (sum, t) => sum + (state.included[t.id] && state.budget[t.id] ? state.budget[t.id]! : 0),
    0
  );
}

export function excludeReason(
  state: BuildPlanState,
  tacticId: string
): "no-budget-in-file" | "no-spend-12mo" | null {
  if (state.included[tacticId]) return null;
  const tactic = BUILD_TACTICS.find((t) => t.id === tacticId);
  const v = state.budget[tacticId];
  if (state.method === "upload" && (v == null || v === 0)) return "no-budget-in-file";
  if ((state.method === "fetch" || state.method === "total") && tactic?.dormant) return "no-spend-12mo";
  return null;
}

/** Target minus what's actually allocated across included tactics — nonzero after a manual edit unbalances a total-budget plan. */
export function allocationDelta(state: BuildPlanState): number {
  return (state.totalBudget ?? 0) - includedTotal(state);
}

export function ctSummary(state: BuildPlanState): { label: string; attrLabels: string[] } {
  if (state.attrs.length > 0) {
    return { label: "Combined attribute", attrLabels: state.attrs.map((id) => CT_LOOKUP[id]) };
  }
  return { label: state.singleCT ? CT_LOOKUP[state.singleCT] ?? "" : "", attrLabels: [] };
}

export function periodLabel(state: BuildPlanState): string {
  return formatRangeLabel(state.planStart, state.planEnd);
}

function initialsIconDataUri(tactic: BuildTactic): string {
  const color = CHANNEL_COLORS[tactic.channel] ?? "#516877";
  const initial = tactic.name.trim().charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle cx="10" cy="10" r="10" fill="${color}"/><text x="10" y="14" font-family="Inter,Arial,sans-serif" font-size="10" font-weight="600" fill="#ffffff" text-anchor="middle">${initial}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function tacticLogo(tactic: BuildTactic): string {
  const name = tactic.name.toLowerCase();
  if (name.includes("google")) return assets.google;
  if (name.includes("meta")) return assets.meta;
  if (name.includes("tiktok")) return assets.tiktok;
  return initialsIconDataUri(tactic);
}

export function buildPlanToCreatePlanInput(state: BuildPlanState): CreatePlanInput {
  const included = BUILD_TACTICS.filter((t) => state.included[t.id]);
  const { label: ctLabel, attrLabels } = ctSummary(state);
  const conversionType = attrLabels.length ? attrLabels.join(" + ") : ctLabel;

  const tactics: Tactic[] = included.map((t) => {
    const budget = state.budget[t.id] ?? 0;
    return {
      id: t.id,
      name: t.name,
      channel: t.channel,
      logo: tacticLogo(t),
      budgetOld: budget,
      budgetNew: budget,
      locked: false,
      salesOld: Math.round(budget * 3.2),
      marginalRoas: 3.5,
    };
  });

  const targetBudget = Math.max(500_000, includedTotal(state));
  const referencePeriod =
    state.method === "fetch"
      ? activeWindow(state).label
      : state.method === "total"
        ? "Total budget, split by tactic"
        : state.source || "Uploaded budget";
  const label = periodLabel(state);

  return {
    name: `${label} plan`,
    segment: conversionType || "All Orders",
    planningWindow: label,
    referencePeriod,
    targetBudget,
    optimizationMode: "balanced",
    metricMode: "roas",
    goalType: "target-budget",
    totalSalesGoal: 0,
    baselineSalesForecast: targetBudget * 16,
    pacingEnabled: false,
    conversionType: conversionType || "All Orders",
    channelCount: channelsPresent().length,
    tactics,
  };
}

export function downloadBudgetTemplate(): void {
  let csv = "Tactic,Channel,Budget\n";
  BUILD_TACTICS.forEach((t) => {
    csv += `${t.name},${t.channel},\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "MPO_budget_template.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}
