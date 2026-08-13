import { useEffect, useRef, useState, type ReactNode } from "react";
import { CT_GROUPS, TARGET_OPTIONS } from "../../mpo/buildPlan/data";
import {
  applyMethodChoice,
  ctSummary,
  periodLabel,
  planDaysFor,
  referenceTargetDefault,
  targetLabel,
  targetNeedsValue,
} from "../../mpo/buildPlan/logic";
import { useBuildPlanFlow } from "../../mpo/buildPlan/useBuildPlanFlow";
import type { BuildPlanState } from "../../mpo/buildPlan/types";
import type { PlanTarget } from "../../mpo/types";
import { CalendarRangePicker } from "../CalendarRangePicker";
import { HistoryIcon, UploadIcon } from "../icons/BuildPlanIcons";
import styles from "./MiaBuildPlanFlow.module.css";

type Props = {
  onAwaitUpload: (state: BuildPlanState) => void;
  onFetchReady: (state: BuildPlanState) => void;
  onExchange: (question: string, answer: string) => void;
};

const STEP_DELAY_MS = 1600;

function MiaTurn({ children }: { children: ReactNode }) {
  return <div className={styles.turn}>{children}</div>;
}

function TypingIndicator() {
  return (
    <div className={styles.typingRow}>
      <span className={styles.typingDot} />
      <span className={styles.typingDot} />
      <span className={styles.typingDot} />
    </div>
  );
}

function TargetValueInput({
  target,
  value,
  onChange,
}: {
  target: "incremental-sales" | "incremental-roas";
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  const [text, setText] = useState(
    value == null ? "" : target === "incremental-sales" ? value.toLocaleString("en-US") : String(value)
  );

  if (target === "incremental-sales") {
    return (
      <div className={styles.targetInputWrap}>
        <span className={styles.dol}>$</span>
        <input
          className={`${styles.targetInput} ${styles.targetInputPrefixed}`}
          inputMode="numeric"
          placeholder="e.g. 250,000"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            const n = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10);
            onChange(isNaN(n) ? null : n);
          }}
          onBlur={() => {
            const n = parseInt(text.replace(/[^0-9]/g, ""), 10);
            setText(isNaN(n) ? "" : n.toLocaleString("en-US"));
          }}
        />
      </div>
    );
  }

  return (
    <div className={styles.targetInputWrap}>
      <input
        className={styles.targetInput}
        inputMode="decimal"
        placeholder="e.g. 4.50"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const n = parseFloat(e.target.value);
          onChange(isNaN(n) ? null : n);
        }}
      />
    </div>
  );
}

export function MiaBuildPlanFlow({ onAwaitUpload, onFetchReady, onExchange }: Props) {
  const flow = useBuildPlanFlow();
  const { state } = flow;
  const [methodChoice, setMethodChoice] = useState<"upload" | "fetch" | null>(null);
  const [pending, setPending] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const commit = (question: string, answer: string, action: () => void) => {
    onExchange(question, answer);
    setPending(true);
    timeoutRef.current = window.setTimeout(() => {
      action();
      setPending(false);
    }, STEP_DELAY_MS);
  };

  const selectTarget = (id: PlanTarget) => {
    flow.setTarget(id);
    if (id === "incremental-sales" || id === "incremental-roas") {
      flow.setTargetValue(referenceTargetDefault(state, id));
    }
  };

  const periodAnswer = () => `${periodLabel(state)} · ${planDaysFor(state)} days`;

  const ctAnswer = () => {
    const { label, attrLabels } = ctSummary(state);
    return attrLabels.length ? attrLabels.join(" + ") : label;
  };

  return (
    <>
      {!pending && state.screen === "period" && (
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
              Next
            </button>
          </div>
        </MiaTurn>
      )}

      {!pending && state.screen === "target" && (
        <MiaTurn>
          <p className={styles.q}>What is your target for this period?</p>
          <div className={styles.turnContent}>
            {TARGET_OPTIONS.map((opt) => (
              <div key={opt.id}>
                <label className={styles.optRow}>
                  <input
                    type="radio"
                    name="mia-target"
                    className={styles.optInput}
                    checked={state.target === opt.id}
                    onChange={() => selectTarget(opt.id)}
                  />
                  <span className={styles.optTitle}>{opt.label}</span>
                </label>
                {state.target === opt.id && targetNeedsValue(state.target) && (
                  <div className={styles.targetField}>
                    <label className={styles.targetLabel}>
                      {state.target === "incremental-roas" ? "Target incremental ROAS" : "Target incremental sales"}
                    </label>
                    <TargetValueInput
                      key={state.target}
                      target={state.target as "incremental-sales" | "incremental-roas"}
                      value={state.targetValue}
                      onChange={flow.setTargetValue}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className={styles.turnActions}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={!state.target || (targetNeedsValue(state.target) && !(state.targetValue! > 0))}
              onClick={() =>
                commit("What is your target for this period?", targetLabel(state), flow.continueFromTarget)
              }
            >
              Next
            </button>
          </div>
        </MiaTurn>
      )}

      {!pending && state.screen === "ct" && (
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
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={!state.singleCT && state.attrs.length === 0}
              onClick={() => commit("Select conversion type", ctAnswer(), flow.continueFromCT)}
            >
              Next
            </button>
          </div>
        </MiaTurn>
      )}

      {!pending && state.screen === "method" && (
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
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={!methodChoice}
              onClick={() => {
                if (!methodChoice) return;
                const choice = methodChoice;
                onExchange(
                  "What is your budget for this period?",
                  choice === "upload" ? "Upload budget" : "Fetch from past period"
                );
                setPending(true);
                timeoutRef.current = window.setTimeout(() => {
                  const nextState = applyMethodChoice(state, choice);
                  if (choice === "upload") {
                    onAwaitUpload(nextState);
                  } else {
                    onFetchReady(nextState);
                  }
                  setPending(false);
                }, STEP_DELAY_MS);
              }}
            >
              Next
            </button>
          </div>
        </MiaTurn>
      )}

      {pending && <TypingIndicator />}
    </>
  );
}
