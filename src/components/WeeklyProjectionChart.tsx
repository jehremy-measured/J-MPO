import { useId, useMemo, useState } from "react";
import { addDays, daysBetweenInclusive, isAfter, isBefore } from "../mpo/buildPlan/dateUtils";
import { useElementSize } from "../hooks/useElementSize";
import styles from "./PlanOverviewCard.module.css";

type Props = {
  planStart: Date;
  planEnd: Date;
  totalBudget: number;
  volumeMetric: number;
  volumeNoun: string;
  isOrdersFamily: boolean;
  title?: string;
  /** Hides the title + view toggle row, for callers that render their own toggle elsewhere
   * (e.g. in a popup header) and drive the view via chartView/onChartViewChange instead. */
  hideHeader?: boolean;
  chartView?: "cumulative" | "weekly";
  onChartViewChange?: (view: "cumulative" | "weekly") => void;
  /** Drops the chart wrap's side and bottom padding, for hosts (like a popup) that already
   * provide their own outer padding around the whole chart. */
  noSidePadding?: boolean;
  /** By default the Actual overlay auto-shows for in-flight plans (today falls within
   * planStart..planEnd). Pass false to force it off — e.g. right after creating a plan, before
   * it's had any real time to accrue actuals against. */
  allowActual?: boolean;
  /** Lets a caller with its own "Compare with actuals" toggle control whether the Actual
   * series render, on top of the allowActual/in-flight gating above. Defaults to true so
   * callers without such a toggle keep the previous always-on-when-available behavior. */
  showActuals?: boolean;
};

type WeekPoint = {
  index: number;
  label: string;
  fullLabel: string;
  sales: number;
  budget: number;
  start: Date;
  days: number;
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

export function formatFullCurrency(value: number): string {
  return `$${Math.round(value).toLocaleString()}`;
}

/** The chart's y-axis is shared between budget (always $) and the plotted volume metric,
 * which is a plain count instead of currency when that metric is orders. */
function formatAxisTick(value: number, isOrdersFamily: boolean): string {
  return isOrdersFamily ? Math.round(value).toLocaleString() : formatCompactCurrency(value);
}

export function formatVolumeFull(value: number, isOrdersFamily: boolean): string {
  return isOrdersFamily ? Math.round(value).toLocaleString() : formatFullCurrency(value);
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
export function buildWeeklyProjection(
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
      start: weekStart,
      days,
    };
  });
}

/** Runs a prefix sum over each week's own figures, so week N shows weeks 1..N combined
 * instead of just that week's slice. */
export function toCumulativeWeeks(weeks: WeekPoint[]): WeekPoint[] {
  let salesSum = 0;
  let budgetSum = 0;
  return weeks.map((w) => {
    salesSum += w.sales;
    budgetSum += w.budget;
    return { ...w, sales: salesSum, budget: budgetSum };
  });
}

/** Deterministic per-week variance so the actual-vs-projected line looks organic without
 * jittering on every re-render. Sales and spend use different sequences so the two actual
 * lines don't move in lockstep. */
const ACTUAL_VARIANCE = [0.93, 1.07, 0.98, 1.11, 0.9, 1.05, 1.02, 0.96, 1.09, 0.94, 1.03, 0.99, 1.06];
const ACTUAL_SPEND_VARIANCE = [1.04, 0.97, 1.08, 0.95, 1.02, 0.91, 1.06, 1.0, 0.93, 1.07, 0.99, 1.03, 0.96];

/** Synthesizes "actual" weekly sales and spend trends for demo purposes: weeks that have fully
 * elapsed get a plausible variance on the projected figure, the in-progress week (if any) is
 * prorated by how much of it has elapsed, and weeks that haven't started yet are dropped
 * entirely so the actual lines stop at today instead of running ahead of it. */
export function buildActualWeeks(weeks: WeekPoint[], today: Date): WeekPoint[] {
  const result: WeekPoint[] = [];
  for (const w of weeks) {
    if (isBefore(today, w.start)) break;
    const elapsedDays = Math.min(w.days, daysBetweenInclusive(w.start, today));
    const fraction = elapsedDays / w.days;
    const salesVariance = ACTUAL_VARIANCE[w.index % ACTUAL_VARIANCE.length];
    const spendVariance = ACTUAL_SPEND_VARIANCE[w.index % ACTUAL_SPEND_VARIANCE.length];
    result.push({ ...w, sales: w.sales * salesVariance * fraction, budget: w.budget * spendVariance * fraction });
  }
  return result;
}

const MARGIN_BASE = { top: 16, right: 16, bottom: 28, left: 56 };

function formatRoasTick(value: number): string {
  return `$${Math.round(value)}`;
}

export function formatRoasFull(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function WeeklyProjectionChart({
  planStart,
  planEnd,
  totalBudget,
  volumeMetric,
  volumeNoun,
  isOrdersFamily,
  title = "Projections over time",
  hideHeader = false,
  chartView: controlledChartView,
  onChartViewChange,
  noSidePadding = false,
  allowActual = true,
  showActuals = true,
}: Props) {
  const gradientId = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [uncontrolledChartView, setUncontrolledChartView] = useState<"cumulative" | "weekly">("weekly");
  const chartView = controlledChartView ?? uncontrolledChartView;
  const setChartView = onChartViewChange ?? setUncontrolledChartView;
  // The weekly view overlays an Incremental ROAS trendline with its own right-side axis, which
  // needs a bit more margin than the cumulative view's plain two-series chart.
  const MARGIN = { ...MARGIN_BASE, right: chartView === "weekly" ? 44 : MARGIN_BASE.right };
  const [chartWrapRef, { width: VB_WIDTH, height: VB_HEIGHT }] = useElementSize<HTMLDivElement>({
    width: 640,
    height: 260,
  });
  const [tooltipRef, tooltipSize] = useElementSize<HTMLDivElement>({ width: 168, height: 70 });
  const PLOT_WIDTH = Math.max(1, VB_WIDTH - MARGIN.left - MARGIN.right);
  const PLOT_HEIGHT = Math.max(1, VB_HEIGHT - MARGIN.top - MARGIN.bottom);

  const weeks = useMemo(
    () => buildWeeklyProjection(planStart, planEnd, volumeMetric, totalBudget),
    [planStart, planEnd, volumeMetric, totalBudget]
  );

  const cumulativeWeeks = useMemo(() => toCumulativeWeeks(weeks), [weeks]);

  const chartWeeks = chartView === "cumulative" ? cumulativeWeeks : weeks;

  // In-flight plans (today falls within the plan's own date range) get an Actual overlay;
  // plans that haven't started yet, or already ended before today, don't.
  const today = useMemo(() => new Date(), []);
  const isInFlight = allowActual && !isBefore(today, planStart) && !isAfter(today, planEnd);
  const actualWeeks = useMemo(
    () => (isInFlight ? buildActualWeeks(weeks, today) : []),
    [isInFlight, weeks, today]
  );
  const cumulativeActualWeeks = useMemo(() => toCumulativeWeeks(actualWeeks), [actualWeeks]);
  const chartActualWeeks = chartView === "cumulative" ? cumulativeActualWeeks : actualWeeks;
  const showActual = actualWeeks.length > 0 && showActuals;
  const actualByIndex = useMemo(() => new Map(chartActualWeeks.map((w) => [w.index, w])), [chartActualWeeks]);

  const yMax = useMemo(() => {
    const peak = Math.max(
      ...chartWeeks.map((w) => Math.max(w.sales, w.budget)),
      ...chartActualWeeks.map((w) => Math.max(w.sales, w.budget)),
      1
    );
    return niceCeiling(peak * 1.08);
  }, [chartWeeks, chartActualWeeks]);

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
  const actualPath = chartActualWeeks.map((w, i) => `${i === 0 ? "M" : "L"}${xFor(w.index)},${yFor(w.sales)}`).join(" ");
  const actualSpendPath = chartActualWeeks.map((w, i) => `${i === 0 ? "M" : "L"}${xFor(w.index)},${yFor(w.budget)}`).join(" ");

  // Incremental ROAS trendline — weekly view only. Plotted on its own right-side axis since
  // ROAS (a small multiplier) and the $ sales/budget series live on wildly different scales.
  const roasFor = (w: WeekPoint) => (w.budget > 0 ? w.sales / w.budget : 0);
  const roasMax = useMemo(
    () => niceCeiling(Math.max(...weeks.map(roasFor), ...actualWeeks.map(roasFor), 1) * 1.15),
    [weeks, actualWeeks]
  );
  const yForRoas = (v: number) => MARGIN.top + PLOT_HEIGHT - (v / roasMax) * PLOT_HEIGHT;
  const roasPath = weeks.map((w, i) => `${i === 0 ? "M" : "L"}${bandCenter(i)},${yForRoas(roasFor(w))}`).join(" ");
  const actualRoasPath = actualWeeks
    .map((w, i) => `${i === 0 ? "M" : "L"}${bandCenter(w.index)},${yForRoas(roasFor(w))}`)
    .join(" ");

  const gridSteps = [0, 0.25, 0.5, 0.75, 1];
  const labelEvery = Math.max(1, Math.ceil(chartWeeks.length / 6));
  const hit = hoverIndex != null ? chartWeeks[hoverIndex] : null;
  const hitActual = hoverIndex != null ? actualByIndex.get(hoverIndex) : undefined;

  return (
    <div className={styles.chartCol}>
      {!hideHeader && (
        <div className={styles.chartHeader}>
          <h2 className={styles.colTitle}>{title}</h2>
          <div className={styles.viewToggle}>
            <button
              type="button"
              className={chartView === "weekly" ? styles.viewActive : ""}
              onClick={() => setChartView("weekly")}
            >
              Weekly
            </button>
            <button
              type="button"
              className={chartView === "cumulative" ? styles.viewActive : ""}
              onClick={() => setChartView("cumulative")}
            >
              Cumulative
            </button>
          </div>
        </div>
      )}
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={`${styles.swatch} ${styles.swatchSales}`} aria-hidden />
          Projected Incremental {volumeNoun}
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.swatch} ${styles.swatchBudget}`} aria-hidden />
          Planned Budget
        </span>
        {chartView === "weekly" && (
          <span className={styles.legendItem}>
            <span className={`${styles.swatch} ${styles.swatchRoas}`} aria-hidden />
            Incremental ROAS
          </span>
        )}
        {showActual && (
          <>
            <span className={styles.legendItem}>
              <span className={`${styles.swatch} ${styles.swatchActual}`} aria-hidden />
              Actual Incremental {volumeNoun}
            </span>
            <span className={styles.legendItem}>
              <span className={`${styles.swatch} ${styles.swatchActualSpend}`} aria-hidden />
              Actual Spend
            </span>
            {chartView === "weekly" && (
              <span className={styles.legendItem}>
                <span className={`${styles.swatch} ${styles.swatchActualRoas}`} aria-hidden />
                Actual ROAS
              </span>
            )}
          </>
        )}
      </div>
      <div
        className={`${styles.chartWrap} ${noSidePadding ? styles.chartWrapTight : ""}`}
        ref={chartWrapRef}
      >
        <svg
          className={styles.svg}
          viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
          role="img"
          aria-label={
            chartView === "cumulative"
              ? `Line chart of projected cumulative incremental ${volumeNoun.toLowerCase()} and budget by week`
              : `Bar chart of projected incremental ${volumeNoun.toLowerCase()}, budget, and incremental ROAS by week`
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
                  {formatAxisTick(yMax * step, isOrdersFamily)}
                </text>
                {chartView === "weekly" && (
                  <text
                    x={VB_WIDTH - MARGIN.right + 10}
                    y={y}
                    className={styles.yTick}
                    textAnchor="start"
                    dominantBaseline="middle"
                  >
                    {formatRoasTick(roasMax * step)}
                  </text>
                )}
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
              {showActual && <path d={actualPath} className={styles.actualLine} fill="none" />}
              {showActual && <path d={actualSpendPath} className={styles.actualSpendLine} fill="none" />}

              {hit && (
                <line
                  x1={xFor(hit.index)}
                  x2={xFor(hit.index)}
                  y1={MARGIN.top}
                  y2={MARGIN.top + PLOT_HEIGHT}
                  className={styles.crosshair}
                />
              )}

              {hit && (
                <g>
                  <circle cx={xFor(hit.index)} cy={yFor(hit.budget)} r={5} className={styles.budgetDot} />
                  <circle cx={xFor(hit.index)} cy={yFor(hit.sales)} r={5} className={styles.salesDot} />
                </g>
              )}

              {showActual && hitActual && (
                <circle
                  cx={xFor(hitActual.index)}
                  cy={yFor(hitActual.sales)}
                  r={5}
                  className={styles.actualDot}
                />
              )}

              {showActual && hitActual && (
                <circle
                  cx={xFor(hitActual.index)}
                  cy={yFor(hitActual.budget)}
                  r={5}
                  className={styles.actualSpendDot}
                />
              )}
            </>
          ) : (
            <>
            {chartWeeks.map((w, i) => {
              const actualForWeek = showActual ? actualByIndex.get(w.index) : undefined;
              const barCount = showActual ? 4 : 2;
              const barWidth = Math.max(2, Math.min(barCount === 4 ? 13 : 22, bandWidth * (barCount === 4 ? 0.1 : 0.18)));
              const gap = Math.max(2, barWidth * 0.3);
              const center = bandCenter(i);
              const groupWidth = barWidth * barCount + gap * (barCount - 1);
              const groupStart = center - groupWidth / 2;
              const salesX = groupStart;
              const budgetX = groupStart + barWidth + gap;
              const actualX = groupStart + (barWidth + gap) * 2;
              const actualSpendX = groupStart + (barWidth + gap) * 3;
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
                  {actualForWeek && (
                    <rect
                      x={actualX}
                      y={yFor(actualForWeek.sales)}
                      width={barWidth}
                      height={Math.max(0, baseline - yFor(actualForWeek.sales))}
                      rx={2}
                      className={styles.actualBar}
                    />
                  )}
                  {actualForWeek && (
                    <rect
                      x={actualSpendX}
                      y={yFor(actualForWeek.budget)}
                      width={barWidth}
                      height={Math.max(0, baseline - yFor(actualForWeek.budget))}
                      rx={2}
                      className={styles.actualSpendBar}
                    />
                  )}
                </g>
              );
            })}
            <path d={roasPath} className={styles.roasLine} fill="none" />
            {hit && (
              <circle cx={bandCenter(hoverIndex!)} cy={yForRoas(roasFor(hit))} r={5} className={styles.roasDot} />
            )}
            {showActual && <path d={actualRoasPath} className={styles.actualRoasLine} fill="none" />}
            {showActual && hitActual && (
              <circle
                cx={bandCenter(hitActual.index)}
                cy={yForRoas(roasFor(hitActual))}
                r={5}
                className={styles.actualRoasDot}
              />
            )}
            </>
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
            const actualForWeek = actualByIndex.get(w.index);
            const actualLabel = actualForWeek
              ? `, actual ${formatVolumeFull(actualForWeek.sales, isOrdersFamily)}, actual spend ${formatFullCurrency(actualForWeek.budget)}`
              : "";
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
                aria-label={`${w.fullLabel}: incremental ${volumeNoun.toLowerCase()} ${formatVolumeFull(w.sales, isOrdersFamily)}, budget ${formatFullCurrency(w.budget)}${actualLabel}`}
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
              <span className={styles.tooltipRowLabel}>
                {chartView === "cumulative" ? `Projected cumulative ${volumeNoun}` : `Projected Incremental ${volumeNoun}`}
              </span>
              <strong>{formatVolumeFull(hit.sales, isOrdersFamily)}</strong>
            </div>
            <div className={styles.tooltipRow}>
              <span className={`${styles.swatch} ${styles.swatchBudget}`} aria-hidden />
              <span className={styles.tooltipRowLabel}>
                {chartView === "cumulative" ? "Planned cumulative budget" : "Planned Budget"}
              </span>
              <strong>{formatFullCurrency(hit.budget)}</strong>
            </div>
            {chartView === "weekly" && (
              <div className={styles.tooltipRow}>
                <span className={`${styles.swatch} ${styles.swatchRoas}`} aria-hidden />
                <span className={styles.tooltipRowLabel}>Incremental ROAS</span>
                <strong>{formatRoasFull(roasFor(hit))}</strong>
              </div>
            )}
            {hitActual && (
              <div className={styles.tooltipRow}>
                <span className={`${styles.swatch} ${styles.swatchActual}`} aria-hidden />
                <span className={styles.tooltipRowLabel}>
                  {chartView === "cumulative" ? `Actual cumulative ${volumeNoun}` : `Actual Incremental ${volumeNoun}`}
                </span>
                <strong>{formatVolumeFull(hitActual.sales, isOrdersFamily)}</strong>
              </div>
            )}
            {hitActual && (
              <div className={styles.tooltipRow}>
                <span className={`${styles.swatch} ${styles.swatchActualSpend}`} aria-hidden />
                <span className={styles.tooltipRowLabel}>
                  {chartView === "cumulative" ? "Actual cumulative spend" : "Actual Spend"}
                </span>
                <strong>{formatFullCurrency(hitActual.budget)}</strong>
              </div>
            )}
            {chartView === "weekly" && hitActual && (
              <div className={styles.tooltipRow}>
                <span className={`${styles.swatch} ${styles.swatchActualRoas}`} aria-hidden />
                <span className={styles.tooltipRowLabel}>Actual ROAS</span>
                <strong>{formatRoasFull(roasFor(hitActual))}</strong>
              </div>
            )}
          </div>
        )}
      </div>

      <table className={styles.srOnly}>
        <caption>
          {chartView === "cumulative"
            ? `Projected cumulative incremental ${volumeNoun.toLowerCase()} and budget by week`
            : `Projected incremental ${volumeNoun.toLowerCase()} and budget by week`}
        </caption>
        <thead>
          <tr>
            <th scope="col">Week</th>
            <th scope="col">Projected incremental {volumeNoun.toLowerCase()}</th>
            <th scope="col">Planned budget</th>
            {chartView === "weekly" && <th scope="col">Incremental ROAS</th>}
            {showActual && <th scope="col">Actual incremental {volumeNoun.toLowerCase()}</th>}
            {showActual && <th scope="col">Actual spend</th>}
            {chartView === "weekly" && showActual && <th scope="col">Actual ROAS</th>}
          </tr>
        </thead>
        <tbody>
          {chartWeeks.map((w) => (
            <tr key={w.index}>
              <td>{w.fullLabel}</td>
              <td>{formatVolumeFull(w.sales, isOrdersFamily)}</td>
              <td>{formatFullCurrency(w.budget)}</td>
              {chartView === "weekly" && <td>{formatRoasFull(roasFor(w))}</td>}
              {showActual && (
                <td>{actualByIndex.has(w.index) ? formatVolumeFull(actualByIndex.get(w.index)!.sales, isOrdersFamily) : "—"}</td>
              )}
              {showActual && (
                <td>{actualByIndex.has(w.index) ? formatFullCurrency(actualByIndex.get(w.index)!.budget) : "—"}</td>
              )}
              {chartView === "weekly" && showActual && (
                <td>{actualByIndex.has(w.index) ? formatRoasFull(roasFor(actualByIndex.get(w.index)!)) : "—"}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
