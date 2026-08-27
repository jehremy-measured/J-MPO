import { CloseIcon } from "./icons/CloseIcon";
import { WeeklyProjectionChart } from "./WeeklyProjectionChart";
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
}: Props) {
  if (!open) return null;

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
          <button type="button" className={styles.closeBtn} aria-label="Close" onClick={onClose}>
            <CloseIcon size={20} />
          </button>
        </div>
        <div className={styles.chartHost}>
          <WeeklyProjectionChart
            planStart={planStart}
            planEnd={planEnd}
            totalBudget={totalBudget}
            volumeMetric={volumeMetric}
            volumeNoun={volumeNoun}
            isOrdersFamily={isOrdersFamily}
          />
        </div>
      </div>
    </div>
  );
}
