import { useRef, useState } from "react";
import type { Plan, PlanTarget } from "../mpo/types";
import { BUDGET_TEMPLATE_FILENAME } from "../mpo/buildPlan/budgetTemplateData";
import { BUILD_TACTICS, DAILY_RATE, TARGET_OPTIONS } from "../mpo/buildPlan/data";
import { downloadBudgetTemplate, targetNeedsValue } from "../mpo/buildPlan/logic";
import { CalendarRangePicker } from "./CalendarRangePicker";
import bp from "./BuildPlanPage.module.css";
import { CheckIcon, DownloadIcon, FileIcon, UploadIcon } from "./icons/BuildPlanIcons";
import { CloseIcon } from "./icons/CloseIcon";
import { MaterialIcon } from "./icons/MaterialIcon";
import styles from "./SidebarEditPlanPage.module.css";

type SectionKey = "period" | "goal" | "budget" | "tactics";

const SECTIONS: { key: SectionKey; label: string; icon: string }[] = [
  { key: "period", label: "Plan period", icon: "calendar_month" },
  { key: "goal", label: "Goal & target", icon: "trending_up" },
  { key: "budget", label: "Budget", icon: "file_upload" },
  { key: "tactics", label: "Tactics", icon: "description" },
];

type Props = {
  plan: Plan;
  onExit: () => void;
};

export function SidebarEditPlanPage({ plan, onExit }: Props) {
  const [active, setActive] = useState<SectionKey>("period");
  const [periodStart, setPeriodStart] = useState(plan.planStart);
  const [periodEnd, setPeriodEnd] = useState(plan.planEnd);
  const [target, setTarget] = useState<PlanTarget>(plan.target);
  const [targetValue, setTargetValue] = useState<number | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [included, setIncluded] = useState<Set<string>>(() => new Set(BUILD_TACTICS.map((t) => t.id)));

  const toggleTactic = (id: string) => {
    setIncluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button type="button" className={styles.plainCloseBtn} onClick={onExit} aria-label="Exit setup">
          <CloseIcon size={20} />
        </button>
        <div className={styles.topBarText}>
          <span className={styles.eyebrow}>Edit plan</span>
          <h1>{plan.label}</h1>
        </div>
      </div>

      <div className={styles.layout}>
        <nav className={styles.sidebar}>
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              type="button"
              className={active === s.key ? `${styles.sidebarItem} ${styles.sidebarItemActive}` : styles.sidebarItem}
              onClick={() => setActive(s.key)}
            >
              <MaterialIcon name={s.icon} size={20} />
              {s.label}
            </button>
          ))}
        </nav>

        <div className={styles.content}>
          {active === "period" && (
            <div className={styles.panelCard}>
              <h2 className={styles.panelTitle}>Plan period</h2>
              <p className={styles.panelDesc}>Choose the date range this plan covers.</p>
              <CalendarRangePicker
                start={periodStart}
                end={periodEnd}
                onChange={(s, e) => {
                  setPeriodStart(s);
                  setPeriodEnd(e);
                }}
                panels={2}
              />
            </div>
          )}

          {active === "goal" && (
            <div className={styles.panelCard}>
              <h2 className={styles.panelTitle}>Goal &amp; target</h2>
              <p className={styles.panelDesc}>What outcome should this plan optimize toward?</p>
              <div className={bp.group}>
                {TARGET_OPTIONS.map((opt) => (
                  <div key={opt.id}>
                    <label className={bp.optRow}>
                      <input
                        type="radio"
                        name="sidebar-plan-target"
                        className={bp.optInput}
                        checked={target === opt.id}
                        onChange={() => setTarget(opt.id)}
                      />
                      <span className={bp.optTitle}>{opt.label}</span>
                    </label>
                    {target === opt.id && targetNeedsValue(target) && (
                      <div className={bp.targetField}>
                        <input
                          type="number"
                          className={styles.simpleInput}
                          placeholder="Enter target value"
                          value={targetValue ?? ""}
                          onChange={(e) => setTargetValue(e.target.value ? Number(e.target.value) : null)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === "budget" && (
            <div className={styles.panelCard}>
              <h2 className={styles.panelTitle}>Upload budget</h2>
              <p className={styles.panelDesc}>
                Start from the template so every tactic maps cleanly on the way back in.
              </p>
              <div className={bp.templateRow}>
                <div className={bp.ti}>
                  <FileIcon size={18} />
                </div>
                <div className={bp.tt}>
                  <strong>{BUDGET_TEMPLATE_FILENAME}</strong>
                  <span>{BUILD_TACTICS.length} tactics · Tactic, Channel, Budget columns</span>
                </div>
                <button type="button" className={styles.templateBtn} onClick={downloadBudgetTemplate}>
                  <DownloadIcon size={20} /> Download
                </button>
              </div>
              <div
                className={uploaded ? `${bp.dropzone} ${bp.dropzoneFilled}` : bp.dropzone}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.csv"
                  className={bp.visuallyHidden}
                  onChange={() => setUploaded(true)}
                />
                <div className={bp.dzIcon}>{uploaded ? <CheckIcon size={20} /> : <UploadIcon size={20} />}</div>
                <div className={bp.dzTitle}>
                  {uploaded ? "budget_plan.xlsx uploaded" : "Drop your completed .xlsx here"}
                </div>
                <div className={bp.dzSub}>
                  {uploaded ? `${BUILD_TACTICS.length} of ${BUILD_TACTICS.length} tactics matched` : "or click to browse"}
                </div>
              </div>
            </div>
          )}

          {active === "tactics" && (
            <div className={styles.panelCard}>
              <h2 className={styles.panelTitle}>Confirm tactics</h2>
              <p className={styles.panelDesc}>
                {included.size} of {BUILD_TACTICS.length} tactics included
              </p>
              <div className={styles.tacticsList}>
                {BUILD_TACTICS.map((t) => {
                  const budget = Math.round((DAILY_RATE[t.id] ?? 0) * 30);
                  return (
                    <label key={t.id} className={styles.tacticRow}>
                      <input
                        type="checkbox"
                        className={styles.tacticCheck}
                        checked={included.has(t.id)}
                        onChange={() => toggleTactic(t.id)}
                      />
                      <span className={styles.tacticInfo}>
                        <span className={styles.tacticName}>{t.name}</span>
                        <span className={styles.tacticChannel}>{t.channel}</span>
                      </span>
                      <span className={styles.tacticBudget}>${budget.toLocaleString()}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.footer}>
        <button type="button" className={styles.cancelBtn} onClick={onExit}>
          Cancel
        </button>
        <button type="button" className={styles.saveBtn} onClick={onExit}>
          Save changes
        </button>
      </div>
    </div>
  );
}
