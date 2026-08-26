import { assets } from "../../assets/figma";
import type { CreatePlanInput, PlanKind, PlanTarget, Tactic } from "../types";
import { formatBudget } from "../types";
import { BUDGET_TEMPLATE_BASE64, BUDGET_TEMPLATE_FILENAME, BUDGET_TEMPLATE_MIME } from "./budgetTemplateData";
import {
  BUILD_TACTICS,
  CHANNEL_COLORS,
  CT_LOOKUP,
  DAILY_RATE,
  currencyFormatter,
  REFERENCE_CPO,
  REFERENCE_DAILY_INCREMENTAL_ORDERS,
  REFERENCE_DAILY_INCREMENTAL_SALES,
  REFERENCE_INCREMENTAL_ORDERS,
  REFERENCE_INCREMENTAL_SALES,
  REFERENCE_ROAS,
  REFERENCE_WINDOW_END,
  REFERENCE_WINDOW_START,
  TARGET_OPTIONS,
  XLS_BUDGET,
  defaultSourceStart,
  windowFromStart,
} from "./data";
import { daysBetweenInclusive, formatRangeLabel, isSameDay, subtractYears } from "./dateUtils";
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

/** The un-overridden budget for a single tactic, given the current source (upload or fetch window). */
export function defaultBudgetFor(state: BuildPlanState, id: string): number | null {
  if (state.method === "upload") return XLS_BUDGET[id] ?? null;
  const tactic = BUILD_TACTICS.find((t) => t.id === id);
  if (!tactic) return null;
  if (tactic.dormant) return 0;
  return Math.round(DAILY_RATE[tactic.id] * planDaysFor(state));
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

/** Combined attributes read as the first selected name plus a "+N" count of the rest,
 * instead of spelling every selected name out ("New Customers +1" vs "New Customers +
 * Returning Customers"). */
export function formatAttrLabels(attrLabels: string[]): string {
  if (attrLabels.length <= 1) return attrLabels[0] ?? "";
  return `${attrLabels[0]} +${attrLabels.length - 1}`;
}

export function periodLabel(state: BuildPlanState): string {
  return formatRangeLabel(state.planStart, state.planEnd);
}

export function targetNeedsValue(target: PlanTarget | null): boolean {
  return target !== null;
}

/** Formats a target + optional value as a display label, e.g. "Incremental Sales · $250,000".
 * Works from bare target/value fields so it can describe a saved Plan, not just build-flow state. */
export function formatTargetLabel(target: PlanTarget | null, targetValue: number | null): string {
  const label = TARGET_OPTIONS.find((o) => o.id === target)?.label ?? "No target";
  const clean = label.replace(/\s*target$/i, "");
  if (targetValue == null || !targetNeedsValue(target)) return clean;
  const value =
    target === "incremental-roas" || target === "incremental-cpo"
      ? `$${targetValue.toFixed(2)}`
      : target === "incremental-orders"
      ? targetValue.toLocaleString("en-US")
      : formatBudget(targetValue);
  return `${clean} · ${value}`;
}

export function targetLabel(state: BuildPlanState): string {
  return formatTargetLabel(state.target, state.targetValue);
}

/** Condensed label/value pairs summarizing every input that went into a plan — used by Mia's
 * "plan is ready" card, which shows this in place of auto-opening the full review screen. */
export function planSummaryRows(state: BuildPlanState): { label: string; value: string }[] {
  const { label: ctLabel, attrLabels } = ctSummary(state);
  const conversionTypeLabel = attrLabels.length ? formatAttrLabels(attrLabels) : ctLabel;
  const rows = [
    { label: "Planning period", value: periodLabel(state) },
    { label: "Conversion type", value: conversionTypeLabel },
    { label: "Channels", value: channelFilterLabel(state) },
  ];
  if (state.target) rows.push({ label: "Target", value: targetLabel(state) });
  rows.push({ label: "Tactics", value: `${includedCount(state)} of ${BUILD_TACTICS.length}` });
  rows.push({ label: "Budget", value: currencyFormatter.format(includedTotal(state)) });
  return rows;
}

/** Default value for the target field: last year's actuals for this exact period, or the latest
 * comparable period when last year isn't covered by the data we have. */
export function referenceTargetDefault(state: BuildPlanState, target: Exclude<PlanTarget, null>): number {
  if (target === "incremental-roas") return REFERENCE_ROAS;
  if (target === "incremental-cpo") return Math.round(REFERENCE_CPO * 100) / 100;

  const planDays = planDaysFor(state);
  const priorYearStart = subtractYears(state.planStart, 1);
  const priorYearEnd = subtractYears(state.planEnd, 1);
  const priorYearCovered =
    isSameDay(priorYearStart, REFERENCE_WINDOW_START) && isSameDay(priorYearEnd, REFERENCE_WINDOW_END);

  if (target === "incremental-orders") {
    return priorYearCovered
      ? REFERENCE_INCREMENTAL_ORDERS
      : Math.round(REFERENCE_DAILY_INCREMENTAL_ORDERS * planDays);
  }

  return priorYearCovered
    ? REFERENCE_INCREMENTAL_SALES
    : Math.round(REFERENCE_DAILY_INCREMENTAL_SALES * planDays);
}

export type PlanRevision = { state: BuildPlanState; summary: string };

const TARGET_MATCHERS: { re: RegExp; target: Exclude<PlanTarget, null> }[] = [
  { re: /\broas\b/i, target: "incremental-roas" },
  { re: /\bcpo\b/i, target: "incremental-cpo" },
  { re: /\border(s)?\b/i, target: "incremental-orders" },
  { re: /\bsales?\b/i, target: "incremental-sales" },
];

/** Parses a bare number with an optional $ prefix and/or k/m/b scale suffix, e.g. "1,200",
 * "$1.2m", "50000". Used for target values, which aren't always dollar amounts. */
function parseNumericAmount(text: string): number | null {
  const m = text.match(/\$?\s*([\d][\d,]*(?:\.\d+)?)\s*(k|m|b)?\b/i);
  if (!m) return null;
  const raw = parseFloat(m[1].replace(/,/g, ""));
  if (isNaN(raw)) return null;
  const suffix = m[2]?.toLowerCase();
  if (suffix === "k") return raw * 1_000;
  if (suffix === "m") return raw * 1_000_000;
  if (suffix === "b") return raw * 1_000_000_000;
  return raw;
}

/** Same as parseNumericAmount, but requires a $ sign or k/m/b suffix so a stray bare number in
 * the message (e.g. a percentage) isn't mistaken for a new budget total. */
function parseCurrencyAmount(text: string): number | null {
  const m = text.match(/\$\s*([\d][\d,]*(?:\.\d+)?)\s*(k|m|b)?\b|\b([\d][\d,]*(?:\.\d+)?)\s*(k|m|b)\b/i);
  if (!m) return null;
  const numStr = m[1] ?? m[3];
  const suffix = (m[2] ?? m[4])?.toLowerCase();
  const raw = parseFloat(numStr.replace(/,/g, ""));
  if (isNaN(raw)) return null;
  if (suffix === "k") return raw * 1_000;
  if (suffix === "m") return raw * 1_000_000;
  if (suffix === "b") return raw * 1_000_000_000;
  return raw;
}

/** Best-effort parse of a plain-English follow-up sent after a plan already exists, e.g.
 * "change target to inc sales $1.2M" or "set budget to $2M" — Mia's chat-driven plan revision.
 * Returns null when the message doesn't look like a target/budget change so the caller can fall
 * back to its generic chat reply instead. */
export function parsePlanRevision(text: string, state: BuildPlanState): PlanRevision | null {
  const lower = text.toLowerCase();
  const wantsBudget = /\bbudget\b/.test(lower);
  const targetMatch = TARGET_MATCHERS.find((m) => m.re.test(lower));
  const wantsTarget = (/\btarget\b/.test(lower) || Boolean(targetMatch)) && !wantsBudget;

  if (wantsTarget && targetMatch) {
    const amount = parseNumericAmount(lower.replace(/\btarget\b/i, ""));
    if (amount != null && amount > 0) {
      const target = targetMatch.target;
      const targetValue = target === "incremental-roas" || target === "incremental-cpo" ? amount : Math.round(amount);
      const newState: BuildPlanState = { ...state, target, targetValue };
      return { state: newState, summary: `Updated your target to ${formatTargetLabel(target, targetValue)}.` };
    }
  }

  if (wantsBudget) {
    const amount = parseCurrencyAmount(lower);
    if (amount != null && amount > 0) {
      const currentTotal = includedTotal(state);
      const scale = currentTotal > 0 ? amount / currentTotal : 0;
      const budget = { ...state.budget };
      const overridden = { ...state.overridden };
      BUILD_TACTICS.forEach((t) => {
        if (state.included[t.id] && budget[t.id] != null) {
          budget[t.id] = Math.round(budget[t.id]! * scale);
          overridden[t.id] = true;
        }
      });
      const newState: BuildPlanState = { ...state, budget, overridden };
      return { state: newState, summary: `Updated your budget to ${currencyFormatter.format(amount)}.` };
    }
  }

  return null;
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

function planKindFor(state: BuildPlanState): PlanKind {
  return state.planType === "spend" ? "optimization" : "simulation";
}

export function buildPlanToCreatePlanInput(state: BuildPlanState): CreatePlanInput {
  const included = BUILD_TACTICS.filter((t) => state.included[t.id]);
  const { label: ctLabel, attrLabels } = ctSummary(state);
  const conversionType = attrLabels.length ? formatAttrLabels(attrLabels) : ctLabel;

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
  const referencePeriod = state.method === "fetch" ? activeWindow(state).label : BUDGET_TEMPLATE_FILENAME;
  const label = periodLabel(state);

  return {
    name: `${label} plan`,
    segment: conversionType || "All Orders",
    planKind: planKindFor(state),
    planningWindow: label,
    planStart: state.planStart,
    planEnd: state.planEnd,
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
    target: state.target ?? "incremental-sales",
    targetValue: state.targetValue,
  };
}

export function downloadBudgetTemplate(): void {
  const bytes = Uint8Array.from(atob(BUDGET_TEMPLATE_BASE64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: BUDGET_TEMPLATE_MIME });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = BUDGET_TEMPLATE_FILENAME;
  a.click();
  URL.revokeObjectURL(a.href);
}
