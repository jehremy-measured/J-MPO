import { useEffect, useRef, useState, type ReactNode } from "react";
import { CT_GROUPS } from "../../mpo/buildPlan/data";
import {
  applyMethodChoice,
  applyUploadedBudget,
  ctSummary,
  downloadBudgetTemplate,
  periodLabel,
  planDaysFor,
} from "../../mpo/buildPlan/logic";
import { useBuildPlanFlow } from "../../mpo/buildPlan/useBuildPlanFlow";
import type { BuildPlanState } from "../../mpo/buildPlan/types";
import { CalendarRangePicker } from "../CalendarRangePicker";
import {
  CheckIcon,
  DownloadIcon,
  FileIcon,
  HistoryIcon,
  UploadIcon,
} from "../icons/BuildPlanIcons";
import styles from "./MiaBuildPlanFlow.module.css";

type Props = {
  onMethodChosen: (method: "upload" | "fetch") => void;
  onHandoff: (state: BuildPlanState, method: "upload" | "fetch") => void;
};

type HistoryEntry = { id: string; question: string; answer: string };

function MiaTurn({ children }: { children: ReactNode }) {
  return <div className={styles.turn}>{children}</div>;
}

function QuestionBubble({ text }: { text: string }) {
  return <p className={styles.miaText}>{text}</p>;
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

export function MiaBuildPlanFlow({ onMethodChosen, onHandoff }: Props) {
  const flow = useBuildPlanFlow();
  const { state } = flow;
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [methodChoice, setMethodChoice] = useState<"upload" | "fetch" | null>(null);
  const [pendingReviewState, setPendingReviewState] = useState<BuildPlanState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onHandoffRef = useRef(onHandoff);

  useEffect(() => {
    onHandoffRef.current = onHandoff;
  }, [onHandoff]);

  useEffect(() => {
    if (!pendingReviewState) return;
    const timer = window.setTimeout(() => {
      onHandoffRef.current(pendingReviewState, "upload");
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [pendingReviewState]);

  const commit = (question: string, answer: string, action: () => void) => {
    setHistory((h) => [...h, { id: `${h.length}-${question}`, question, answer }]);
    action();
  };

  const goBack = () => {
    setHistory((h) => h.slice(0, -1));
    setPendingReviewState(null);
    flow.back();
  };

  const periodAnswer = () => `${periodLabel(state)} · ${planDaysFor(state)} days`;

  const ctAnswer = () => {
    const { label, attrLabels } = ctSummary(state);
    return attrLabels.length ? attrLabels.join(" + ") : label;
  };

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
                onMethodChosen(methodChoice);
                if (methodChoice === "upload") {
                  flow.chooseMethod("upload");
                } else {
                  onHandoff(applyMethodChoice(state, "fetch"), "fetch");
                }
              }}
            >
              Next
            </button>
          </div>
        </MiaTurn>
      )}

      {state.screen === "upload" && (
        <MiaTurn>
          {pendingReviewState ? (
            <div className={styles.loadingRow}>
              <span className={styles.spinner} aria-hidden />
              <p className={styles.q}>Loading your plan for review…</p>
            </div>
          ) : (
            <>
              <p className={styles.q}>Upload your budget</p>
              <div className={styles.turnContent}>
                <div className={styles.downloadCard}>
                  <span className={styles.downloadCardIcon} aria-hidden>
                    <FileIcon size={16} />
                  </span>
                  <span className={styles.downloadCardLabel}>MPO_budget_template.xlsx</span>
                  <button
                    type="button"
                    className={styles.downloadCardBtn}
                    aria-label="Download template"
                    onClick={downloadBudgetTemplate}
                  >
                    <DownloadIcon size={16} />
                  </button>
                </div>
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
                  onClick={() => setPendingReviewState(applyUploadedBudget(state))}
                >
                  Continue
                </button>
              </div>
            </>
          )}
        </MiaTurn>
      )}
    </>
  );
}
