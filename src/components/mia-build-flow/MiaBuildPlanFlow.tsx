import { useEffect, useRef, useState, type ReactNode } from "react";
import type { CreatePlanInput } from "../../mpo/types";
import { BUILD_TACTICS, CT_GROUPS } from "../../mpo/buildPlan/data";
import {
  activeWindow,
  buildPlanToCreatePlanInput,
  ctSummary,
  downloadBudgetTemplate,
  includedTactics,
  includedTotal,
  periodLabel,
  planDaysFor,
} from "../../mpo/buildPlan/logic";
import { currencyFormatter, formatShortDate } from "../../mpo/buildPlan/data";
import { useBuildPlanFlow } from "../../mpo/buildPlan/useBuildPlanFlow";
import type { BuildPlanState } from "../../mpo/buildPlan/types";
import { CalendarRangePicker } from "../CalendarRangePicker";
import {
  CheckIcon,
  CheckRingIcon,
  DownloadIcon,
  FileIcon,
  HistoryIcon,
  InfoIcon,
  UploadIcon,
} from "../icons/BuildPlanIcons";
import { SparkleIcon } from "../icons/SparkleIcon";
import styles from "./MiaBuildPlanFlow.module.css";

type Props = {
  onComplete: (input: CreatePlanInput) => void;
  onEdit: (state: BuildPlanState) => void;
  onSummaryVisible?: (visible: boolean) => void;
  editSignal?: number;
};

type HistoryEntry = { id: string; question: string; answer: string };

function MiaTurn({ children }: { children: ReactNode }) {
  return <div className={styles.turn}>{children}</div>;
}

function QuestionBubble({ text }: { text: string }) {
  return (
    <div className={styles.bubbleMia}>
      <span className={styles.bubbleAvatar} aria-hidden>
        <SparkleIcon size={11} />
      </span>
      <p>{text}</p>
    </div>
  );
}

function AnswerBubble({ text }: { text: string }) {
  return (
    <div className={styles.bubbleUser}>
      <p>{text}</p>
    </div>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={styles.backLink} onClick={onClick}>
      Back
    </button>
  );
}

export function MiaBuildPlanFlow({ onComplete, onEdit, onSummaryVisible, editSignal }: Props) {
  const flow = useBuildPlanFlow();
  const { state } = flow;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [windowConfirmed, setWindowConfirmed] = useState(false);
  const [methodChoice, setMethodChoice] = useState<"upload" | "fetch" | null>(state.method);
  const lastEditSignal = useRef(editSignal);

  const commit = (question: string, answer: string, action: () => void) => {
    setHistory((h) => [...h, { id: `${h.length}-${question}`, question, answer }]);
    action();
  };

  const goBack = () => {
    setHistory((h) => h.slice(0, -1));
    setWindowConfirmed(false);
    flow.back();
  };

  const periodAnswer = () => `${periodLabel(state)} · ${planDaysFor(state)} days`;

  const ctAnswer = () => {
    const { label, attrLabels } = ctSummary(state);
    return attrLabels.length ? attrLabels.join(" + ") : label;
  };

  useEffect(() => {
    if (state.screen === "method") setMethodChoice(state.method);
  }, [state.screen, state.method]);

  const atSummary = state.screen === "review" && (state.method === "upload" || windowConfirmed);
  useEffect(() => {
    onSummaryVisible?.(atSummary);
  }, [atSummary, onSummaryVisible]);

  useEffect(() => {
    if (editSignal !== undefined && editSignal !== lastEditSignal.current) {
      lastEditSignal.current = editSignal;
      onEdit(state);
    }
  }, [editSignal, onEdit, state]);

  return (
    <>
      {history.map((entry) => (
        <div key={entry.id} className={styles.exchange}>
          <QuestionBubble text={entry.question} />
          <AnswerBubble text={entry.answer} />
        </div>
      ))}

      {state.screen === "period" && (
        <MiaTurn>
          <p className={styles.q}>What period are you planning for?</p>
          <div className={styles.turnContent}>
            <CalendarRangePicker start={state.planStart} end={state.planEnd} onChange={flow.setPeriod} panels={1} />
          </div>
          <div className={styles.turnActions}>
            <span className={styles.dayCount}>{periodAnswer()}</span>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => commit("What period are you planning for?", periodAnswer(), flow.continueFromPeriod)}
            >
              Continue
            </button>
          </div>
        </MiaTurn>
      )}

      {state.screen === "ct" && (
        <MiaTurn>
          <p className={styles.q}>Select conversion type</p>
          <div className={styles.turnContent}>
            {CT_GROUPS.map((group) => (
              <div className={styles.group} key={group.group}>
                <p className={styles.groupLabel}>{group.label}</p>
                {group.items.map((item) => {
                  const selected =
                    group.selectionType === "single"
                      ? state.singleCT === item.id
                      : state.attrs.includes(item.id);
                  return (
                    <label key={item.id} className={styles.optRow}>
                      <input
                        type={group.selectionType === "single" ? "radio" : "checkbox"}
                        name="mia-ct-group"
                        className={styles.optInput}
                        checked={selected}
                        onChange={() =>
                          group.selectionType === "single"
                            ? flow.toggleSingleCT(item.id)
                            : flow.toggleAttr(item.id)
                        }
                      />
                      <span className={styles.optTitle}>{item.name}</span>
                    </label>
                  );
                })}
              </div>
            ))}
          </div>
          <div className={styles.turnActions}>
            <BackLink onClick={goBack} />
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={!state.singleCT && state.attrs.length === 0}
              onClick={() => commit("Select conversion type", ctAnswer(), flow.continueFromCT)}
            >
              Continue
            </button>
          </div>
        </MiaTurn>
      )}

      {state.screen === "method" && (
        <MiaTurn>
          <p className={styles.q}>What is your budget for this period?</p>
          <div className={styles.turnContent}>
            <div className={styles.methods}>
              <button
                type="button"
                className={`${styles.methodCard} ${methodChoice === "upload" ? styles.methodCardSelected : ""}`}
                onClick={() => setMethodChoice("upload")}
              >
                <div className={styles.methodIcon}>
                  <UploadIcon size={18} />
                </div>
                <div>
                  <h4>Upload budget</h4>
                  <p>Fill in the template and upload it back.</p>
                </div>
              </button>
              <button
                type="button"
                className={`${styles.methodCard} ${methodChoice === "fetch" ? styles.methodCardSelected : ""}`}
                onClick={() => setMethodChoice("fetch")}
              >
                <div className={styles.methodIcon}>
                  <HistoryIcon size={18} />
                </div>
                <div>
                  <h4>Fetch from past period</h4>
                  <p>Use a prior period's actual spend.</p>
                </div>
              </button>
            </div>
          </div>
          <div className={styles.turnActions}>
            <BackLink onClick={goBack} />
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={!methodChoice}
              onClick={() => {
                if (!methodChoice) return;
                if (methodChoice === "fetch") setWindowConfirmed(false);
                commit(
                  "What is your budget for this period?",
                  methodChoice === "upload" ? "Upload budget" : "Fetch from past period",
                  () => flow.chooseMethod(methodChoice)
                );
              }}
            >
              Next
            </button>
          </div>
        </MiaTurn>
      )}

      {state.screen === "upload" && (
        <MiaTurn>
          <p className={styles.q}>Upload your budget</p>
          <div className={styles.turnContent}>
            <div className={styles.templateRow}>
              <div className={styles.ti}>
                <FileIcon size={15} />
              </div>
              <div className={styles.tt}>
                <strong>MPO_budget_template.xlsx</strong>
                <span>{BUILD_TACTICS.length} tactics · Tactic, Channel, Budget</span>
              </div>
            </div>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnFull}`}
              style={{ marginBottom: 12 }}
              onClick={downloadBudgetTemplate}
            >
              <DownloadIcon size={14} /> Download template
            </button>
            <div
              className={`${styles.dropzone} ${state.source === "upload-ready" ? styles.dropzoneFilled : ""}`}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.csv"
                className={styles.visuallyHidden}
                onChange={() => flow.markUploadFilled()}
              />
              <div className={styles.dzIcon}>
                {state.source === "upload-ready" ? <CheckIcon size={20} /> : <UploadIcon size={20} />}
              </div>
              <div className={styles.dzTitle}>
                {state.source === "upload-ready" ? "budget_plan.xlsx uploaded" : "Drop your .xlsx here"}
              </div>
              <div className={styles.dzSub}>
                {state.source === "upload-ready" ? "9 of 9 tactics matched" : "or click to browse"}
              </div>
            </div>
          </div>
          <div className={styles.turnActions}>
            <BackLink onClick={goBack} />
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={state.source !== "upload-ready"}
              onClick={() => commit("Upload your budget", "budget_plan.xlsx", flow.continueFromUpload)}
            >
              Continue
            </button>
          </div>
        </MiaTurn>
      )}

      {state.screen === "review" && state.method === "fetch" && !windowConfirmed && (
        <MiaTurn>
          <p className={styles.q}>Which past period should we pull from?</p>
          <div className={styles.turnContent}>
            <CalendarRangePicker
              start={activeWindow(state).start}
              end={activeWindow(state).end}
              onChange={(start) => flow.setSourceStart(start)}
              panels={1}
              mode="fixed-length"
              fixedLengthDays={planDaysFor(state)}
            />
            <div className={styles.periodNote}>
              <InfoIcon size={14} />
              <span>
                Actuals from {formatShortDate(activeWindow(state).start)} – {formatShortDate(activeWindow(state).end)}.
                Dormant tactics excluded by default.
              </span>
            </div>
          </div>
          <div className={styles.turnActions}>
            <BackLink onClick={goBack} />
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() =>
                commit("Which past period should we pull from?", activeWindow(state).label, () =>
                  setWindowConfirmed(true)
                )
              }
            >
              Continue
            </button>
          </div>
        </MiaTurn>
      )}

      {state.screen === "review" && (state.method === "upload" || windowConfirmed) && (
        <SummaryTurn state={state} onEdit={() => onEdit(state)} onCreate={flow.completePlan} onBack={goBack} />
      )}

      {state.screen === "done" && (
        <DoneTurn state={state} onRestart={flow.restart} onComplete={() => onComplete(buildPlanToCreatePlanInput(state))} />
      )}
    </>
  );
}

function SummaryTurn({
  state,
  onEdit,
  onCreate,
  onBack,
}: {
  state: BuildPlanState;
  onEdit: () => void;
  onCreate: () => void;
  onBack: () => void;
}) {
  const rows = includedTactics(state);

  return (
    <MiaTurn>
      <p className={styles.q}>Here's your plan budget</p>
      <div className={styles.turnContent}>
        <div className={styles.tbl}>
          {rows.map((t) => (
            <div key={t.id} className={styles.summaryRow}>
              <div className={styles.tinfo}>
                <div className={styles.tname}>{t.name}</div>
                <div className={styles.tch}>{t.channel}</div>
              </div>
              <div className={styles.summaryVal}>{currencyFormatter.format(state.budget[t.id] ?? 0)}</div>
            </div>
          ))}
          <div className={styles.tblFoot}>
            <span className={styles.flabel}>
              Total budget
              <span className={styles.finc}>{rows.length} of {BUILD_TACTICS.length} included</span>
            </span>
            <span className={styles.fval}>{currencyFormatter.format(includedTotal(state))}</span>
          </div>
        </div>
      </div>
      <div className={styles.turnActions}>
        <BackLink onClick={onBack} />
        <div className={styles.turnActionsGroup}>
          <button type="button" className={styles.btn} onClick={onEdit}>
            Edit
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={onCreate}>
            Create plan
          </button>
        </div>
      </div>
    </MiaTurn>
  );
}

function DoneTurn({
  state,
  onRestart,
  onComplete,
}: {
  state: BuildPlanState;
  onRestart: () => void;
  onComplete: () => void;
}) {
  const total = includedTotal(state);
  const active = includedTactics(state).length;
  const period = periodLabel(state);
  const { label: ctLabel, attrLabels } = ctSummary(state);
  const usingAttrs = attrLabels.length > 0;

  return (
    <MiaTurn>
      <div className={styles.doneWrap}>
        <div className={styles.doneRing}>
          <CheckRingIcon size={22} />
        </div>
        <p className={styles.q}>Plan created</p>
        <div className={styles.summary}>
          <div className={styles.scard}>
            <div className={styles.sl}>Plan period</div>
            <div className={`${styles.sv} ${styles.small}`}>{period}</div>
          </div>
          <div className={styles.scard}>
            <div className={styles.sl}>Conversion type</div>
            <div className={`${styles.sv} ${styles.small}`}>{ctLabel}</div>
          </div>
          <div className={styles.scard}>
            <div className={styles.sl}>Tactics</div>
            <div className={styles.sv}>{active}</div>
          </div>
          <div className={styles.scard}>
            <div className={styles.sl}>Total budget</div>
            <div className={`${styles.sv} ${styles.small}`}>{currencyFormatter.format(total)}</div>
          </div>
        </div>
        {usingAttrs && (
          <div className={styles.chipRow}>
            {attrLabels.map((label) => (
              <span key={label} className={styles.chip}>
                {label}
              </span>
            ))}
          </div>
        )}
        <div className={styles.doneActions}>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnFull}`} onClick={onComplete}>
            Project &amp; simulate →
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnFull}`} onClick={onRestart}>
            Start over
          </button>
        </div>
      </div>
    </MiaTurn>
  );
}
