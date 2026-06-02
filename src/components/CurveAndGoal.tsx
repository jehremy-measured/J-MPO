import { assets } from "../assets/figma";
import styles from "./CurveAndGoal.module.css";

type SliderRow = {
  label: string;
  value: string;
  fillPercent: number;
  fillColor: string;
  marker?: boolean;
};

const sliders: SliderRow[] = [
  {
    label: "Target Budget",
    value: "$1,500,000",
    fillPercent: 68,
    fillColor: "var(--green-600)",
    marker: true,
  },
  {
    label: "Incremental Sales",
    value: "$155,444,694",
    fillPercent: 100,
    fillColor: "var(--green-800)",
  },
  {
    label: "Incremental ROAS",
    value: "$4.55",
    fillPercent: 37,
    fillColor: "var(--green-500)",
  },
];

const yLeft = ["$300K", "$200K", "$100K", "$250K"];
const yRight = ["$5.00", "$2.50", "$1.00", "$0"];
const xAxis = ["$0", "$500K", "$1M", "$1.5M", "$2M", "$2.5M", "$3M"];

export function CurveAndGoal() {
  return (
    <section className={styles.section} data-node-id="1:34014">
      <div className={styles.card}>
        <header className={styles.toolbar}>
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
            <ToolbarDivider />
            <button type="button" className={styles.settingsLink}>
              ✎ Plan settings
            </button>
          </div>
          <div className={styles.toggle}>
            <span className={styles.toggleActive}>ROAS</span>
            <button type="button">CPO</button>
          </div>
        </header>

        <div className={styles.body}>
          <aside className={styles.goals}>
            <div className={styles.goalsHeader}>
              <h2>Goal Adjustments</h2>
              <button type="button" className={styles.resetLink}>
                Reset
              </button>
            </div>

            <div className={styles.modeRow}>
              <div className={styles.toggle}>
                <span className={styles.toggleActive}>Balanced</span>
                <button type="button">Maximized</button>
              </div>
              <span className={styles.rowLabel}>Optimization Mode</span>
            </div>

            {sliders.map((slider) => (
              <div key={slider.label} className={styles.sliderRow}>
                <div className={styles.sliderBlock}>
                  <div className={styles.sliderTrack}>
                    <div
                      className={styles.sliderFill}
                      style={{
                        width: `${slider.fillPercent}%`,
                        background: slider.fillColor,
                      }}
                    />
                    <span className={styles.sliderKnob} />
                  </div>
                  <span className={styles.sliderValue}>{slider.value}</span>
                  {slider.marker && <span className={styles.sliderMarker}>▼</span>}
                </div>
                <span className={styles.rowLabel}>{slider.label}</span>
              </div>
            ))}
          </aside>

          <div className={styles.chart}>
            <h2>Diminishing Return Curve</h2>
            <div className={styles.legend}>
              <LegendItem src={assets.legendSales} label="Incremental Sales" />
              <LegendItem src={assets.legendRoas} label="Incremental ROAS" />
              <LegendItem src={assets.legendTarget} label="Target Budget" dashed />
              <LegendItem src={assets.legendRef} label="Reference Spend" dashed />
            </div>

            <div className={styles.chartArea}>
              <span className={styles.yLabelLeft}>Incremental Sales</span>
              <div className={styles.plot}>
                <div className={styles.yTicksLeft}>
                  {yLeft.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
                <div className={styles.graphWrap}>
                  <img src={assets.graphSales} alt="" className={styles.graphLine} />
                  <img src={assets.graphRoas} alt="" className={styles.graphLineRoas} />
                  <img src={assets.refLine} alt="" className={styles.refLine} />
                  <img src={assets.targetLine} alt="" className={styles.targetLine} />
                </div>
                <div className={styles.yTicksRight}>
                  {yRight.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
              </div>
              <div className={styles.xAxis}>
                {xAxis.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
              <span className={styles.xLabel}>Media Spend</span>
              <span className={styles.yLabelRight}>Incremental ROAS</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ToolbarDivider() {
  return <span className={styles.divider} aria-hidden />;
}

function LegendItem({
  src,
  label,
  dashed,
}: {
  src: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <span className={styles.legendItem}>
      <img src={src} alt="" className={dashed ? styles.legendDash : styles.legendLine} />
      {label}
    </span>
  );
}
