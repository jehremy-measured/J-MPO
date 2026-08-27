import { formatBudget, type PlanTarget } from "../mpo/types";
import { computeGoalProgress, GOAL_METRIC_LABEL } from "../mpo/goalProgress";
import { SparkleIcon } from "./icons/SparkleIcon";
import { WeeklyProjectionChart, formatFullCurrency, formatVolumeFull } from "./WeeklyProjectionChart";
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
  // Sales pairs with ROAS, orders pairs with CPO — the chart's plotted volume metric (and the
  // Forecast column's secondary metric row) follows whichever pair the target belongs to.
  const isOrdersFamily = target === "incremental-orders" || target === "incremental-cpo";
  const volumeMetric = isOrdersFamily ? incrementalOrders : incrementalSales;
  const volumeNoun = isOrdersFamily ? "Orders" : "Sales";

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
                  <span className={styles.invisibleSpacerBtn} aria-hidden="true" />
                </div>

                {secondaryMetricRows.map((row) => (
                  <div className={styles.stat} key={row.key}>
                    <div className={styles.statLabel}>{row.label}</div>
                    <div className={styles.statValue}>{row.value}</div>
                  </div>
                ))}

                <div className={styles.primaryStat}>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>{GOAL_METRIC_LABEL[target as PlanTarget]}</span>
                    <span className={styles.statValue}>{formatPrimaryDisplayValue(target as PlanTarget, progress.actual)}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className={styles.statsHeader}>
                  <h2 className={styles.colTitle}>Plan Summary</h2>
                  <span className={styles.invisibleSpacerBtn} aria-hidden="true" />
                </div>
                <div className={styles.stat}>
                  <div className={styles.statLabel}>Total budget</div>
                  <div className={styles.statValue}>{formatBudget(totalBudget)}</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statLabel}>Incremental Sales</div>
                  <div className={styles.statValue}>{formatBudget(incrementalSales)}</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statLabel}>Incremental ROAS</div>
                  <div className={styles.statValue}>${incrementalRoas.toFixed(2)}</div>
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
