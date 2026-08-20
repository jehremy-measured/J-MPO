export type OptimizationMode = "balanced" | "maximized";
export type MetricMode = "roas" | "cpo";
export type BudgetView = "segments" | "channels" | "tactics";
export type PlanGoalType =
  | "total-sales"
  | "incremental-sales"
  | "incremental-roas"
  | "target-budget";

/** What the user said they're aiming for when building a plan — drives the
 * post-creation "how does this compare to your target" banner and which
 * output metrics (sales/ROAS vs. orders/CPO) the budget table shows. */
export type PlanTarget = "incremental-sales" | "incremental-orders" | "incremental-roas" | "incremental-cpo";

export type Tactic = {
  id: string;
  name: string;
  channel: string;
  logo: string;
  budgetOld: number;
  budgetNew: number;
  locked: boolean;
  salesOld: number;
  marginalRoas: number;
};

export type PlanKind = "optimization" | "simulation";

export type Plan = {
  id: string;
  label: string;
  kind: PlanKind;
  createdBy: string;
  lastEdited: Date;
  target: PlanTarget;
  planStart: Date;
  planEnd: Date;
};

export type PlanSnapshot = {
  tactics: Tactic[];
  baseline: Tactic[];
  targetBudget: number;
  optimizationMode: OptimizationMode;
  metricMode: MetricMode;
  segment: string;
  planningWindow: string;
  referencePeriod: string;
  goalType: PlanGoalType;
  totalSalesGoal: number;
  baselineSalesForecast: number;
  pacingEnabled: boolean;
  conversionType: string;
  channelCount: number;
};

export type CreatePlanInput = {
  name: string;
  segment: string;
  planKind: PlanKind;
  planningWindow: string;
  planStart: Date;
  planEnd: Date;
  referencePeriod: string;
  targetBudget: number;
  optimizationMode: OptimizationMode;
  metricMode: MetricMode;
  goalType: PlanGoalType;
  totalSalesGoal: number;
  baselineSalesForecast: number;
  pacingEnabled: boolean;
  conversionType: string;
  channelCount: number;
  tactics: Tactic[];
  target: PlanTarget;
  targetValue: number | null;
};

export function goalTypeLabel(type: PlanGoalType): string {
  const labels: Record<PlanGoalType, string> = {
    "total-sales": "Total sales",
    "incremental-sales": "Incremental sales",
    "incremental-roas": "Incremental ROAS",
    "target-budget": "Target budget",
  };
  return labels[type];
}

export function formatBudget(amount: number): string {
  return `$${Math.round(amount).toLocaleString()}`;
}

/** Assumed average order value, used to derive an order count and CPO from sales/spend
 * figures wherever no direct order-count data exists. */
export const AVERAGE_ORDER_VALUE = 150;
