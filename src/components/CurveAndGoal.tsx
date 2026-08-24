import { useId, useState, type CSSProperties } from "react";
import { EditIcon } from "./icons/BuildPlanIcons";
import styles from "./CurveAndGoal.module.css";

type Goal = {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  color: string;
  format: (v: number) => string;
  markerPercent?: number;
};

const GOALS: Goal[] = [
  {
    key: "budget",
    label: "Target Budget",
    min: 0,
    max: 3_000_000,
    step: 10_000,
    color: "var(--green-600)",
    format: (v) => `$${Math.round(v).toLocaleString()}`,
    markerPercent: 68,
  },
  {
    key: "sales",
    label: "Incremental Sales",
    min: 0,
    max: 250_000_000,
    step: 500_000,
    color: "var(--green-800)",
    format: (v) => `$${Math.round(v).toLocaleString()}`,
  },
  {
    key: "roas",
    label: "Incremental ROAS",
    min: 0,
    max: 10,
    step: 0.05,
    color: "var(--green-500)",
    format: (v) => `$${v.toFixed(2)}`,
  },
];

const DEFAULT_VALUES: Record<string, number> = {
  budget: 1_500_000,
  sales: 155_444_694,
  roas: 4.55,
};

// Lulus baseline plan: projected incremental sales and ROAS across the media spend range.
// Both curves saturate as spend increases, which is the "diminishing return" story this chart tells.
const SPEND_DOMAIN_MAX = 3_000_000;
const SPEND_POINTS = [0, 500_000, 1_000_000, 1_500_000, 2_000_000, 2_500_000, 3_000_000];
const MAX_SALES = 280_000;
const SALES_SCALE = 900_000;
const START_ROAS = 5.0;
const FLOOR_ROAS = 0.6;
const ROAS_SCALE = 700_000;
const REFERENCE_SPEND = 1_000_000;

function projectedSales(spend: number): number {
  return MAX_SALES * (1 - Math.exp(-spend / SALES_SCALE));
}

function projectedRoas(spend: number): number {
  return FLOOR_ROAS + (START_ROAS - FLOOR_ROAS) * Math.exp(-spend / ROAS_SCALE);
}

function formatSpendLabel(value: number): string {
  if (value === 0) return "$0";
  if (value < 1_000_000) return `$${value / 1_000}K`;
  return `$${value / 1_000_000}M`;
}

function formatSalesTick(value: number): string {
  if (value === 0) return "$0";
  return `$${Math.round(value / 1000)}K`;
}

const LEFT_AXIS_MAX = 300_000;
const RIGHT_AXIS_MAX = 5;
const GRID_STEPS = [0, 0.25, 0.5, 0.75, 1];

const VB_WIDTH = 560;
const VB_HEIGHT = 230;
const MARGIN = { top: 16, right: 72, bottom: 40, left: 72 };
const PLOT_WIDTH = VB_WIDTH - MARGIN.left - MARGIN.right;
const PLOT_HEIGHT = VB_HEIGHT - MARGIN.top - MARGIN.bottom;
const PLOT_BOTTOM = MARGIN.top + PLOT_HEIGHT;
const PLOT_CENTER_Y = MARGIN.top + PLOT_HEIGHT / 2;

const LEGEND = [
  { label: "Incremental Sales", color: "var(--blue-700)" },
  { label: "Incremental ROAS", color: "var(--green-700)" },
  { label: "Target Budget", color: "var(--green-600)" },
  { label: "Reference Spend", color: "var(--gray-500)" },
];

export function CurveAndGoal() {
  const [values, setValues] = useState(DEFAULT_VALUES);
  const gradientId = useId();

  const xFor = (spend: number) => MARGIN.left + (spend / SPEND_DOMAIN_MAX) * PLOT_WIDTH;
  const yForSales = (v: number) => PLOT_BOTTOM - (v / LEFT_AXIS_MAX) * PLOT_HEIGHT;
  const yForRoas = (v: number) => PLOT_BOTTOM - (v / RIGHT_AXIS_MAX) * PLOT_HEIGHT;

  const salesPath = SPEND_POINTS.map(
    (s, i) => `${i === 0 ? "M" : "L"}${xFor(s)},${yForSales(projectedSales(s))}`
  ).join(" ");
  const roasPath = SPEND_POINTS.map(
    (s, i) => `${i === 0 ? "M" : "L"}${xFor(s)},${yForRoas(projectedRoas(s))}`
  ).join(" ");
  const areaPath = `${salesPath} L${xFor(SPEND_DOMAIN_MAX)},${PLOT_BOTTOM} L${xFor(0)},${PLOT_BOTTOM} Z`;

  return (
    <section className={styles.section} data-node-id="1:34014">
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.highlight}>US Online Orders +2</span>
          <ToolbarDivider />
          <span className={styles.meta}>
            Planning for <strong>Rolling 30 days</strong>
          </span>
          <ToolbarDivider />
          <span className={styles.meta}>
            Including <strong>All tactics</strong>
          </span>
        </div>
        <button type="button" className={styles.settingsLink}>
          <EditIcon size={18} /> Plan settings
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.body}>
          <aside className={styles.goals}>
            <div className={styles.goalsHeader}>
              <h2>Goal Adjustments</h2>
              <button type="button" className={styles.resetLink} onClick={() => setValues(DEFAULT_VALUES)}>
                Reset
              </button>
            </div>

            {GOALS.map((goal) => {
              const value = values[goal.key];
              const percent = ((value - goal.min) / (goal.max - goal.min)) * 100;
              const sliderStyle = {
                "--fill-color": goal.color,
                "--fill-percent": `${percent}%`,
              } as CSSProperties;
              return (
                <div key={goal.key} className={styles.goalRow}>
                  <div className={styles.goalRowHead}>
                    <span className={styles.rowLabel}>{goal.label}</span>
                    <span className={styles.sliderValue}>{goal.format(value)}</span>
                  </div>
                  <div className={styles.sliderWrap}>
                    {goal.markerPercent != null && (
                      <span className={styles.sliderMarker} style={{ left: `${goal.markerPercent}%` }} aria-hidden />
                    )}
                    <input
                      type="range"
                      className={styles.sliderInput}
                      min={goal.min}
                      max={goal.max}
                      step={goal.step}
                      value={value}
                      style={sliderStyle}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, [goal.key]: Number(e.target.value) }))
                      }
                      aria-label={goal.label}
                    />
                  </div>
                </div>
              );
            })}
          </aside>

          <div className={styles.chart}>
            <h2>Diminishing Return Curve</h2>
            <div className={styles.legend}>
              {LEGEND.map((item) => (
                <span key={item.label} className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: item.color }} aria-hidden />
                  {item.label}
                </span>
              ))}
            </div>

            <svg
              className={styles.svg}
              viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
              role="img"
              aria-label="Diminishing return curve of incremental sales and incremental ROAS by media spend"
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--blue-700)" stopOpacity="0.14" />
                  <stop offset="100%" stopColor="var(--blue-700)" stopOpacity="0" />
                </linearGradient>
              </defs>

              {GRID_STEPS.map((step) => {
                const y = PLOT_BOTTOM - step * PLOT_HEIGHT;
                return (
                  <g key={step}>
                    <line x1={MARGIN.left} x2={VB_WIDTH - MARGIN.right} y1={y} y2={y} className={styles.gridline} />
                    <text x={MARGIN.left - 10} y={y} className={styles.yTick} textAnchor="end" dominantBaseline="middle">
                      {formatSalesTick(LEFT_AXIS_MAX * step)}
                    </text>
                    <text
                      x={VB_WIDTH - MARGIN.right + 10}
                      y={y}
                      className={styles.yTick}
                      textAnchor="start"
                      dominantBaseline="middle"
                    >
                      ${(RIGHT_AXIS_MAX * step).toFixed(2)}
                    </text>
                  </g>
                );
              })}

              {SPEND_POINTS.map((s) => (
                <text key={s} x={xFor(s)} y={PLOT_BOTTOM + 16} className={styles.xTick} textAnchor="middle">
                  {formatSpendLabel(s)}
                </text>
              ))}

              <line
                x1={xFor(REFERENCE_SPEND)}
                x2={xFor(REFERENCE_SPEND)}
                y1={MARGIN.top}
                y2={PLOT_BOTTOM}
                className={styles.refLine}
              />
              <line
                x1={xFor(values.budget)}
                x2={xFor(values.budget)}
                y1={MARGIN.top}
                y2={PLOT_BOTTOM}
                className={styles.targetLine}
              />

              <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
              <path d={roasPath} className={styles.roasLine} fill="none" />
              <path d={salesPath} className={styles.salesLine} fill="none" />

              {SPEND_POINTS.map((s) => (
                <circle key={`s-${s}`} cx={xFor(s)} cy={yForSales(projectedSales(s))} r="3" className={styles.salesDot} />
              ))}
              {SPEND_POINTS.map((s) => (
                <circle key={`r-${s}`} cx={xFor(s)} cy={yForRoas(projectedRoas(s))} r="3" className={styles.roasDot} />
              ))}

              <text
                x={14}
                y={PLOT_CENTER_Y}
                className={styles.axisTitle}
                textAnchor="middle"
                transform={`rotate(-90, 14, ${PLOT_CENTER_Y})`}
              >
                Incremental Sales
              </text>
              <text
                x={VB_WIDTH - 14}
                y={PLOT_CENTER_Y}
                className={styles.axisTitle}
                textAnchor="middle"
                transform={`rotate(-90, ${VB_WIDTH - 14}, ${PLOT_CENTER_Y})`}
              >
                Incremental ROAS
              </text>
              <text x={MARGIN.left + PLOT_WIDTH / 2} y={VB_HEIGHT - 4} className={styles.axisTitleX} textAnchor="middle">
                Media Spend
              </text>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}

function ToolbarDivider() {
  return <span className={styles.divider} aria-hidden />;
}
