import { useState, type ReactNode } from "react";
import {
  CELL_SIZE_OPTIONS,
  DESIGN_KPIS,
  DESIGN_TACTICS,
  DURATION_OPTIONS,
  RECOMMENDED_WEEKS,
  endDate,
  estimateMde,
  formatDate,
  initialDesign,
  marketCount,
  revenueAtRisk,
  tacticFor,
  testName,
  upcomingStartDates,
  type GeoDesign,
  type GeoDesignStep,
} from "../../geo/designFlow";
import { optimalTestCellSize } from "../../geo/data";
import { CheckRingIcon, InfoIcon } from "../icons/BuildPlanIcons";
import { SparkleIcon } from "../icons/SparkleIcon";
import base from "../mia-build-flow/MiaBuildPlanFlow.module.css";
import styles from "./MiaGeoTestFlow.module.css";

type Props = {
  onCreate: (design: GeoDesign) => void;
  onViewTests: () => void;
};

type HistoryEntry = { step: GeoDesignStep; question: string; answer: string };

const ORDER: GeoDesignStep[] = ["tactic", "type", "kpi", "timing", "cell", "review", "done"];

function MiaTurn({ children }: { children: ReactNode }) {
  return (
    <div className={base.turn}>
      <header className={base.turnHead}>
        <SparkleIcon size={14} />
        <span>Mia</span>
      </header>
      {children}
    </div>
  );
}

function Exchange({ question, answer }: { question: string; answer: string }) {
  return (
    <div className={base.exchange}>
      <div className={base.bubbleMia}>
        <span className={base.bubbleAvatar} aria-hidden>
          <SparkleIcon size={11} />
        </span>
        <p>{question}</p>
      </div>
      <div className={base.bubbleUser}>
        <p>{answer}</p>
      </div>
    </div>
  );
}

function Actions({ onBack, children }: { onBack?: () => void; children?: ReactNode }) {
  return (
    <div className={base.turnActions}>
      {onBack ? (
        <button type="button" className={base.backLink} onClick={onBack}>
          Back
        </button>
      ) : (
        <span />
      )}
      {children}
    </div>
  );
}

function Recommended() {
  return <span className={styles.recBadge}>Recommended</span>;
}

/** Guided "design a geo test" conversation shown inside the Mia panel */
export function MiaGeoTestFlow({ onCreate, onViewTests }: Props) {
  const [design, setDesign] = useState<GeoDesign>(initialDesign);
  const [step, setStep] = useState<GeoDesignStep>("tactic");
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const update = (patch: Partial<GeoDesign>) => setDesign((d) => ({ ...d, ...patch }));

  const commit = (question: string, answer: string) => {
    setHistory((h) => [...h, { step, question, answer }]);
    setStep(ORDER[ORDER.indexOf(step) + 1]);
  };

  const goBack = () => {
    const last = history[history.length - 1];
    if (!last) return;
    setHistory((h) => h.slice(0, -1));
    setStep(last.step);
  };

  const tactic = tacticFor(design);
  const mde = estimateMde(design.cellSize, design.weeks);
  const startDates = upcomingStartDates();

  return (
    <>
      {history.map((entry) => (
        <Exchange key={entry.step} question={entry.question} answer={entry.answer} />
      ))}

      {step === "tactic" && (
        <MiaTurn>
          <p className={base.q}>Which tactic do you want to test?</p>
          <p className={base.qDesc}>I've flagged when each was last measured with a geo test.</p>
          <div className={base.turnContent}>
            {DESIGN_TACTICS.map((t) => (
              <label key={t.id} className={`${base.optRow} ${styles.optRowSplit}`}>
                <input
                  type="radio"
                  name="mia-geo-tactic"
                  className={base.optInput}
                  checked={design.tacticId === t.id}
                  onChange={() => update({ tacticId: t.id })}
                />
                <span className={styles.optStack}>
                  <span className={base.optTitle}>{t.name}</span>
                  <span className={styles.optMeta}>{t.channel}</span>
                </span>
                <span
                  className={
                    t.lastTested === "Never tested" ? `${styles.tag} ${styles.tagHighlight}` : styles.tag
                  }
                >
                  {t.lastTested}
                </span>
              </label>
            ))}
          </div>
          <Actions>
            <button
              type="button"
              className={`${base.btn} ${base.btnPrimary}`}
              disabled={!design.tacticId}
              onClick={() => commit("Which tactic do you want to test?", tactic?.name ?? "")}
            >
              Continue
            </button>
          </Actions>
        </MiaTurn>
      )}

      {step === "type" && (
        <MiaTurn>
          <p className={base.q}>What kind of test?</p>
          <p className={base.qDesc}>Both measure true incrementality for {tactic?.name}.</p>
          <div className={base.turnContent}>
            <div className={base.methods}>
              <button
                type="button"
                className={base.methodCard}
                onClick={() => {
                  update({ type: "Holdout" });
                  commit("What kind of test?", "Holdout — pause media in test markets");
                }}
              >
                <div className={base.methodIcon}>
                  <HoldoutGlyph />
                </div>
                <div>
                  <h4>Holdout</h4>
                  <p>Pause media in test markets to measure what it drives today.</p>
                </div>
              </button>
              <button
                type="button"
                className={base.methodCard}
                onClick={() => {
                  update({ type: "Scale" });
                  commit("What kind of test?", "Scale — heavy-up spend in test markets");
                }}
              >
                <div className={base.methodIcon}>
                  <ScaleGlyph />
                </div>
                <div>
                  <h4>Scale</h4>
                  <p>Increase spend in test markets to see the return on the next dollar.</p>
                </div>
              </button>
            </div>
          </div>
          <Actions onBack={goBack} />
        </MiaTurn>
      )}

      {step === "kpi" && (
        <MiaTurn>
          <p className={base.q}>Which conversion type should the test read on?</p>
          <p className={base.qDesc}>This is the primary KPI for the readout.</p>
          <div className={base.turnContent}>
            {DESIGN_KPIS.map((kpi) => (
              <label key={kpi} className={base.optRow}>
                <input
                  type="radio"
                  name="mia-geo-kpi"
                  className={base.optInput}
                  checked={design.kpi === kpi}
                  onChange={() => update({ kpi })}
                />
                <span className={base.optTitle}>{kpi}</span>
                {kpi === "Online Orders" && <Recommended />}
              </label>
            ))}
          </div>
          <Actions onBack={goBack}>
            <button
              type="button"
              className={`${base.btn} ${base.btnPrimary}`}
              disabled={!design.kpi}
              onClick={() => commit("Which conversion type should the test read on?", design.kpi ?? "")}
            >
              Continue
            </button>
          </Actions>
        </MiaTurn>
      )}

      {step === "timing" && (
        <MiaTurn>
          <p className={base.q}>When should it run, and for how long?</p>
          <p className={base.qDesc}>
            {RECOMMENDED_WEEKS} weeks covers a full purchase cycle without dragging out the readout.
          </p>
          <div className={base.turnContent}>
            <p className={base.groupLabel}>Duration</p>
            <div className={styles.chipGroup} role="radiogroup" aria-label="Duration">
              {DURATION_OPTIONS.map((w) => (
                <button
                  key={w}
                  type="button"
                  role="radio"
                  aria-checked={design.weeks === w}
                  className={design.weeks === w ? `${styles.choice} ${styles.choiceActive}` : styles.choice}
                  onClick={() => update({ weeks: w })}
                >
                  {w} weeks
                  {w === RECOMMENDED_WEEKS && <span className={styles.choiceHint}>Recommended</span>}
                </button>
              ))}
            </div>
            <p className={base.groupLabel} style={{ marginTop: 14 }}>
              Start date
            </p>
            <select
              className={`${base.select} ${styles.fullSelect}`}
              value={design.start}
              onChange={(e) => update({ start: e.target.value })}
              aria-label="Start date"
            >
              {startDates.map((d) => (
                <option key={d} value={d}>
                  Monday, {formatDate(d)}
                </option>
              ))}
            </select>
            <div className={base.periodNote} style={{ marginTop: 10 }}>
              <InfoIcon size={14} />
              <span>
                Runs {formatDate(design.start, false)} – {formatDate(endDate(design))}. Results finalize
                about 8 days after the test ends.
              </span>
            </div>
          </div>
          <Actions onBack={goBack}>
            <button
              type="button"
              className={`${base.btn} ${base.btnPrimary}`}
              onClick={() =>
                commit(
                  "When should it run, and for how long?",
                  `${design.weeks} weeks · ${formatDate(design.start, false)} – ${formatDate(endDate(design))}`
                )
              }
            >
              Continue
            </button>
          </Actions>
        </MiaTurn>
      )}

      {step === "cell" && (
        <MiaTurn>
          <p className={base.q}>How big should the test cell be?</p>
          <p className={base.qDesc}>
            Share of national sales in test markets. Bigger cells detect smaller lifts but put more
            revenue in the test.
          </p>
          <div className={base.turnContent}>
            <div className={styles.cellOptions}>
              {CELL_SIZE_OPTIONS.map((size) => {
                const active = design.cellSize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    className={active ? `${styles.cellCard} ${styles.cellCardActive}` : styles.cellCard}
                    onClick={() => update({ cellSize: size })}
                    aria-pressed={active}
                  >
                    <span className={styles.cellSize}>{size.toFixed(size % 1 ? 2 : 0)}%</span>
                    <span className={styles.cellMeta}>{marketCount(size)} DMAs</span>
                    <span className={styles.cellMeta}>MDE ±{estimateMde(size, design.weeks).toFixed(1)}%</span>
                    {size === optimalTestCellSize && <span className={styles.choiceHint}>Optimal</span>}
                  </button>
                );
              })}
            </div>
            <p className={base.groupLabel} style={{ marginTop: 14 }}>
              Implementation
            </p>
            <div className={styles.chipGroup} role="radiogroup" aria-label="Implementation">
              {(["Manual", "Automated"] as const).map((impl) => (
                <button
                  key={impl}
                  type="button"
                  role="radio"
                  aria-checked={design.implementation === impl}
                  className={
                    design.implementation === impl ? `${styles.choice} ${styles.choiceActive}` : styles.choice
                  }
                  onClick={() => update({ implementation: impl })}
                >
                  {impl}
                  <span className={styles.choiceSub}>
                    {impl === "Manual" ? "You set geo targeting" : "Pushed via platform API"}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <Actions onBack={goBack}>
            <button
              type="button"
              className={`${base.btn} ${base.btnPrimary}`}
              onClick={() =>
                commit(
                  "How big should the test cell be?",
                  `${design.cellSize.toFixed(2)}% · ${marketCount(design.cellSize)} DMAs · ${design.implementation}`
                )
              }
            >
              Continue
            </button>
          </Actions>
        </MiaTurn>
      )}

      {step === "review" && (
        <MiaTurn>
          <p className={base.q}>Here's your test design</p>
          <p className={base.qDesc}>I'll select matched test and control markets when you create it.</p>
          <div className={base.turnContent}>
            <div className={base.tbl}>
              <ReviewRow label="Test" value={testName(design)} />
              <ReviewRow label="Conversion type" value={design.kpi ?? ""} />
              <ReviewRow
                label="Dates"
                value={`${formatDate(design.start, false)} – ${formatDate(endDate(design))}`}
                sub={`${design.weeks} weeks`}
              />
              <ReviewRow
                label="Test cell"
                value={`${design.cellSize.toFixed(2)}%`}
                sub={`${marketCount(design.cellSize)} DMAs · ${design.implementation}`}
              />
              <div className={base.tblFoot}>
                <span className={base.flabel}>
                  Minimum detectable lift
                  <span className={base.finc}>80% power</span>
                </span>
                <span className={base.fval}>±{mde.toFixed(1)}%</span>
              </div>
            </div>
            {design.type === "Holdout" && (
              <div className={base.periodNote} style={{ marginTop: 10 }}>
                <InfoIcon size={14} />
                <span>
                  Pausing {tactic?.channel} in test markets puts roughly {revenueAtRisk(design).toFixed(2)}% of
                  national revenue at risk during the test.
                </span>
              </div>
            )}
          </div>
          <Actions onBack={goBack}>
            <button
              type="button"
              className={`${base.btn} ${base.btnPrimary}`}
              onClick={() => {
                onCreate(design);
                setStep("done");
              }}
            >
              Create draft test
            </button>
          </Actions>
        </MiaTurn>
      )}

      {step === "done" && (
        <MiaTurn>
          <div className={base.doneWrap}>
            <div className={base.doneRing}>
              <CheckRingIcon size={22} />
            </div>
            <p className={base.q}>Draft test created</p>
            <p className={base.qDesc}>"{testName(design)}" is in your Geo Tests list as a draft.</p>
            <div className={base.summary}>
              <div className={base.scard}>
                <div className={base.sl}>Type</div>
                <div className={`${base.sv} ${base.small}`}>{design.type}</div>
              </div>
              <div className={base.scard}>
                <div className={base.sl}>Test cell</div>
                <div className={`${base.sv} ${base.small}`}>{design.cellSize.toFixed(2)}%</div>
              </div>
              <div className={base.scard}>
                <div className={base.sl}>Markets</div>
                <div className={base.sv}>{marketCount(design.cellSize)}</div>
              </div>
              <div className={base.scard}>
                <div className={base.sl}>MDE</div>
                <div className={`${base.sv} ${base.small}`}>±{mde.toFixed(1)}%</div>
              </div>
            </div>
            <div className={base.doneActions}>
              <button
                type="button"
                className={`${base.btn} ${base.btnPrimary} ${base.btnFull}`}
                onClick={onViewTests}
              >
                View in Geo Tests →
              </button>
              <button
                type="button"
                className={`${base.btn} ${base.btnFull}`}
                onClick={() => {
                  setDesign(initialDesign());
                  setHistory([]);
                  setStep("tactic");
                }}
              >
                Design another test
              </button>
            </div>
          </div>
        </MiaTurn>
      )}
    </>
  );
}

function ReviewRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className={base.summaryRow}>
      <div className={base.tinfo}>
        <div className={base.tch}>{label}</div>
      </div>
      <div className={styles.reviewVal}>
        <span>{value}</span>
        {sub && <span className={base.tch}>{sub}</span>}
      </div>
    </div>
  );
}

function HoldoutGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.6 5.6l12.8 12.8" />
    </svg>
  );
}

function ScaleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 19l6-6 4 4 6-8" />
      <path d="M15 9h5v5" />
    </svg>
  );
}
