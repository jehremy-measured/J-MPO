import { useMemo, useState } from "react";
import type { Plan } from "../mpo/types";
import { formatRangeLabel } from "../mpo/buildPlan/dateUtils";
import { BUDGET_TEMPLATE_FILENAME } from "../mpo/buildPlan/budgetTemplateData";
import { BUILD_TACTICS, CT_GROUPS, TARGET_OPTIONS } from "../mpo/buildPlan/data";
import { currencyFormatter } from "../mpo/buildPlan/data";
import {
  applyMethodChoice,
  channelFilterLabel,
  channelsPresent,
  ctSummary,
  downloadBudgetTemplate,
  excludeReason,
  formatTargetLabel,
  includedCount,
  includedTotal,
  targetNeedsValue,
  visibleTactics,
} from "../mpo/buildPlan/logic";
import { BudgetInput } from "./BuildPlanPage";
import { RollupHint } from "./RollupHint";
import bp from "./BuildPlanPage.module.css";
import { defaultBuildPlanState, useBuildPlanFlow } from "../mpo/buildPlan/useBuildPlanFlow";
import { CalendarRangePicker } from "./CalendarRangePicker";
import { Checkbox } from "./Checkbox";
import { ChevronDownIcon, DownloadIcon, FileIcon, MoreIcon, ResetIcon, SearchIcon, UploadIcon } from "./icons/BuildPlanIcons";
import { CloseIcon } from "./icons/CloseIcon";
import { MaterialIcon } from "./icons/MaterialIcon";
import styles from "./SidebarEditPlanPage.module.css";

type SectionKey = "period" | "goal" | "ct" | "budget" | "tactics";

type Props = {
  plan: Plan;
  onExit: () => void;
};

function seedFromPlan(plan: Plan) {
  const seed = defaultBuildPlanState();
  seed.planStart = plan.planStart;
  seed.planEnd = plan.planEnd;
  seed.target = plan.target;
  seed.singleCT = "total";
  return applyMethodChoice(seed, "fetch");
}

export function SidebarEditPlanPage({ plan, onExit }: Props) {
  const [active, setActive] = useState<SectionKey>("period");
  const flow = useBuildPlanFlow(useMemo(() => seedFromPlan(plan), [plan]));
  const { state } = flow;
  const [channelOpen, setChannelOpen] = useState(false);
  const [budgetMenuOpen, setBudgetMenuOpen] = useState(false);

  const rows = visibleTactics(state);
  const includedVisibleCount = rows.filter((t) => state.included[t.id]).length;
  const allVisibleIncluded = rows.length > 0 && includedVisibleCount === rows.length;
  const someVisibleIncluded = includedVisibleCount > 0 && includedVisibleCount < rows.length;
  const allChannels = channelsPresent();
  const { label: ctLabel, attrLabels } = ctSummary(state);
  const conversionTypeLabel = attrLabels.length ? attrLabels.join(" + ") : ctLabel || "Not set";

  const SECTIONS: { key: SectionKey; label: string; icon: string; summary: string }[] = [
    {
      key: "period",
      label: "Plan period",
      icon: "calendar_month",
      summary: formatRangeLabel(state.planStart, state.planEnd),
    },
    {
      key: "goal",
      label: "Target outcome",
      icon: "trending_up",
      summary: formatTargetLabel(state.target, state.targetValue),
    },
    { key: "ct", label: "Conversion type", icon: "description", summary: conversionTypeLabel },
    {
      key: "budget",
      label: "Budget",
      icon: "file_upload",
      summary: state.source === "upload-ready" ? "Uploaded" : "Not uploaded",
    },
    {
      key: "tactics",
      label: "Tactics",
      icon: "grid_view",
      summary: `${includedCount(state)} of ${BUILD_TACTICS.length} included`,
    },
  ];

  return (
    <div className={styles.page}>
      <div className={`${bp.topBar} ${bp.topBarReview} ${styles.topBarOverride}`}>
        <h1 className={bp.reviewPageTitle}>{plan.label}</h1>
        <button type="button" className={bp.plainCloseBtn} onClick={onExit} aria-label="Exit setup">
          <CloseIcon size={20} />
        </button>
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
              <MaterialIcon name={s.icon} size={20} className={styles.sidebarIcon} />
              <span className={styles.sidebarItemText}>
                <span className={styles.sidebarItemLabel}>{s.label}</span>
                <span className={styles.sidebarItemSummary}>{s.summary}</span>
              </span>
            </button>
          ))}
        </nav>

        <div className={styles.content}>
          {active === "period" && (
            <div className={styles.panelCard}>
              <h2 className={styles.panelTitle}>Plan period</h2>
              <p className={styles.panelDesc}>Choose the date range this plan covers.</p>
              <CalendarRangePicker start={state.planStart} end={state.planEnd} onChange={flow.setPeriod} panels={2} />
            </div>
          )}

          {active === "goal" && (
            <div className={styles.panelCard}>
              <h2 className={styles.panelTitle}>Target outcome</h2>
              <p className={styles.panelDesc}>What outcome are you working towards?</p>
              <div className={bp.group}>
                {TARGET_OPTIONS.map((opt) => (
                  <div key={opt.id}>
                    <label className={bp.optRow}>
                      <input
                        type="radio"
                        name="sidebar-plan-target"
                        className={bp.optInput}
                        checked={state.target === opt.id}
                        onChange={() => flow.setTarget(opt.id)}
                      />
                      <span className={bp.optTitle}>{opt.label}</span>
                    </label>
                    {state.target === opt.id && targetNeedsValue(state.target) && (
                      <div className={bp.targetField}>
                        <input
                          type="number"
                          className={styles.simpleInput}
                          placeholder="Enter target value"
                          value={state.targetValue ?? ""}
                          onChange={(e) => flow.setTargetValue(e.target.value ? Number(e.target.value) : null)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === "ct" && (
            <div className={styles.panelCard}>
              <h2 className={styles.panelTitle}>Conversion type</h2>
              <p className={styles.panelDesc}>
                Pick one baseline or roll-up type, or combine attributes into a custom view.
              </p>
              {CT_GROUPS.map((group) => (
                <div className={bp.group} key={group.group}>
                  <p className={bp.groupLabel}>{group.label}</p>
                  {group.items.map((item) => {
                    const selected =
                      group.selectionType === "single"
                        ? state.singleCT === item.id
                        : state.attrs.includes(item.id);
                    const onSelect = () =>
                      group.selectionType === "single" ? flow.toggleSingleCT(item.id) : flow.toggleAttr(item.id);
                    return (
                      <label key={item.id} className={bp.optRow}>
                        {group.selectionType === "single" ? (
                          <input
                            type="radio"
                            name="sidebar-ct-group"
                            className={bp.optInput}
                            checked={selected}
                            onChange={onSelect}
                          />
                        ) : (
                          <Checkbox checked={selected} onChange={onSelect} />
                        )}
                        <span className={bp.optTitle}>{item.name}</span>
                        <RollupHint item={item} />
                      </label>
                    );
                  })}
                </div>
              ))}
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
                className={state.source === "upload-ready" ? `${bp.dropzone} ${bp.dropzoneFilled}` : bp.dropzone}
                onClick={flow.markUploadFilled}
                role="button"
                tabIndex={0}
              >
                <div className={bp.dzIcon}>
                  {state.source === "upload-ready" ? <MaterialIcon name="check" size={20} /> : <UploadIcon size={20} />}
                </div>
                <div className={bp.dzTitle}>
                  {state.source === "upload-ready" ? "budget_plan.xlsx uploaded" : "Drop your completed .xlsx here"}
                </div>
                <div className={bp.dzSub}>
                  {state.source === "upload-ready"
                    ? `${BUILD_TACTICS.length} of ${BUILD_TACTICS.length} tactics matched`
                    : "or click to browse"}
                </div>
              </div>
            </div>
          )}

          {active === "tactics" && (
            <>
              <div className={styles.panelCardWide}>
                <div className={bp.reviewToolbar}>
                  <h2 className={styles.panelTitle}>Confirm tactics</h2>
                  <div className={bp.reviewToolbarControls}>
                    <div className={bp.search}>
                      <SearchIcon size={17} />
                      <input
                        placeholder="Search tactics"
                        value={state.query}
                        onChange={(e) => flow.setQuery(e.target.value)}
                      />
                    </div>
                    <div className={bp.channelDropdown}>
                      <button
                        type="button"
                        className={bp.channelDropdownBtn}
                        onClick={() => setChannelOpen((v) => !v)}
                      >
                        <span>{channelFilterLabel(state)}</span>
                        <ChevronDownIcon size={20} />
                      </button>
                      {channelOpen && (
                        <div className={bp.channelDropdownPanel}>
                          {allChannels.map((c) => (
                            <label key={c} className={bp.channelOption}>
                              <Checkbox checked={state.channels.includes(c)} onChange={() => flow.toggleChannel(c)} size={17} />
                              <span>{c}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.tacticsTable} style={{ maxHeight: "56vh" }}>
                  <div className={bp.tblHead}>
                    <div className={bp.tblHeadTactic}>
                      <Checkbox
                        checked={allVisibleIncluded}
                        indeterminate={someVisibleIncluded}
                        onChange={() => flow.setIncludedForIds(rows.map((t) => t.id), !allVisibleIncluded)}
                        ariaLabel="Select all tactics"
                      />
                      <span>Tactic</span>
                    </div>
                    <div className={bp.tblHeadBudget}>
                      <span>Budget</span>
                      <div className={bp.moreWrap}>
                        <button
                          type="button"
                          className={bp.tblHeadMenuBtn}
                          aria-label="Budget column options"
                          onClick={() => setBudgetMenuOpen((v) => !v)}
                        >
                          <MoreIcon size={20} />
                        </button>
                        {budgetMenuOpen && (
                          <div className={bp.moreMenu}>
                            <button
                              type="button"
                              onClick={() => {
                                flow.resetAllBudgets();
                                setBudgetMenuOpen(false);
                              }}
                            >
                              <ResetIcon size={20} /> Reset all budgets
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {rows.length === 0 ? (
                    <div className={bp.emptyRow}>No tactics match your search or filter.</div>
                  ) : (
                    rows.map((t) => {
                      const included = state.included[t.id];
                      const edited = state.overridden[t.id];
                      const reason = excludeReason(state, t.id);
                      return (
                        <div key={t.id} className={`${bp.trow} ${included ? "" : bp.trowExcluded}`}>
                          <div className={bp.tcell}>
                            <Checkbox
                              checked={Boolean(included)}
                              onChange={() => flow.toggleInclude(t.id)}
                              ariaLabel={`Include ${t.name}`}
                            />
                            <div className={bp.tinfo}>
                              <div className={bp.tname}>
                                {t.name}
                                {edited && included && <span className={bp.editedTag}>edited</span>}
                                {reason === "no-budget-in-file" && <span className={bp.reason}>no budget in file</span>}
                                {reason === "no-spend-12mo" && <span className={bp.reason}>no spend in 12+ mo</span>}
                              </div>
                              <div className={bp.tch}>{t.channel}</div>
                            </div>
                          </div>
                          <BudgetInput
                            value={state.budget[t.id] ?? null}
                            defaultValue={state.budget[t.id] ?? null}
                            disabled={!included}
                            edited={Boolean(edited)}
                            onChange={(v) => flow.setBudget(t.id, v)}
                            onReset={() => flow.resetBudget(t.id)}
                          />
                        </div>
                      );
                    })
                  )}
                  <div className={bp.tblFoot}>
                    <span className={bp.flabel}>
                      {includedCount(state)} of {BUILD_TACTICS.length} tactics included
                    </span>
                    <span className={bp.fval}>{currencyFormatter.format(includedTotal(state))}</span>
                  </div>
                </div>
              </div>
            </>
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
