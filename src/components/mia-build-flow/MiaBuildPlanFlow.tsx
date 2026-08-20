import { useEffect, useRef, useState, type ReactNode } from "react";
import { CT_GROUPS, PLAN_TYPE_OPTIONS, TARGET_OPTIONS } from "../../mpo/buildPlan/data";
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
import type { BuildPlanState, PlanTypeChoice } from "../../mpo/buildPlan/types";
import type { PlanTarget } from "../../mpo/types";
import { CalendarRangePicker } from "../CalendarRangePicker";
import { HistoryIcon, UploadIcon } from "../icons/BuildPlanIcons";
import styles from "./MiaBuildPlanFlow.module.css";

type Props = {
  initialState?: BuildPlanState;
  onAwaitUpload: (state: BuildPlanState) => void;
  onFetchReady: (state: BuildPlanState) => void;
  onExchange: (question: string, answer: string) => void;
};

const STEP_DELAY_MS = 300;

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

const TARGET_FIELD_LABEL: Record<Exclude<PlanTarget, null>, string> = {
  "incremental-sales": "Target incremental sales",
  "incremental-orders": "Target incremental orders",
  "incremental-roas": "Target incremental ROAS",
  "incremental-cpo": "Target incremental CPO",
};

function TargetValueInput({
  target,
  value,
  onChange,
}: {
  target: Exclude<PlanTarget, null>;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  const isDollar = target === "incremental-sales" || target === "incremental-cpo";
  const isInteger = target === "incremental-sales" || target === "incremental-orders";
  const placeholder =
    target === "incremental-sales"
      ? "e.g. 250,000"
      : target === "incremental-orders"
      ? "e.g. 1,200"
      : target === "incremental-roas"
      ? "e.g. 4.50"
      : "e.g. 45.00";

  const [text, setText] = useState(value == null ? "" : isInteger ? value.toLocaleString("en-US") : String(value));

  return (
    <div className={styles.targetInputWrap}>
      {isDollar && <span className={styles.dol}>$</span>}
      <input
        className={`${styles.targetInput} ${isDollar ? styles.targetInputPrefixed : ""}`}
        inputMode={isInteger ? "numeric" : "decimal"}
        placeholder={placeholder}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const n = isInteger
            ? parseInt(e.target.value.replace(/[^0-9]/g, ""), 10)
            : parseFloat(e.target.value);
          onChange(isNaN(n) ? null : n);
        }}
        onBlur={() => {
          if (!isInteger) return;
          const n = parseInt(text.replace(/[^0-9]/g, ""), 10);
          setText(isNaN(n) ? "" : n.toLocaleString("en-US"));
        }}
      />
    </div>
  );
}

export function MiaBuildPlanFlow({ initialState, onAwaitUpload, onFetchReady, onExchange }: Props) {
  const flow = useBuildPlanFlow(initialState);
  const { state } = flow;
  const [planTypeChoice, setPlanTypeChoice] = useState<PlanTypeChoice>(null);
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
    flow.setTargetValue(referenceTargetDefault(state, id));
  };

  const periodAnswer = () => `${periodLabel(state)} · ${planDaysFor(state)} days`;

  const ctAnswer = () => {
    const { label, attrLabels } = ctSummary(state);
    return attrLabels.length ? attrLabels.join(" + ") : label;
  };

  return (
    <>
      {!pending && state.screen === "plan-type" && (
        <MiaTurn>
          <p className={styles.q}>What would you like to do?</p>
          <div className={styles.turnContent}>
            <div className={styles.methods}>
              {PLAN_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`${styles.methodCard} ${planTypeChoice === opt.id ? styles.methodCardSelected : ""}`}
                  onClick={() => setPlanTypeChoice(opt.id)}
                >
                  <div>
                    <h4>{opt.label}</h4>
                    <p>{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className={styles.turnActions}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={!planTypeChoice}
              onClick={() => {
                if (!planTypeChoice) return;
                const choice = planTypeChoice;
                const label = PLAN_TYPE_OPTIONS.find((o) => o.id === choice)!.label;
                commit("What would you like to do?", label, () => flow.choosePlanType(choice));
              }}
            >
              Next
            </button>
          </div>
        </MiaTurn>
      )}

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
          <p className={styles.q}>Enter a target outcome</p>
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
                    <label className={styles.targetLabel}>{TARGET_FIELD_LABEL[state.target]}</label>
                    <TargetValueInput
                      key={state.target}
                      target={state.target}
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
                commit("Enter a target outcome", targetLabel(state), flow.continueFromTarget)
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
                  <UploadIcon size={20} />
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
                  <HistoryIcon size={20} />
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
