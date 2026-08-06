import { useState } from "react";
import { addDays, addMonths, isSameDay, monthGrid, monthName } from "../mpo/buildPlan/dateUtils";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons/BuildPlanIcons";
import styles from "./CalendarRangePicker.module.css";

type Props = {
  start: Date;
  end: Date;
  onChange: (start: Date, end: Date) => void;
  panels?: 1 | 2;
  /** "range" (default) lets the user click two dates. "fixed-length" locks the span to
   * `fixedLengthDays` — every click just moves the start date and the end date follows. */
  mode?: "range" | "fixed-length";
  fixedLengthDays?: number;
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarRangePicker({ start, end, onChange, panels = 2, mode = "range", fixedLengthDays }: Props) {
  const [cursors, setCursors] = useState<Date[]>(() => {
    const first = new Date(start.getFullYear(), start.getMonth(), 1);
    if (panels === 1) return [first];
    const secondMonth = new Date(end.getFullYear(), end.getMonth(), 1);
    return [first, secondMonth.getTime() === first.getTime() ? addMonths(first, 1) : secondMonth];
  });
  // Tracks whether the next click should start a new range or complete the current one.
  const [phase, setPhase] = useState<"start" | "end">("end");

  const handleDayClick = (date: Date) => {
    if (mode === "fixed-length") {
      onChange(date, addDays(date, (fixedLengthDays ?? 1) - 1));
      return;
    }
    if (phase === "start" || date < start) {
      onChange(date, date);
      setPhase("end");
    } else {
      onChange(start, date);
      setPhase("start");
    }
  };

  const navigate = (panelIndex: number, dir: -1 | 1) => {
    setCursors((prev) => {
      const next = [...prev];
      next[panelIndex] = addMonths(next[panelIndex], dir);
      return next;
    });
  };

  return (
    <div className={panels === 1 ? styles.wrapSingle : styles.wrap}>
      {cursors.map((cursor, panelIndex) => (
        <div className={styles.panel} key={panelIndex}>
          <div className={styles.panelHead}>
            <button
              type="button"
              className={styles.navBtn}
              aria-label="Previous month"
              onClick={() => navigate(panelIndex, -1)}
            >
              <ChevronLeftIcon size={16} />
            </button>
            <span className={styles.monthLabel}>
              {monthName(cursor)} {cursor.getFullYear()}
            </span>
            <button
              type="button"
              className={styles.navBtn}
              aria-label="Next month"
              onClick={() => navigate(panelIndex, 1)}
            >
              <ChevronRightIcon size={16} />
            </button>
          </div>
          <div className={styles.weekRow}>
            {WEEKDAYS.map((d) => (
              <span key={d} className={styles.weekday}>
                {d}
              </span>
            ))}
          </div>
          <div className={styles.grid}>
            {monthGrid(cursor).map(({ date, inMonth }, i) => {
              const isStart = isSameDay(date, start);
              const isEnd = isSameDay(date, end);
              const inBand = date >= start && date <= end;
              const colIndex = i % 7;
              const cellClasses = [styles.cell];
              if (inBand && inMonth) cellClasses.push(styles.cellInBand);
              if (inBand && inMonth && (isStart || colIndex === 0)) cellClasses.push(styles.cellRoundLeft);
              if (inBand && inMonth && (isEnd || colIndex === 6)) cellClasses.push(styles.cellRoundRight);
              return (
                <button
                  type="button"
                  key={date.toISOString()}
                  className={cellClasses.join(" ")}
                  onClick={() => handleDayClick(date)}
                  disabled={!inMonth}
                  tabIndex={inMonth ? 0 : -1}
                >
                  <span
                    className={
                      isStart || isEnd
                        ? `${styles.dayNum} ${styles.dayNumSelected}`
                        : styles.dayNum
                    }
                  >
                    {date.getDate()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
