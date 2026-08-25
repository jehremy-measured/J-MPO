import { useId, useMemo, useState } from "react";
import { addDays, daysBetweenInclusive } from "../mpo/buildPlan/dateUtils";
import { formatBudget, type PlanTarget } from "../mpo/types";
import { computeGoalProgress, GOAL_METRIC_LABEL, type GoalProgress } from "../mpo/goalProgress";
import { SparkleIcon } from "./icons/SparkleIcon";
import { useElementSize } from "../hooks/useElementSize";
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
};

/** incremental-sales/orders read as a magnitude to climb toward (0..target); incremental-roas/cpo
 * read as a threshold to clear, where the "good" side depends on metric direction. */
function primaryKindFor(target: PlanTarget): "bar" | "threshold" {
  return target === "incremental-roas" || target === "incremental-cpo" ? "threshold" : "bar";
}

/** Sales gets a 2-decimal compact figure ("$8.36M") to match the headline treatment; the other
 * metrics keep their natural formatting (plain integer orders, $X.XX ROAS/CPO). */
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

type BannerVariant = "gap" | "underspend" | "reached";

function computeBannerInfo(
  target: PlanTarget,
  targetValue: number,
  progress: GoalProgress,
  kind: "bar" | "threshold"
): { variant: BannerVariant; text: string; buttonLabel: string } {
  const targetFormatted = formatPrimaryValue(target, targetValue);
  if (progress.pct < 100) {
    return {
      variant: "gap",
      text: "Run an optimization to close the gap.",
      buttonLabel: "Optimize",
    };
  }
  if (kind === "threshold") {
    const direction = progress.isCostMetric ? "Below" : "Above";
    return {
      variant: "underspend",
      text: `${direction} target means you're underspending — add budget to capture more sales.`,
      buttonLabel: "Optimize",
    };
  }
  return {
    variant: "reached",
    text: `You've reached your ${targetFormatted} target. Run an optimization to maximize gains further.`,
    buttonLabel: "Optimize",
  };
}

type WeekPoint = {
  index: number;
  label: string;
  fullLabel: string;
  sales: number;
  budget: number;
};

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatAxisDate(d: Date): string {
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}

function formatCompactCurrency(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}K`;
  return `$${Math.round(value).toLocaleString()}`;
}

function formatFullCurrency(value: number): string {
  return `$${Math.round(value).toLocaleString()}`;
}

const NICE_STEPS = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];

/** Rounds a max value up to a "nice" number so axis gridlines land on clean increments
 * without leaving excess headroom above the highest data point. */
function niceCeiling(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = NICE_STEPS.find((s) => s >= normalized) ?? 10;
  return step * magnitude;
}

/** Synthesizes a plausible week-by-week split of the plan totals: spend paced evenly across
 * the flight, incremental sales ramping up over the first few weeks as delivery optimizes. */
function buildWeeklyProjection(
  planStart: Date,
  planEnd: Date,
  totalSales: number,
  totalBudget: number
): WeekPoint[] {
  const totalDays = Math.max(1, daysBetweenInclusive(planStart, planEnd));
  // Fold any trailing partial week into the last full week instead of plotting it as its own
  // point — a 1-2 day sliver charted at the same weight as a full week reads as a fake decline.
  const weekCount = Math.max(1, Math.floor(totalDays / 7));
  const dayLengths = Array.from({ length: weekCount }, () => 7);
  if (totalDays < 7) {
    dayLengths[0] = totalDays;
  } else {
    dayLengths[weekCount - 1] += totalDays - weekCount * 7;
  }

  const rampWeeks = Math.min(3, Math.ceil(weekCount / 3));
  const salesWeights = dayLengths.map((days, i) => Math.min(1, (i + 1) / rampWeeks) * (days / 7));
  const salesWeightSum = salesWeights.reduce((a, b) => a + b, 0) || 1;
  const dayLengthSum = dayLengths.reduce((a, b) => a + b, 0) || 1;

  return dayLengths.map((days, i) => {
    const weekStart = addDays(planStart, i * 7);
    const weekEnd = addDays(weekStart, days - 1);
    return {
      index: i,
      label: formatAxisDate(weekStart),
      fullLabel: `${formatAxisDate(weekStart)} – ${formatAxisDate(weekEnd)}`,
      sales: (salesWeights[i] / salesWeightSum) * totalSales,
      budget: (days / dayLengthSum) * totalBudget,
    };
  });
}

const MARGIN = { top: 16, right: 16, bottom: 28, left: 56 };

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
}: Props) {
  const gradientId = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [chartView, setChartView] = useState<"cumulative" | "weekly">("cumulative");
  const [chartWrapRef, { width: VB_WIDTH, height: VB_HEIGHT }] = useElementSize<HTMLDivElement>({
    width: 640,
    height: 260,
  });
  const [tooltipRef, tooltipSize] = useElementSize<HTMLDivElement>({ width: 168, height: 70 });
  const PLOT_WIDTH = Math.max(1, VB_WIDTH - MARGIN.left - MARGIN.right);
  const PLOT_HEIGHT = Math.max(1, VB_HEIGHT - MARGIN.top - MARGIN.bottom);

  const weeks = useMemo(
    () => buildWeeklyProjection(planStart, planEnd, incrementalSales, totalBudget),
    [planStart, planEnd, incrementalSales, totalBudget]
  );

  // Cumulative view runs a prefix sum over each week's own figures, so week N shows weeks
  // 1..N combined instead of just that week's slice.
  const cumulativeWeeks = useMemo(() => {
    let salesSum = 0;
    let budgetSum = 0;
    return weeks.map((w) => {
      salesSum += w.sales;
      budgetSum += w.budget;
      return { ...w, sales: salesSum, budget: budgetSum };
    });
  }, [weeks]);

  const chartWeeks = chartView === "cumulative" ? cumulativeWeeks : weeks;

  const yMax = useMemo(() => {
    const peak = Math.max(...chartWeeks.map((w) => Math.max(w.sales, w.budget)), 1);
    return niceCeiling(peak * 1.08);
  }, [chartWeeks]);

  const xFor = (i: number) => (chartWeeks.length <= 1 ? MARGIN.left + PLOT_WIDTH / 2 : MARGIN.left + (i / (chartWeeks.length - 1)) * PLOT_WIDTH);
  const yFor = (v: number) => MARGIN.top + PLOT_HEIGHT - (v / yMax) * PLOT_HEIGHT;

  // The line chart plots points edge-to-edge (xFor(0) sits exactly on the left margin), which
  // is correct for a connected line but leaves no room for a bar centered on that same point.
  // Bars use an even band per week instead, so every bar has margin on both sides.
  const bandWidth = PLOT_WIDTH / chartWeeks.length;
  const bandLeft = (i: number) => MARGIN.left + bandWidth * i;
  const bandCenter = (i: number) => bandLeft(i) + bandWidth / 2;
  const pointX = (i: number) => (chartView === "weekly" ? bandCenter(i) : xFor(i));

  const salesPath = chartWeeks.map((w, i) => `${i === 0 ? "M" : "L"}${xFor(i)},${yFor(w.sales)}`).join(" ");
  const budgetPath = chartWeeks.map((w, i) => `${i === 0 ? "M" : "L"}${xFor(i)},${yFor(w.budget)}`).join(" ");
  const areaPath = `${salesPath} L${xFor(chartWeeks.length - 1)},${MARGIN.top + PLOT_HEIGHT} L${xFor(0)},${MARGIN.top + PLOT_HEIGHT} Z`;

  const gridSteps = [0, 0.25, 0.5, 0.75, 1];
  const labelEvery = Math.max(1, Math.ceil(chartWeeks.length / 6));
  const hit = hoverIndex != null ? chartWeeks[hoverIndex] : null;

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
  const banner = hasTarget && progress ? computeBannerInfo(target as PlanTarget, targetValue as number, progress, primaryKind!) : null;

  const metricRows = [
    { key: "incremental-sales" as const, label: "Incremental Sales", value: formatPrimaryValue("incremental-sales", incrementalSales) },
    { key: "incremental-roas" as const, label: "Incremental ROAS", value: formatPrimaryValue("incremental-roas", incrementalRoas) },
  ];
  const secondaryMetricRows = hasTarget ? metricRows.filter((r) => r.key !== target) : metricRows;

  // Threshold view keeps the target tick fixed at center and places the actual-value dot
  // relative to it, so the tick is always a stable reference point regardless of magnitude.
  const targetPct = 50;
  let actualPct = 50;
  let goodZoneLeft = 0;
  let goodZoneWidth = 0;
  if (hasTarget && progress && primaryKind === "threshold") {
    const deviationScale = (targetValue as number) * 0.5 || 1;
    const offsetPct = Math.max(-50, Math.min(50, ((progress.actual - (targetValue as number)) / deviationScale) * 50));
    actualPct = 50 + offsetPct;
    goodZoneLeft = progress.isCostMetric ? 0 : targetPct;
    goodZoneWidth = 50;
  }

  return (
    <section className={styles.section}>
      <div className={styles.card}>
        <div className={styles.body}>
          <div className={styles.statsCol}>
            {hasTarget && progress && primaryKind ? (
              <>
                <h2 className={styles.colTitle}>Forecast</h2>

                <div className={styles.primaryStat}>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>{GOAL_METRIC_LABEL[target as PlanTarget]}</span>
                    <span className={styles.statValue}>{formatPrimaryValue(target as PlanTarget, progress.actual)}</span>
                  </div>
                  {primaryKind === "bar" ? (
                    <>
                      <div className={styles.barTrack}>
                        <div
                          className={styles.barFill}
                          style={{ width: `${Math.min(100, Math.max(0, progress.pct))}%` }}
                        />
                      </div>
                      <div className={styles.barFoot}>
                        <span className={styles.barPct}>{progress.pctLabel} of target</span>
                        <span className={styles.barTargetLabel}>
                          Target: {formatPrimaryValue(target as PlanTarget, targetValue as number)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={styles.sliderTrack}>
                        <div
                          className={styles.sliderGoodZone}
                          style={{ left: `${goodZoneLeft}%`, width: `${goodZoneWidth}%` }}
                        />
                        <div className={styles.sliderTick} style={{ left: `${targetPct}%` }} />
                        <div className={styles.sliderDot} style={{ left: `${actualPct}%` }} />
                      </div>
                      <div className={styles.sliderFoot}>
                        Target {formatPrimaryValue(target as PlanTarget, targetValue as number)}
                      </div>
                    </>
                  )}
                </div>

                {banner && (
                  <div className={`${styles.goalBanner} ${styles[`goalBanner_${banner.variant}`]}`}>
                    <p className={styles.goalBannerText}>
                      {banner.text}{" "}
                      <button type="button" className={styles.goalBannerLink} onClick={onOptimize}>
                        {banner.buttonLabel}
                        <SparkleIcon size={14} variant="fill" />
                      </button>
                    </p>
                  </div>
                )}

                {secondaryMetricRows.map((row) => (
                  <div className={styles.stat} key={row.key}>
                    <div className={styles.statLabel}>{row.label}</div>
                    <div className={styles.statValue}>{row.value}</div>
                  </div>
                ))}
                <div className={styles.stat}>
                  <div className={styles.statLabel}>Total budget</div>
                  <div className={styles.statValue}>{formatCompactCurrency(totalBudget)}</div>
                </div>
              </>
            ) : (
              <>
                <h2 className={styles.colTitle}>Forecast</h2>
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
          </div>

          <div className={styles.chartCol}>
            <div className={styles.chartHeader}>
              <h2 className={styles.colTitle}>Weekly Forecast</h2>
              <div className={styles.viewToggle}>
                <button
                  type="button"
                  className={chartView === "cumulative" ? styles.viewActive : ""}
                  onClick={() => setChartView("cumulative")}
                >
                  Cumulative
                </button>
                <button
                  type="button"
                  className={chartView === "weekly" ? styles.viewActive : ""}
                  onClick={() => setChartView("weekly")}
                >
                  Weekly
                </button>
              </div>
            </div>
            <div className={styles.legend}>
              <span className={styles.legendItem}>
                <span className={`${styles.swatch} ${styles.swatchSales}`} aria-hidden />
                Incremental Sales
              </span>
              <span className={styles.legendItem}>
                <span className={`${styles.swatch} ${styles.swatchBudget}`} aria-hidden />
                Budget
              </span>
            </div>
            <div className={styles.chartWrap} ref={chartWrapRef}>
              <svg
                className={styles.svg}
                viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
                role="img"
                aria-label={
                  chartView === "cumulative"
                    ? "Line chart of projected cumulative incremental sales and budget by week"
                    : "Bar chart of projected incremental sales and budget by week"
                }
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--blue-700)" stopOpacity="0.16" />
                    <stop offset="100%" stopColor="var(--blue-700)" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {gridSteps.map((step) => {
                  const y = MARGIN.top + PLOT_HEIGHT - step * PLOT_HEIGHT;
                  return (
                    <g key={step}>
                      <line
                        x1={MARGIN.left}
                        x2={VB_WIDTH - MARGIN.right}
                        y1={y}
                        y2={y}
                        className={styles.gridline}
                      />
                      <text x={MARGIN.left - 10} y={y} className={styles.yTick} textAnchor="end" dominantBaseline="middle">
                        {formatCompactCurrency(yMax * step)}
                      </text>
                    </g>
                  );
                })}

                {chartWeeks.map(
                  (w, i) =>
                    i % labelEvery === 0 && (
                      <text
                        key={w.index}
                        x={pointX(i)}
                        y={VB_HEIGHT - 8}
                        className={styles.xTick}
                        textAnchor="middle"
                      >
                        {w.label}
                      </text>
                    )
                )}

                {chartView === "cumulative" ? (
                  <>
                    <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
                    <path d={budgetPath} className={styles.budgetLine} fill="none" />
                    <path d={salesPath} className={styles.salesLine} fill="none" />

                    {hit && (
                      <line
                        x1={xFor(hit.index)}
                        x2={xFor(hit.index)}
                        y1={MARGIN.top}
                        y2={MARGIN.top + PLOT_HEIGHT}
                        className={styles.crosshair}
                      />
                    )}

                    {chartWeeks.map((w, i) => (
                      <g key={w.index}>
                        <circle cx={xFor(i)} cy={yFor(w.budget)} r={hoverIndex === i ? 5 : 3} className={styles.budgetDot} />
                        <circle cx={xFor(i)} cy={yFor(w.sales)} r={hoverIndex === i ? 5 : 3} className={styles.salesDot} />
                      </g>
                    ))}
                  </>
                ) : (
                  chartWeeks.map((w, i) => {
                    const barWidth = Math.max(2, Math.min(22, bandWidth * 0.18));
                    const gap = Math.max(2, barWidth * 0.3);
                    const center = bandCenter(i);
                    const salesX = center - barWidth - gap / 2;
                    const budgetX = center + gap / 2;
                    const baseline = MARGIN.top + PLOT_HEIGHT;
                    const salesY = yFor(w.sales);
                    const budgetY = yFor(w.budget);
                    const active = hoverIndex === i;
                    return (
                      <g key={w.index} opacity={hoverIndex == null || active ? 1 : 0.45}>
                        <rect
                          x={salesX}
                          y={salesY}
                          width={barWidth}
                          height={Math.max(0, baseline - salesY)}
                          rx={2}
                          className={styles.salesBar}
                        />
                        <rect
                          x={budgetX}
                          y={budgetY}
                          width={barWidth}
                          height={Math.max(0, baseline - budgetY)}
                          rx={2}
                          className={styles.budgetBar}
                        />
                      </g>
                    );
                  })
                )}

                {chartWeeks.map((w, i) => {
                  const left =
                    chartView === "weekly"
                      ? bandLeft(i)
                      : i === 0
                      ? MARGIN.left
                      : (xFor(i - 1) + xFor(i)) / 2;
                  const right =
                    chartView === "weekly"
                      ? bandLeft(i) + bandWidth
                      : i === chartWeeks.length - 1
                      ? VB_WIDTH - MARGIN.right
                      : (xFor(i) + xFor(i + 1)) / 2;
                  return (
                    <rect
                      key={w.index}
                      x={left}
                      y={MARGIN.top}
                      width={Math.max(1, right - left)}
                      height={PLOT_HEIGHT}
                      fill="transparent"
                      tabIndex={0}
                      role="button"
                      aria-label={`${w.fullLabel}: incremental sales ${formatFullCurrency(w.sales)}, budget ${formatFullCurrency(w.budget)}`}
                      onMouseEnter={() => setHoverIndex(i)}
                      onFocus={() => setHoverIndex(i)}
                      onMouseLeave={() => setHoverIndex(null)}
                      onBlur={() => setHoverIndex(null)}
                    />
                  );
                })}
              </svg>

              {hit && (
                <div
                  ref={tooltipRef}
                  className={styles.tooltip}
                  style={{
                    left: Math.min(
                      Math.max(pointX(hit.index), tooltipSize.width / 2),
                      VB_WIDTH - tooltipSize.width / 2
                    ),
                  }}
                >
                  <div className={styles.tooltipLabel}>
                    {chartView === "cumulative" ? `Through ${hit.fullLabel.split(" – ")[1] ?? hit.fullLabel}` : hit.fullLabel}
                  </div>
                  <div className={styles.tooltipRow}>
                    <span className={`${styles.swatch} ${styles.swatchSales}`} aria-hidden />
                    {chartView === "cumulative" ? "Cumulative Sales" : "Incremental Sales"}{" "}
                    <strong>{formatFullCurrency(hit.sales)}</strong>
                  </div>
                  <div className={styles.tooltipRow}>
                    <span className={`${styles.swatch} ${styles.swatchBudget}`} aria-hidden />
                    {chartView === "cumulative" ? "Cumulative Budget" : "Budget"}{" "}
                    <strong>{formatFullCurrency(hit.budget)}</strong>
                  </div>
                </div>
              )}
            </div>

            <table className={styles.srOnly}>
              <caption>
                {chartView === "cumulative"
                  ? "Projected cumulative incremental sales and budget by week"
                  : "Projected incremental sales and budget by week"}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Week</th>
                  <th scope="col">Incremental sales</th>
                  <th scope="col">Budget</th>
                </tr>
              </thead>
              <tbody>
                {chartWeeks.map((w) => (
                  <tr key={w.index}>
                    <td>{w.fullLabel}</td>
                    <td>{formatFullCurrency(w.sales)}</td>
                    <td>{formatFullCurrency(w.budget)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
