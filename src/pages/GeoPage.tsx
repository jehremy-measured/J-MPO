import { useMemo, useState } from "react";
import { HeroBanner } from "../components/HeroBanner";
import { MiaPanel, type MiaConfig } from "../components/MiaSidePanel";
import { MiaGeoTestFlow } from "../components/mia-geo-flow/MiaGeoTestFlow";
import { PrototypeBar } from "../components/PrototypeBar";
import { TopNavigation, type AppRoute } from "../components/TopNavigation";
import {
  FILTER_STATUS,
  GEO_FILTERS,
  PROTOTYPE_TODAY,
  geoTests,
  optimalTestCellSize,
  testCells,
  type GeoFilter,
  type GeoTest,
  type GeoTestStatus,
} from "../geo/data";
import { designToGeoTest } from "../geo/designFlow";
import { GEO_MIA_PROMPTS, geoMiaReply, shouldStartGeoDesignFlow } from "../geo/mia";
import styles from "./GeoPage.module.css";
import mpoStyles from "./MpoPage.module.css";

type Props = {
  onNavigate: (route: AppRoute) => void;
};

/** Experiment → Geo Tests list, styled to match the MPO prototype */
export function GeoPage({ onNavigate }: Props) {
  const [filter, setFilter] = useState<GeoFilter>("All");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [tests, setTests] = useState<GeoTest[]>(geoTests);
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const [miaOpen, setMiaOpen] = useState(false);
  const [startFlowSignal, setStartFlowSignal] = useState(0);

  const openDesignFlow = () => {
    setMiaOpen(true);
    setStartFlowSignal((n) => n + 1);
  };

  const miaConfig: MiaConfig = {
    welcomeSubtext: "Ask about your geo tests, or let me design the next one with you.",
    prompts: GEO_MIA_PROMPTS,
    shouldStartFlow: shouldStartGeoDesignFlow,
    flowIntro: "Let's design a geo test — a few quick questions and I'll size it for you.",
    flowCancelled: 'Test design cancelled. Say "Design a new geo test" anytime to start again.',
    cancelLabel: "Cancel design",
    reply: (text) => geoMiaReply(text, tests),
    renderFlow: ({ finish }) => (
      <MiaGeoTestFlow
        onCreate={(design) => {
          const id = Math.max(...tests.map((t) => t.id)) + 1;
          setTests((prev) => [designToGeoTest(design, id), ...prev]);
          setHighlightId(id);
          setFilter("All");
          setQuery("");
          setMessage(`Draft test created (ID ${id})`);
        }}
        onViewTests={() =>
          finish({
            closePanel: true,
            message: "Your draft is in the Geo Tests list. Open it any time to pick markets and launch.",
          })
        }
      />
    ),
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tests.filter((test) => {
      if (filter !== "All" && test.status !== FILTER_STATUS[filter]) return false;
      if (!q) return true;
      return test.name.toLowerCase().includes(q) || String(test.id).includes(q);
    });
  }, [filter, query, tests]);

  const countFor = (f: GeoFilter) =>
    f === "All" ? tests.length : tests.filter((t) => t.status === FILTER_STATUS[f]).length;

  return (
    <div className={mpoStyles.page}>
      <TopNavigation
        activeRoute="geo"
        onNavigate={onNavigate}
        miaOpen={miaOpen}
        onMiaToggle={() => setMiaOpen((open) => !open)}
      />
      <div className={mpoStyles.body}>
        <div className={mpoStyles.contentCol}>
          <main className={mpoStyles.main}>
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>Geo Tests</h1>
              <div className={styles.headerActions}>
                <a href="#" className={styles.backLink} onClick={(e) => e.preventDefault()}>
                  <BackIcon />
                  Back to the old version
                </a>
                <button type="button" className={styles.outlineBtn}>
                  Learn more
                </button>
              </div>
            </div>

            <HeroBanner
              title="Create a New Test"
              subtitle="Find your media's true performance with Geo Designer."
              primaryLabel="Get started"
              linkLabel="Watch tutorial"
              onCreatePlan={openDesignFlow}
            />

            <div className={styles.body}>
              <div className={styles.kpis}>
                <div className={styles.kpiCard}>
                  <span className={styles.kpiValue}>
                    {testCells.available} / {testCells.total}
                  </span>
                  <span className={styles.kpiLabel}>Test Cells Available</span>
                </div>
                <div className={styles.kpiCard}>
                  <span className={styles.kpiValue}>{optimalTestCellSize.toFixed(2)}%</span>
                  <span className={styles.kpiLabel}>Optimal Test Cell Size</span>
                </div>
              </div>

              <section className={styles.card} aria-label="Geo tests">
                <div className={styles.toolbar}>
                  <div className={styles.segmented} role="tablist" aria-label="Filter by status">
                    {GEO_FILTERS.map((f) => (
                      <button
                        key={f}
                        type="button"
                        role="tab"
                        aria-selected={filter === f}
                        className={filter === f ? `${styles.segment} ${styles.segmentActive}` : styles.segment}
                        onClick={() => setFilter(f)}
                      >
                        {f}
                        <span className={styles.segmentCount}>{countFor(f)}</span>
                      </button>
                    ))}
                  </div>
                  <label className={styles.search}>
                    <input
                      type="search"
                      placeholder="Search tests"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      aria-label="Search tests"
                    />
                    <SearchIcon />
                  </label>
                </div>

                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Test Name</th>
                        <th>Contribution</th>
                        <th>Conversion Type</th>
                        <th>Type</th>
                        <th>Implementation</th>
                        <th>Test Dates</th>
                        <th>Status</th>
                        <th className={styles.detailCol}>Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((test) => (
                        <GeoTestRow
                          key={test.id}
                          test={test}
                          highlighted={test.id === highlightId}
                          onOpen={() => setMessage(`Opening results for "${test.name}" (ID ${test.id})`)}
                        />
                      ))}
                      {rows.length === 0 && (
                        <tr>
                          <td colSpan={8} className={styles.empty}>
                            No tests match{query ? ` "${query}"` : ""} in {filter}.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </main>
          <footer className={mpoStyles.footer}>
            <span>© 2020-2024 Measured All Rights Reserved</span>
            <span className={mpoStyles.footerDivider} aria-hidden />
            <a href="#">Privacy Policy</a>
          </footer>
        </div>
        <MiaPanel
          open={miaOpen}
          onClose={() => setMiaOpen(false)}
          config={miaConfig}
          startFlowSignal={startFlowSignal}
        />
      </div>
      <PrototypeBar message={message} onDismiss={() => setMessage(null)} />
    </div>
  );
}

function GeoTestRow({
  test,
  highlighted,
  onOpen,
}: {
  test: GeoTest;
  highlighted: boolean;
  onOpen: () => void;
}) {
  return (
    <tr className={highlighted ? `${styles.row} ${styles.rowNew}` : styles.row} onClick={onOpen}>
      <td>
        <div className={styles.nameCell}>
          <div className={styles.stack}>
            <a
              href="#"
              className={styles.testName}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpen();
              }}
            >
              {test.name}
            </a>
            <span className={styles.testId}>ID {test.id}</span>
          </div>
          {test.multiCell && (
            <span className={styles.layers} title="Multi-cell test">
              <LayersIcon />
            </span>
          )}
        </div>
      </td>
      <td className={styles.contribution}>
        {test.contribution === null ? (
          <span className={styles.muted}>—</span>
        ) : (
          `${test.contribution.toFixed(2)}%`
        )}
      </td>
      <td>{test.conversionType}</td>
      <td>
        <span className={styles.iconLabel}>
          {test.type === "Holdout" ? <HoldoutIcon /> : <ScaleIcon />}
          {test.type}
        </span>
      </td>
      <td>
        <span className={styles.iconLabel}>
          {test.implementation === "Manual" ? <HandIcon /> : <BoltIcon />}
          {test.implementation}
        </span>
      </td>
      <td>
        <TestDates start={test.start} end={test.end} status={test.status} />
      </td>
      <td>
        <StatusPill status={test.status} />
      </td>
      <td className={styles.detailCol}>
        <span className={styles.chevron} aria-hidden>
          <ChevronRight />
        </span>
      </td>
    </tr>
  );
}

function parseDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatRange(start: string, end: string) {
  const s = parseDate(start);
  const e = parseDate(end);
  const md = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const sameYear = s.getFullYear() === e.getFullYear();
  return `${md(s)}${sameYear ? "" : `, ${s.getFullYear()}`} - ${md(e)}, ${e.getFullYear()}`;
}

function progressFor(start: string, end: string, status: GeoTestStatus) {
  if (status === "Complete") return 1;
  if (status === "Draft" || status === "Scheduled") return 0;
  const s = parseDate(start).getTime();
  const e = parseDate(end).getTime();
  const now = parseDate(PROTOTYPE_TODAY).getTime();
  return Math.min(1, Math.max(0, (now - s) / (e - s)));
}

function TestDates({ start, end, status }: { start: string; end: string; status: GeoTestStatus }) {
  const pct = Math.round(progressFor(start, end, status) * 100);
  return (
    <div className={styles.dates}>
      <span>{formatRange(start, end)}</span>
      <span
        className={styles.progressTrack}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Test progress"
      >
        <span className={styles.progressFill} style={{ width: `${pct}%` }} />
      </span>
    </div>
  );
}

const STATUS_CLASS: Record<GeoTestStatus, string> = {
  Draft: styles.pillDraft,
  Scheduled: styles.pillScheduled,
  "In Progress": styles.pillProgress,
  Complete: styles.pillComplete,
};

function StatusPill({ status }: { status: GeoTestStatus }) {
  return <span className={`${styles.pill} ${STATUS_CLASS[status]}`}>{status}</span>;
}

/* ---------- icons ---------- */

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function BackIcon() {
  return (
    <svg {...iconProps}>
      <path d="M9 14L4 9l5-5" />
      <path d="M4 9h11a5 5 0 0 1 5 5v0a5 5 0 0 1-5 5h-3" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.2-4.2" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg {...iconProps} width={20} height={20}>
      <path d="M12 3l9 5-9 5-9-5 9-5z" />
      <path d="M3 12.5l9 5 9-5" />
      <path d="M3 16.5l9 5 9-5" />
    </svg>
  );
}

function HoldoutIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.6 5.6l12.8 12.8" />
    </svg>
  );
}

function ScaleIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 19l6-6 4 4 6-8" />
      <path d="M15 9h5v5" />
    </svg>
  );
}

function HandIcon() {
  return (
    <svg {...iconProps}>
      <path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12" />
      <path d="M11 11V4.5a1.5 1.5 0 0 1 3 0V12" />
      <path d="M14 11.5V6a1.5 1.5 0 0 1 3 0v8" />
      <path d="M17 10a1.5 1.5 0 0 1 3 0v4a7 7 0 0 1-7 7h-1a6 6 0 0 1-5-2.7L4.3 15a1.5 1.5 0 0 1 2.5-1.7L8 15" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg {...iconProps}>
      <path d="M13 3L5 13.5h6L10 21l8-10.5h-6L13 3z" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg {...iconProps} width={20} height={20} strokeWidth={2}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
