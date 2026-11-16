import { useState } from "react";
import { CloseIcon } from "./icons/CloseIcon";
import { MaterialIcon } from "./icons/MaterialIcon";
import {
  WeeklyProjectionChart,
  buildWeeklyProjection,
  toCumulativeWeeks,
  formatFullCurrency,
  formatVolumeFull,
} from "./WeeklyProjectionChart";
import chartStyles from "./PlanOverviewCard.module.css";
import styles from "./TacticChartModal.module.css";

type Props = {
  open: boolean;
  tacticName: string;
  channel: string;
  planStart: Date;
  planEnd: Date;
  totalBudget: number;
  volumeMetric: number;
  volumeNoun: string;
  isOrdersFamily: boolean;
  onClose: () => void;
  allowActual?: boolean;
};

export function TacticChartModal({
  open,
  tacticName,
  channel,
  planStart,
  planEnd,
  totalBudget,
  volumeMetric,
  volumeNoun,
  isOrdersFamily,
  onClose,
  allowActual = true,
}: Props) {
  const [chartView, setChartView] = useState<"cumulative" | "weekly">("weekly");

  if (!open) return null;

  const handleExport = () => {
    const weeks = buildWeeklyProjection(planStart, planEnd, volumeMetric, totalBudget);
    const exportWeeks = chartView === "cumulative" ? toCumulativeWeeks(weeks) : weeks;
    const header = ["Week", `Incremental ${volumeNoun}`, "Budget"];
    const rows = exportWeeks.map((w) => [
      w.fullLabel,
      formatVolumeFull(w.sales, isOrdersFamily),
      formatFullCurrency(w.budget),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${tacticName} - projections by week.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tactic-chart-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div>
            <h3 id="tactic-chart-title" className={styles.title}>
              {tacticName}
            </h3>
            <p className={styles.subtitle}>{channel}</p>
          </div>
          <div className={styles.headerActions}>
            <div className={chartStyles.viewToggle}>
              <button
                type="button"
                className={chartView === "weekly" ? chartStyles.viewActive : ""}
                onClick={() => setChartView("weekly")}
              >
                Weekly
              </button>
              <button
                type="button"
                className={chartView === "cumulative" ? chartStyles.viewActive : ""}
                onClick={() => setChartView("cumulative")}
              >
                Cumulative
              </button>
            </div>
            <button type="button" className={styles.exportBtn} onClick={handleExport}>
              <MaterialIcon name="file_upload" size={18} />
              Export
            </button>
            <button type="button" className={styles.closeBtn} aria-label="Close" onClick={onClose}>
              <CloseIcon size={20} />
            </button>
          </div>
        </div>
        <div className={styles.chartHost}>
          <WeeklyProjectionChart
            planStart={planStart}
            planEnd={planEnd}
            totalBudget={totalBudget}
            volumeMetric={volumeMetric}
            volumeNoun={volumeNoun}
            isOrdersFamily={isOrdersFamily}
            hideHeader
            chartView={chartView}
            onChartViewChange={setChartView}
            noSidePadding
            allowActual={allowActual}
          />
        </div>
      </div>
    </div>
  );
}
