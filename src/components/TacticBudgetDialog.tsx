import { useEffect, useRef, useState } from "react";
import { currencyFormatter, formatShortDate } from "../mpo/buildPlan/data";
import { weeklyBudgetSplit, type WeekColumn } from "../mpo/buildPlan/logic";
import { CloseIcon } from "./icons/CloseIcon";
import styles from "./PlanDialog.module.css";

function parseDigits(text: string): number {
  const n = parseInt(text.replace(/[^0-9]/g, ""), 10);
  return isNaN(n) ? 0 : n;
}

/** A single week's budget cell -- read-only text in "total" mode (its value is derived from the
 * total), or a click-to-edit link in "manual" mode, matching the tactics table's own budget
 * click-to-edit pattern. */
function WeekValueCell({
  value,
  editable,
  onChange,
}: {
  value: number;
  editable: boolean;
  onChange: (value: number) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(value.toLocaleString("en-US"));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) setText(value.toLocaleString("en-US"));
  }, [value, isEditing]);

  if (!editable) {
    return <span className={styles.budgetWeekValue}>{currencyFormatter.format(value)}</span>;
  }

  if (!isEditing) {
    return (
      <button
        type="button"
        className={styles.budgetWeekValueLink}
        onClick={() => {
          setIsEditing(true);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
      >
        {currencyFormatter.format(value)}
      </button>
    );
  }

  return (
    <span className={styles.budgetWeekInputWrap}>
      <span className={styles.budgetDol}>$</span>
      <input
        ref={inputRef}
        className={styles.budgetWeekInput}
        inputMode="numeric"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange(parseDigits(e.target.value));
        }}
        onBlur={() => setIsEditing(false)}
      />
    </span>
  );
}

type Props = {
  tacticName: string;
  planStart: Date;
  planEnd: Date;
  weekColumns: WeekColumn[];
  initialTotal: number | null;
  onCancel: () => void;
  onSave: (total: number) => void;
};

export function TacticBudgetDialog({
  tacticName,
  planStart,
  planEnd,
  weekColumns,
  initialTotal,
  onCancel,
  onSave,
}: Props) {
  const weekCount = weekColumns.length;
  const [mode, setMode] = useState<"total" | "manual">("total");
  const [totalText, setTotalText] = useState((initialTotal ?? 0).toLocaleString("en-US"));
  const [weeklyValues, setWeeklyValues] = useState<number[]>(() =>
    weeklyBudgetSplit(initialTotal ?? 0, weekCount)
  );

  const enteredTotal = parseDigits(totalText);
  const weeklySum = weeklyValues.reduce((sum, v) => sum + v, 0);
  const total = mode === "total" ? enteredTotal : weeklySum;
  const displayedWeeklyValues = mode === "total" ? weeklyBudgetSplit(enteredTotal, weekCount) : weeklyValues;

  return (
    <div className={styles.overlay} onMouseDown={onCancel}>
      <div
        className={`${styles.dialog} ${styles.dialogWide}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tactic-budget-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div>
            <h3 id="tactic-budget-title" className={styles.title}>
              {tacticName} budget
            </h3>
            <p className={styles.budgetSubtitle}>
              {formatShortDate(planStart)} - {formatShortDate(planEnd)}
            </p>
          </div>
          <button type="button" className={styles.closeBtn} aria-label="Close" onClick={onCancel}>
            <CloseIcon size={20} />
          </button>
        </div>

        <div className={styles.body}>
          <label className={styles.budgetOptionRow}>
            <input
              type="radio"
              name="budget-mode"
              className={styles.radioInput}
              checked={mode === "total"}
              onChange={() => {
                setTotalText(weeklySum.toLocaleString("en-US"));
                setMode("total");
              }}
            />
            <span className={styles.budgetOptionLabel}>Total budget</span>
            <span className={styles.budgetTotalInputWrap}>
              <span className={styles.budgetDol}>$</span>
              <input
                className={styles.budgetTotalInput}
                inputMode="numeric"
                disabled={mode !== "total"}
                value={mode === "total" ? totalText : weeklySum.toLocaleString("en-US")}
                onChange={(e) => setTotalText(e.target.value)}
                onBlur={() => setTotalText(parseDigits(totalText).toLocaleString("en-US"))}
              />
            </span>
          </label>

          <label className={styles.budgetOptionRow}>
            <input
              type="radio"
              name="budget-mode"
              className={styles.radioInput}
              checked={mode === "manual"}
              onChange={() => {
                setWeeklyValues(weeklyBudgetSplit(enteredTotal, weekCount));
                setMode("manual");
              }}
            />
            <span className={styles.budgetOptionLabel}>Manually enter weekly budgets</span>
          </label>

          <p className={styles.sectionLabel}>
            Weekly budget breakdown{mode === "total" ? " (split equally)" : ""}
          </p>
          <div className={styles.budgetTable}>
            <div className={styles.budgetTableHead}>
              <span>Week</span>
              <span>Budget</span>
            </div>
            <div className={`${styles.budgetTableRow} ${styles.budgetTableTotal}`}>
              <span>Total</span>
              <span>{currencyFormatter.format(total)}</span>
            </div>
            {weekColumns.map((w, i) => (
              <div key={w.label} className={styles.budgetTableRow}>
                <span>{w.dateLabel}</span>
                <WeekValueCell
                  value={displayedWeeklyValues[i] ?? 0}
                  editable={mode === "manual"}
                  onChange={(v) =>
                    setWeeklyValues((prev) => prev.map((existing, idx) => (idx === i ? v : existing)))
                  }
                />
              </div>
            ))}
          </div>
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className={styles.confirmBtn} onClick={() => onSave(total)}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
