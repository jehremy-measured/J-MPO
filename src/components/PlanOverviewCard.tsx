import { useId, useMemo, useState } from "react";
import { addDays, daysBetweenInclusive } from "../mpo/buildPlan/dateUtils";
import { formatBudget } from "../mpo/types";
import styles from "./PlanOverviewCard.module.css";

type Props = {
  planStart: Date;
  planEnd: Date;
  totalBudget: number;
  incrementalSales: number;
  incrementalRoas: number;
};

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
  const weekCount = Math.max(1, Math.ceil(totalDays / 7));
  const dayLengths = Array.from({ length: weekCount }, (_, i) => Math.min(7, totalDays - i * 7));

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

const VB_WIDTH = 520;
const VB_HEIGHT = 200;
const MARGIN = { top: 20, right: 16, bottom: 32, left: 60 };
const PLOT_WIDTH = VB_WIDTH - MARGIN.left - MARGIN.right;
const PLOT_HEIGHT = VB_HEIGHT - MARGIN.top - MARGIN.bottom;

export function PlanOverviewCard({
  planStart,
  planEnd,
  totalBudget,
  incrementalSales,
  incrementalRoas,
}: Props) {
  const gradientId = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const weeks = useMemo(
    () => buildWeeklyProjection(planStart, planEnd, incrementalSales, totalBudget),
    [planStart, planEnd, incrementalSales, totalBudget]
  );

  const yMax = useMemo(() => {
    const peak = Math.max(...weeks.map((w) => Math.max(w.sales, w.budget)), 1);
    return niceCeiling(peak * 1.08);
  }, [weeks]);

  const xFor = (i: number) => (weeks.length <= 1 ? MARGIN.left + PLOT_WIDTH / 2 : MARGIN.left + (i / (weeks.length - 1)) * PLOT_WIDTH);
  const yFor = (v: number) => MARGIN.top + PLOT_HEIGHT - (v / yMax) * PLOT_HEIGHT;

  const salesPath = weeks.map((w, i) => `${i === 0 ? "M" : "L"}${xFor(i)},${yFor(w.sales)}`).join(" ");
  const budgetPath = weeks.map((w, i) => `${i === 0 ? "M" : "L"}${xFor(i)},${yFor(w.budget)}`).join(" ");
  const areaPath = `${salesPath} L${xFor(weeks.length - 1)},${MARGIN.top + PLOT_HEIGHT} L${xFor(0)},${MARGIN.top + PLOT_HEIGHT} Z`;

  const gridSteps = [0, 0.25, 0.5, 0.75, 1];
  const labelEvery = Math.max(1, Math.ceil(weeks.length / 6));
  const hit = hoverIndex != null ? weeks[hoverIndex] : null;

  return (
    <section className={styles.section}>
      <div className={styles.card}>
        <div className={styles.body}>
          <div className={styles.statsCol}>
            <h2 className={styles.colTitle}>Goals</h2>
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
          </div>

          <div className={styles.chartCol}>
            <h2 className={`${styles.colTitle} ${styles.chartTitle}`}>Forecast</h2>
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
            <div className={styles.chartWrap}>
              <svg
                className={styles.svg}
                viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
                role="img"
                aria-label="Line chart of projected incremental sales and budget by week"
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

                {weeks.map(
                  (w, i) =>
                    i % labelEvery === 0 && (
                      <text
                        key={w.index}
                        x={xFor(i)}
                        y={VB_HEIGHT - 8}
                        className={styles.xTick}
                        textAnchor="middle"
                      >
                        {w.label}
                      </text>
                    )
                )}

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

                {weeks.map((w, i) => (
                  <g key={w.index}>
                    <circle cx={xFor(i)} cy={yFor(w.budget)} r={hoverIndex === i ? 5 : 3} className={styles.budgetDot} />
                    <circle cx={xFor(i)} cy={yFor(w.sales)} r={hoverIndex === i ? 5 : 3} className={styles.salesDot} />
                  </g>
                ))}

                {weeks.map((w, i) => {
                  const left = i === 0 ? MARGIN.left : (xFor(i - 1) + xFor(i)) / 2;
                  const right = i === weeks.length - 1 ? VB_WIDTH - MARGIN.right : (xFor(i) + xFor(i + 1)) / 2;
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
                  className={styles.tooltip}
                  style={{ left: `${(xFor(hit.index) / VB_WIDTH) * 100}%` }}
                >
                  <div className={styles.tooltipLabel}>{hit.fullLabel}</div>
                  <div className={styles.tooltipRow}>
                    <span className={`${styles.swatch} ${styles.swatchSales}`} aria-hidden />
                    Incremental Sales <strong>{formatFullCurrency(hit.sales)}</strong>
                  </div>
                  <div className={styles.tooltipRow}>
                    <span className={`${styles.swatch} ${styles.swatchBudget}`} aria-hidden />
                    Budget <strong>{formatFullCurrency(hit.budget)}</strong>
                  </div>
                </div>
              )}
            </div>

            <table className={styles.srOnly}>
              <caption>Projected incremental sales and budget by week</caption>
              <thead>
                <tr>
                  <th scope="col">Week</th>
                  <th scope="col">Incremental sales</th>
                  <th scope="col">Budget</th>
                </tr>
              </thead>
              <tbody>
                {weeks.map((w) => (
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
