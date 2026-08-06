import { useState } from "react";
import { formatBudget, goalTypeLabel } from "../mpo/types";
import type { MetricMode, OptimizationMode, PlanGoalType, Tactic } from "../mpo/types";
import { CloseIcon } from "./icons/CloseIcon";
import { EditIcon } from "./icons/EditIcon";
import styles from "./PlanReviewPage.module.css";

type Props = {
  planLabel: string;
  planningWindow: string;
  referencePeriod: string;
  conversionType: string;
  channelCount: number;
  referenceBudgetTotal: number;
  baselineSalesForecast: number;
  optimizationMode: OptimizationMode;
  metricMode: MetricMode;
  goalType: PlanGoalType;
  totalSalesGoal: number;
  pacingEnabled: boolean;
  tactics: Tactic[];
  onOptimizationModeChange: (mode: OptimizationMode) => void;
  onMetricModeChange: (mode: MetricMode) => void;
  onBaselineChange: (value: number) => void;
  onBack: () => void;
  onSave: () => void;
  onEdit?: () => void;
};

export function PlanReviewPage({
  planLabel,
  planningWindow,
  referencePeriod,
  conversionType,
  channelCount,
  referenceBudgetTotal,
  baselineSalesForecast,
  optimizationMode,
  metricMode,
  goalType,
  totalSalesGoal,
  pacingEnabled,
  tactics,
  onOptimizationModeChange,
  onMetricModeChange,
  onBaselineChange,
  onBack,
  onSave,
  onEdit,
}: Props) {
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [editingBaseline, setEditingBaseline] = useState(false);
  const [baselineDraft, setBaselineDraft] = useState(String(baselineSalesForecast));

  const goalHint =
    goalType === "incremental-sales"
      ? "This will maximize sales"
      : goalType === "target-budget"
        ? "Stay within your target budget"
        : goalType === "total-sales"
          ? `Reach ${formatBudget(totalSalesGoal || baselineSalesForecast)} in total sales`
          : "This will maximize incremental ROAS";

  const commitBaseline = () => {
    const n = Number(baselineDraft.replace(/,/g, ""));
    if (n > 0) onBaselineChange(n);
    setEditingBaseline(false);
  };

  return (
    <div className={styles.page} data-node-id="11257:36058">
      {!bannerDismissed && (
        <div className={styles.successBanner} role="status">
          <p>
            Here is your new budget plan! Review it and make any changes before
            saving.
          </p>
          <button
            type="button"
            className={styles.bannerClose}
            aria-label="Dismiss"
            onClick={() => setBannerDismissed(true)}
          >
            <CloseIcon size={16} />
          </button>
        </div>
      )}

      <header className={styles.planHeader}>
        <h1>{planLabel}</h1>
        <div className={styles.chipRow}>
          <SummaryChip label="Planning Period" value={planningWindow} />
          <span className={styles.chipDivider} aria-hidden />
          <SummaryChip label="Reference Period" value={referencePeriod} />
          <span className={styles.chipDivider} aria-hidden />
          <SummaryChip label="Conversion Type" value={conversionType} />
          <SummaryChip label="Channels" value={`${channelCount} channels`} />
          <SummaryChip label="Segments" value="All segments" />
          {onEdit && (
            <button type="button" className={styles.editBtn} onClick={onEdit}>
              <EditIcon size={14} />
              Edit
            </button>
          )}
        </div>
        {pacingEnabled && (
          <p className={styles.pacingNote}>Pacing enabled for this plan</p>
        )}
        <p className={styles.goalNote}>
          Goal: {goalTypeLabel(goalType)}
        </p>
      </header>

      <div className={styles.body}>
        <section className={styles.settingsCard}>
          <h2>Optimization settings</h2>
          <div className={styles.settingsGrid}>
            <div className={styles.statBlock}>
              <span className={styles.statLabel}>Total Reference Budget</span>
              <span className={styles.statValue}>
                {formatBudget(referenceBudgetTotal)}
              </span>
              <span className={styles.statHint}>From the reference period</span>
            </div>
            <div className={styles.statBlock}>
              <span className={styles.statLabel}>Baseline Sales Forecast</span>
              <div className={styles.baselineRow}>
                {editingBaseline ? (
                  <input
                    type="text"
                    className={styles.baselineInput}
                    value={baselineDraft}
                    onChange={(e) => setBaselineDraft(e.target.value)}
                    onBlur={commitBaseline}
                    onKeyDown={(e) => e.key === "Enter" && commitBaseline()}
                    autoFocus
                  />
                ) : (
                  <span className={styles.statValue}>
                    {formatBudget(baselineSalesForecast)}
                  </span>
                )}
                <button
                  type="button"
                  className={styles.iconBtn}
                  aria-label="Edit baseline forecast"
                  onClick={() => {
                    setBaselineDraft(String(baselineSalesForecast));
                    setEditingBaseline(true);
                  }}
                >
                  <EditIcon size={14} />
                </button>
              </div>
              <span className={styles.statHint}>For the planning period</span>
            </div>
            <div className={styles.toggleBlock}>
              <span className={styles.statLabel}>Optimization Mode</span>
              <div className={styles.toggle} role="group" aria-label="Optimization mode">
                <button
                  type="button"
                  className={
                    optimizationMode === "balanced"
                      ? styles.toggleActive
                      : styles.toggleOption
                  }
                  onClick={() => onOptimizationModeChange("balanced")}
                >
                  Balanced
                </button>
                <button
                  type="button"
                  className={
                    optimizationMode === "maximized"
                      ? styles.toggleActive
                      : styles.toggleOption
                  }
                  onClick={() => onOptimizationModeChange("maximized")}
                >
                  Maximized
                </button>
              </div>
              <span className={styles.statHint}>
                Changes will not exceed more than 50%
              </span>
            </div>
            <div className={styles.toggleBlock}>
              <span className={styles.statLabel}>Optimizing for</span>
              <div className={styles.toggle} role="group" aria-label="Metric">
                <button
                  type="button"
                  className={
                    metricMode === "roas"
                      ? styles.toggleActive
                      : styles.toggleOption
                  }
                  onClick={() => onMetricModeChange("roas")}
                >
                  ROAS
                </button>
                <button
                  type="button"
                  className={
                    metricMode === "cpo"
                      ? styles.toggleActive
                      : styles.toggleOption
                  }
                  onClick={() => onMetricModeChange("cpo")}
                >
                  CPO
                </button>
              </div>
              <span className={styles.statHint}>{goalHint}</span>
            </div>
          </div>
        </section>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.thTactic}>Tactic</th>
                <th>Reference Budget</th>
                <th>Budget Constraint</th>
              </tr>
            </thead>
            <tbody>
              {tactics.map((tactic) => (
                <tr key={tactic.id}>
                  <td className={styles.tdTactic}>
                    <img
                      src={tactic.logo}
                      alt=""
                      className={styles.tacticLogo}
                      width={20}
                      height={20}
                    />
                    <span>{tactic.name}</span>
                  </td>
                  <td>{formatBudget(tactic.budgetOld)}</td>
                  <td>
                    <span
                      className={
                        tactic.locked
                          ? styles.constraintCapped
                          : styles.constraintOptimized
                      }
                    >
                      {tactic.locked ? "Capped" : "Optimized"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <footer className={styles.footer}>
        <button type="button" className={styles.backBtn} onClick={onBack}>
          Back
        </button>
        <button type="button" className={styles.saveBtn} onClick={onSave}>
          Save
        </button>
      </footer>
    </div>
  );
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.chipGroup}>
      <span className={styles.chipLabel}>{label}</span>
      <span className={styles.chipValue}>{value}</span>
    </div>
  );
}
