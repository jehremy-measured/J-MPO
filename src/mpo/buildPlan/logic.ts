import { assets } from "../../assets/figma";
import type { CreatePlanInput, Tactic } from "../types";
import {
  BUILD_TACTICS,
  CHANNEL_COLORS,
  CT_LOOKUP,
  DAILY_RATE,
  XLS_BUDGET,
  defaultSourceStart,
  windowFromStart,
} from "./data";
import { daysBetweenInclusive, formatRangeLabel } from "./dateUtils";
import type { BuildPlanState, BuildTactic, SourceWindow } from "./types";

export function planDaysFor(state: BuildPlanState): number {
  return daysBetweenInclusive(state.planStart, state.planEnd);
}

export function activeWindow(state: BuildPlanState): SourceWindow {
  return windowFromStart(state.sourceStart, planDaysFor(state));
}

/** Recompute non-overridden budgets from the selected source period. */
export function budgetFromWindow(
  state: BuildPlanState
): { budget: Record<string, number | null>; window: SourceWindow } {
  const n = planDaysFor(state);
  const window = activeWindow(state);
  const budget = { ...state.budget };
  BUILD_TACTICS.forEach((t) => {
    if (state.overridden[t.id]) return;
    budget[t.id] = t.dormant ? 0 : Math.round(DAILY_RATE[t.id] * n);
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
    (t) => state.channels.includes(t.channel) && t.name.toLowerCase().includes(q)
  );
}

export function channelFilterLabel(state: BuildPlanState): string {
  const total = channelsPresent().length;
  if (state.channels.length === total) return "All channels";
  return `${state.channels.length} channel${state.channels.length === 1 ? "" : "s"}`;
}

/** Pure state transition for landing an uploaded budget — shared by the hook action and any
 * caller that needs the resulting state synchronously (e.g. a caller that computes the
 * post-upload state ahead of a delay, before handing off to another view). */
export function applyUploadedBudget(state: BuildPlanState): BuildPlanState {
  const budget = budgetFromUpload();
  return {
    ...state,
    budget,
    source: "budget_plan.xlsx",
    included: defaultIncludes("upload", budget),
    query: "",
    channels: channelsPresent(),
    screen: "review",
  };
}

/** Pure state transition for picking a budget method — shared by the hook action and any caller that needs the resulting state synchronously (e.g. handing off to another view before committing to the flow's own state). */
export function applyMethodChoice(
  state: BuildPlanState,
  method: "upload" | "fetch"
): BuildPlanState {
  const reset: BuildPlanState = {
    ...state,
    method,
    overridden: {},
    budget: {},
    sourceStart: defaultSourceStart(planDaysFor(state)),
    source: "",
    included: {},
    query: "",
    channels: channelsPresent(),
  };
  if (method === "upload") {
    return { ...reset, screen: "upload" };
  }
  const { budget } = budgetFromWindow(reset);
  return { ...reset, budget, included: defaultIncludes("fetch", budget), screen: "review" };
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
  if (state.method === "fetch" && tactic?.dormant) return "no-spend-12mo";
  return null;
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
    state.method === "fetch" ? activeWindow(state).label : state.source || "Uploaded budget";
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
