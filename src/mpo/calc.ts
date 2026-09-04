import { AVERAGE_ORDER_VALUE } from "./types";
import type { OptimizationMode, Tactic } from "./types";

const TARGET_MIN = 500_000;
const TARGET_MAX = 3_000_000;

export function clampTargetBudget(value: number): number {
  return Math.min(TARGET_MAX, Math.max(TARGET_MIN, value));
}

export function tacticAdjustment(tactic: Tactic): number {
  return tactic.budgetNew - tactic.budgetOld;
}

export function tacticSalesNew(tactic: Tactic, mode: OptimizationMode): number {
  const lift =
    mode === "maximized" ? 1.08 : 1;
  const delta = tactic.budgetNew - tactic.budgetOld;
  return Math.round(tactic.salesOld + delta * tactic.marginalRoas * lift);
}

export function tacticRoasNew(tactic: Tactic, mode: OptimizationMode): number {
  if (tactic.budgetNew <= 0) return 0;
  return tacticSalesNew(tactic, mode) / tactic.budgetNew;
}

export function tacticRoasOld(tactic: Tactic): number {
  if (tactic.budgetOld <= 0) return 0;
  return tactic.salesOld / tactic.budgetOld;
}

export function totalBudget(tactics: Tactic[]): number {
  return tactics.reduce((sum, t) => sum + t.budgetNew, 0);
}

export function totalSales(tactics: Tactic[], mode: OptimizationMode): number {
  return tactics.reduce((sum, t) => sum + tacticSalesNew(t, mode), 0);
}

export function blendedRoas(tactics: Tactic[], mode: OptimizationMode): number {
  const budget = totalBudget(tactics);
  if (budget <= 0) return 0;
  return totalSales(tactics, mode) / budget;
}

/** Order count derived from total sales via the shared average-order-value assumption. */
export function totalOrders(tactics: Tactic[], mode: OptimizationMode): number {
  return Math.round(totalSales(tactics, mode) / AVERAGE_ORDER_VALUE);
}

export function blendedCpo(tactics: Tactic[], mode: OptimizationMode): number {
  const orders = totalOrders(tactics, mode);
  if (orders <= 0) return 0;
  return totalBudget(tactics) / orders;
}

export function adjustmentFillPercent(tactic: Tactic): number {
  const max = Math.max(
    ...[tactic.budgetOld, tactic.budgetNew, 1].map((v) => Math.abs(v))
  );
  return Math.min(100, (Math.abs(tacticAdjustment(tactic)) / max) * 100);
}

export function applyTargetBudget(
  tactics: Tactic[],
  targetBudget: number
): Tactic[] {
  const unlocked = tactics.filter((t) => !t.locked);
  const lockedTotal = tactics
    .filter((t) => t.locked)
    .reduce((sum, t) => sum + t.budgetNew, 0);
  const unlockedTotal = unlocked.reduce((sum, t) => sum + t.budgetNew, 0);
  const distributable = Math.max(0, targetBudget - lockedTotal);

  if (unlocked.length === 0 || unlockedTotal <= 0) {
    return tactics;
  }

  const scale = distributable / unlockedTotal;

  return tactics.map((tactic) => {
    if (tactic.locked) return tactic;
    return {
      ...tactic,
      budgetNew: Math.round(tactic.budgetNew * scale),
    };
  });
}

export function setTacticAdjustment(
  tactic: Tactic,
  adjustment: number
): Tactic {
  if (tactic.locked) return tactic;
  return {
    ...tactic,
    budgetNew: Math.max(0, Math.round(tactic.budgetOld + adjustment)),
  };
}
