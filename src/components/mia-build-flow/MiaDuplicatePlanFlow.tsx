import { useEffect, useRef, useState } from "react";
import { LATEST_MODEL_DATE, type ModelOption } from "../../mpo/modelOptions";
import { formatBudget } from "../../mpo/types";
import styles from "./MiaBuildPlanFlow.module.css";

const STEP_DELAY_MS = 300;

type BudgetChoice = "adjust" | "keep";
type ModelChoice = "current" | "latest";
type Screen = "budget" | "model";

export type DuplicatePlanFlowResult = {
  adjustBudget: boolean;
  /** The edited total budget, only meaningful when adjustBudget is true. */
  newBudget: number | null;
  model: ModelOption;
};

type Props = {
  /** The MIM model date of the plan being duplicated — drives the "Use current model" option
   * and whether the model question has anything left to choose. */
  currentModelDate: string;
  /** The source plan's current total budget — pre-fills the editable field shown once "Make
   * changes to total budget" is selected. */
  currentBudget: number;
  onExchange: (question: string, answer: string) => void;
  onDone: (result: DuplicatePlanFlowResult) => void;
};

function TypingIndicator() {
  return (
    <div className={styles.typingRow}>
      <span className={styles.typingDot} />
      <span className={styles.typingDot} />
      <span className={styles.typingDot} />
    </div>
  );
}

function BudgetValueInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const [text, setText] = useState(value.toLocaleString("en-US"));
  return (
    <div className={styles.targetFieldRow}>
      <div className={styles.targetInputWrap}>
        <span className={styles.dol}>$</span>
        <input
          className={`${styles.targetInput} ${styles.targetInputPrefixed}`}
          inputMode="numeric"
          aria-label="New total budget"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            const n = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10);
            onChange(isNaN(n) ? 0 : n);
          }}
          onBlur={() => {
            const n = parseInt(text.replace(/[^0-9]/g, ""), 10);
            setText(isNaN(n) ? "" : n.toLocaleString("en-US"));
          }}
        />
      </div>
    </div>
  );
}

const BUDGET_QUESTION = "Would you like to make any changes to the budget?";
const MODEL_QUESTION = "Which model should this new plan use?";

export function MiaDuplicatePlanFlow({ currentModelDate, currentBudget, onExchange, onDone }: Props) {
  const [screen, setScreen] = useState<Screen>("budget");
  const [pending, setPending] = useState(false);
  const [budgetChoice, setBudgetChoice] = useState<BudgetChoice | null>(null);
  const [budgetValue, setBudgetValue] = useState(currentBudget);
  const [modelChoice, setModelChoice] = useState<ModelChoice | null>(null);
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

  if (pending) return <TypingIndicator />;

  if (screen === "budget") {
    return (
      <div className={styles.turn}>
        <p className={styles.q}>{BUDGET_QUESTION}</p>
        <div className={styles.turnContent}>
          <div className={styles.methods}>
            <button
              type="button"
              className={`${styles.methodCard} ${budgetChoice === "adjust" ? styles.methodCardSelected : ""}`}
              onClick={() => setBudgetChoice("adjust")}
            >
              <div>
                <h4>Make changes to total budget</h4>
                <p>Tactic budgets will be auto-adjusted based on their current budget.</p>
              </div>
            </button>
            {budgetChoice === "adjust" && (
              <div className={styles.duplicateBudgetField}>
                <BudgetValueInput value={budgetValue} onChange={setBudgetValue} />
              </div>
            )}
            <button
              type="button"
              className={`${styles.methodCard} ${budgetChoice === "keep" ? styles.methodCardSelected : ""}`}
              onClick={() => setBudgetChoice("keep")}
            >
              <div>
                <h4>Keep budget as is</h4>
                <p>Your new plan will use the same total and tactic-level budgets as this plan.</p>
              </div>
            </button>
          </div>
        </div>
        <div className={styles.turnActions}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            disabled={!budgetChoice}
            onClick={() => {
              if (!budgetChoice) return;
              const label =
                budgetChoice === "adjust"
                  ? `Make changes to total budget (${formatBudget(budgetValue)})`
                  : "Keep budget as is";
              commit(BUDGET_QUESTION, label, () => setScreen("model"));
            }}
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  const finish = (model: ModelOption) =>
    onDone({
      adjustBudget: budgetChoice === "adjust",
      newBudget: budgetChoice === "adjust" ? budgetValue : null,
      model,
    });

  return (
    <div className={styles.turn}>
      <p className={styles.q}>{MODEL_QUESTION}</p>
      <div className={styles.turnContent}>
        <div className={styles.methods}>
          <button
            type="button"
            className={`${styles.methodCard} ${modelChoice === "current" ? styles.methodCardSelected : ""}`}
            onClick={() => setModelChoice("current")}
          >
            <div>
              <h4>Use current model</h4>
              <p>Plan will be created using the same MIM data ({currentModelDate}) as your current plan.</p>
            </div>
          </button>
          <button
            type="button"
            className={`${styles.methodCard} ${modelChoice === "latest" ? styles.methodCardSelected : ""}`}
            onClick={() => setModelChoice("latest")}
          >
            <div>
              <h4>Use latest model</h4>
              <p>Plan will be created using data from the latest MIM update ({LATEST_MODEL_DATE}).</p>
            </div>
          </button>
        </div>
      </div>
      <div className={styles.turnActions}>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnPrimary}`}
          disabled={!modelChoice}
          onClick={() => {
            if (!modelChoice) return;
            const model: ModelOption =
              modelChoice === "latest" ? { id: "latest", date: LATEST_MODEL_DATE } : { id: "current", date: currentModelDate };
            const label =
              modelChoice === "latest" ? `Use latest model (${LATEST_MODEL_DATE})` : `Use current model (${currentModelDate})`;
            commit(MODEL_QUESTION, label, () => finish(model));
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
