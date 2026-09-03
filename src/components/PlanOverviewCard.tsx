import { useMemo } from "react";
import { isAfter, isBefore } from "../mpo/buildPlan/dateUtils";
import { formatBudget, type PlanTarget } from "../mpo/types";
import { computeGoalProgress, GOAL_METRIC_LABEL } from "../mpo/goalProgress";
import { SparkleIcon } from "./icons/SparkleIcon";
import {
  WeeklyProjectionChart,
  buildActualWeeks,
  buildProjectedToDateWeeks,
  buildWeeklyProjection,
  formatFullCurrency,
  formatVolumeFull,
} from "./WeeklyProjectionChart";
import styles from "./PlanOverviewCard.module.css";

type Props = {
  planStart: Date;
  planEnd: Date;
  totalBudget: number;
  incrementalSales: number;
  incrementalRoas: number;
  /** When set along with a positive targetValue, the stats column promotes this metric to a
   * headline progress/threshold visualization and shows a goal-status banner beneath it. */
  target?: PlanTarget | null;
  targetValue?: number | null;
  incrementalOrders?: number;
  cpo?: number;
  onOptimize?: () => void;
  /** Forces the chart's Actual overlay off, even for an in-flight plan — e.g. right after
   * creating a plan, before it's had any real time to accrue actuals against. */
  allowActual?: boolean;
};

/** incremental-sales/orders read as a magnitude to climb toward (0..target); incremental-roas/cpo
 * read as a threshold to clear, where the "good" side depends on metric direction. */
function primaryKindFor(target: PlanTarget): "bar" | "threshold" {
  return target === "incremental-roas" || target === "incremental-cpo" ? "threshold" : "bar";
}

/** Compact sales figures ("$1.14M") for contexts that need a short form; the other metrics
 * keep their natural formatting (plain integer orders, $X.XX ROAS/CPO). */
function formatPrimaryValue(target: PlanTarget, value: number): string {
  if (target !== "incremental-sales") {
    if (target === "incremental-orders") return Math.round(value).toLocaleString();
    return `$${value.toFixed(2)}`;
  }
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(abs >= 10_000 ? 0 : 1).replace(/\.?0+$/, "")}K`;
  return `$${Math.round(value).toLocaleString()}`;
}

/** Headline stat values always show the full number, unabbreviated. */
function formatPrimaryDisplayValue(target: PlanTarget, value: number): string {
  if (target === "incremental-sales") return `$${Math.round(value).toLocaleString()}`;
  return formatPrimaryValue(target, value);
}

/** Static demo assumption: how much incremental volume running an optimization could
 * plausibly recover on top of a simulation, since this prototype has no real optimizer to
 * project an actual figure from. */
const OPTIMIZATION_UPLIFT_PCT = 0.15;

type MetricDiff = { label: string; good: boolean };

/** Aggregate actual-to-date vs. expected-to-date totals for the two series the chart tracks
 * (the plotted volume metric and spend), used to diff every stat row against actuals. */
type PacingTotals = { volume: number; budget: number };

/** actual-vs-projected-to-date diff for one stat row, formatted as a signed percent. Budget and
 * CPO are cost metrics (coming in under the expected pace is favorable); the rest read as a
 * magnitude to climb toward, so beating the expected pace is favorable. */
function computeMetricDiff(
  key: "total-budget" | PlanTarget,
  actual: PacingTotals,
  projected: PacingTotals
): MetricDiff | null {
  let actualValue: number;
  let projectedValue: number;
  let higherIsBetter: boolean;
  switch (key) {
    case "total-budget":
      actualValue = actual.budget;
      projectedValue = projected.budget;
      higherIsBetter = false;
      break;
    case "incremental-sales":
    case "incremental-orders":
      actualValue = actual.volume;
      projectedValue = projected.volume;
      higherIsBetter = true;
      break;
    case "incremental-roas":
      actualValue = actual.budget > 0 ? actual.volume / actual.budget : 0;
      projectedValue = projected.budget > 0 ? projected.volume / projected.budget : 0;
      higherIsBetter = true;
      break;
    case "incremental-cpo":
      actualValue = actual.volume > 0 ? actual.budget / actual.volume : 0;
      projectedValue = projected.volume > 0 ? projected.budget / projected.volume : 0;
      higherIsBetter = false;
      break;
    default:
      return null;
  }
  if (!(projectedValue > 0)) return null;
  const pct = ((actualValue - projectedValue) / projectedValue) * 100;
  const sign = pct >= 0 ? "+" : "";
  const good = higherIsBetter ? pct >= 0 : pct <= 0;
  return { label: `${sign}${pct.toFixed(1)}%`, good };
}

function MetricDiffTag({ diff }: { diff: MetricDiff | null }) {
  if (!diff) return null;
  return (
    <span className={`${styles.statDiff} ${diff.good ? styles.statDiffUp : styles.statDiffDown}`}>
      {diff.label}
    </span>
  );
}

export function PlanOverviewCard({
  planStart,
  planEnd,
  totalBudget,
  incrementalSales,
  incrementalRoas,
  target,
  targetValue,
  incrementalOrders = 0,
  cpo = 0,
  onOptimize,
  allowActual = true,
}: Props) {
  // Actuals only exist once the plan is in-flight (mirrors WeeklyProjectionChart's own
  // gating) — comparison is shown automatically whenever there's real data to compare against.
  const today = new Date();
  const actualsAvailable = allowActual && !isBefore(today, planStart) && !isAfter(today, planEnd);

  // Sales pairs with ROAS, orders pairs with CPO — the chart's plotted volume metric (and the
  // Forecast column's secondary metric row) follows whichever pair the target belongs to.
  const isOrdersFamily = target === "incremental-orders" || target === "incremental-cpo";
  const volumeMetric = isOrdersFamily ? incrementalOrders : incrementalSales;
  const volumeNoun = isOrdersFamily ? "Orders" : "Sales";

  // Actual-to-date vs. expected-to-date totals, used to diff every stat row against actuals —
  // built from the same weekly pacing model the chart itself plots, so the figures agree.
  const weeks = useMemo(
    () => buildWeeklyProjection(planStart, planEnd, volumeMetric, totalBudget),
    [planStart, planEnd, volumeMetric, totalBudget]
  );
  const actualTotals = useMemo<PacingTotals>(() => {
    if (!actualsAvailable) return { volume: 0, budget: 0 };
    const actualWeeks = buildActualWeeks(weeks, today);
    return actualWeeks.reduce(
      (acc, w) => ({ volume: acc.volume + w.sales, budget: acc.budget + w.budget }),
      { volume: 0, budget: 0 }
    );
  }, [actualsAvailable, weeks, today]);
  const projectedToDateTotals = useMemo<PacingTotals>(() => {
    if (!actualsAvailable) return { volume: 0, budget: 0 };
    const projectedWeeks = buildProjectedToDateWeeks(weeks, today);
    return projectedWeeks.reduce(
      (acc, w) => ({ volume: acc.volume + w.sales, budget: acc.budget + w.budget }),
      { volume: 0, budget: 0 }
    );
  }, [actualsAvailable, weeks, today]);
  const diffFor = (key: "total-budget" | PlanTarget): MetricDiff | null =>
    actualsAvailable ? computeMetricDiff(key, actualTotals, projectedToDateTotals) : null;

  const hasTarget = target != null && targetValue != null && targetValue > 0;
  const progress = hasTarget
    ? computeGoalProgress(target as PlanTarget, targetValue as number, {
        incrementalSales,
        roas: incrementalRoas,
        incrementalOrders,
        cpo,
      })
    : null;
  const primaryKind = hasTarget ? primaryKindFor(target as PlanTarget) : null;

  const optimizeGainAmount = volumeMetric * OPTIMIZATION_UPLIFT_PCT;
  const optimizeGainLabel = `${formatVolumeFull(optimizeGainAmount, isOrdersFamily)} (${Math.round(
    OPTIMIZATION_UPLIFT_PCT * 100
  )}%)`;

  // Sales and ROAS are shown together; orders and CPO are shown together — whichever pair
  // the selected target belongs to. The target itself becomes the primary (highlighted) row
  // below, so only its family partner needs to appear here.
  const rawValueFor: Record<PlanTarget, number> = {
    "incremental-sales": incrementalSales,
    "incremental-roas": incrementalRoas,
    "incremental-orders": incrementalOrders,
    "incremental-cpo": cpo,
  };
  const family: PlanTarget[] = isOrdersFamily
    ? ["incremental-orders", "incremental-cpo"]
    : ["incremental-sales", "incremental-roas"];
  const metricRows = [
    { key: "total-budget" as const, label: "Total budget", value: formatFullCurrency(totalBudget) },
    ...family.map((key) => ({
      key,
      label: GOAL_METRIC_LABEL[key],
      value: formatPrimaryDisplayValue(key, rawValueFor[key]),
    })),
  ];
  const secondaryMetricRows = hasTarget ? metricRows.filter((r) => r.key !== target) : metricRows;

  return (
    <section className={styles.section}>
      <div className={styles.card}>
        <div className={styles.body}>
          <div className={styles.statsCol}>
            {hasTarget && progress && primaryKind ? (
              <>
                <div className={styles.statsHeader}>
                  <h2 className={styles.colTitle}>Plan Summary</h2>
                  {actualsAvailable && <span className={styles.actualsTag}>Compared to actuals</span>}
                </div>

                {secondaryMetricRows.map((row) => (
                  <div className={styles.stat} key={row.key}>
                    <div className={styles.statLabel}>{row.label}</div>
                    <div className={styles.statValueCol}>
                      <div className={styles.statValue}>{row.value}</div>
                      <MetricDiffTag diff={diffFor(row.key)} />
                    </div>
                  </div>
                ))}

                <div className={styles.primaryStat}>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>{GOAL_METRIC_LABEL[target as PlanTarget]}</span>
                    <div className={styles.statValueCol}>
                      <span className={styles.statValue}>
                        {formatPrimaryDisplayValue(target as PlanTarget, progress.actual)}
                      </span>
                      <MetricDiffTag diff={diffFor(target as PlanTarget)} />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className={styles.statsHeader}>
                  <h2 className={styles.colTitle}>Plan Summary</h2>
                  {actualsAvailable && <span className={styles.actualsTag}>Compared to actuals</span>}
                </div>
                <div className={styles.stat}>
                  <div className={styles.statLabel}>Total budget</div>
                  <div className={styles.statValueCol}>
                    <div className={styles.statValue}>{formatBudget(totalBudget)}</div>
                    <MetricDiffTag diff={diffFor("total-budget")} />
                  </div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statLabel}>Incremental Sales</div>
                  <div className={styles.statValueCol}>
                    <div className={styles.statValue}>{formatBudget(incrementalSales)}</div>
                    <MetricDiffTag diff={diffFor("incremental-sales")} />
                  </div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statLabel}>Incremental ROAS</div>
                  <div className={styles.statValueCol}>
                    <div className={styles.statValue}>${incrementalRoas.toFixed(2)}</div>
                    <MetricDiffTag diff={diffFor("incremental-roas")} />
                  </div>
                </div>
              </>
            )}

            <div className={styles.optimizeBanner}>
              <p className={styles.optimizeBannerText}>
                You could potentially <strong className={styles.optimizeBannerGain}>gain {optimizeGainLabel}</strong>{" "}
                in incremental {volumeNoun.toLowerCase()} by optimizing this plan.
              </p>
              <button type="button" className={styles.optimizeBannerBtn} onClick={onOptimize}>
                <SparkleIcon size={18} variant="fill" />
                Optimize
              </button>
            </div>
          </div>

          <WeeklyProjectionChart
            planStart={planStart}
            planEnd={planEnd}
            totalBudget={totalBudget}
            volumeMetric={volumeMetric}
            volumeNoun={volumeNoun}
            isOrdersFamily={isOrdersFamily}
            allowActual={allowActual}
          />
        </div>
      </div>
    </section>
  );
}
