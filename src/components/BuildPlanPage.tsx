import { useEffect, useRef, useState, type ReactNode } from "react";
import type { CreatePlanInput, PlanTarget } from "../mpo/types";
import { BUILD_TACTICS, CT_GROUPS, PLAN_TYPE_OPTIONS, TARGET_OPTIONS } from "../mpo/buildPlan/data";
import { BUDGET_TEMPLATE_FILENAME } from "../mpo/buildPlan/budgetTemplateData";
import {
  activeWindow,
  buildPlanToCreatePlanInput,
  channelFilterLabel,
  channelsPresent,
  ctSummary,
  defaultBudgetFor,
  downloadBudgetTemplate,
  excludeReason,
  includedCount,
  includedTotal,
  periodLabel,
  planDaysFor,
  referenceTargetDefault,
  targetLabel,
  targetNeedsValue,
  visibleTactics,
} from "../mpo/buildPlan/logic";
import { currencyFormatter, formatShortDate } from "../mpo/buildPlan/data";
import { useBuildPlanFlow } from "../mpo/buildPlan/useBuildPlanFlow";
import type { BuildPlanState, BuildScreen } from "../mpo/buildPlan/types";
import { CalendarRangePicker } from "./CalendarRangePicker";
import {
  BackArrowIcon,
  CheckIcon,
  ChevronDownIcon,
  DownloadIcon,
  EditIcon,
  FileIcon,
  HistoryIcon,
  InfoIcon,
  MoreIcon,
  ResetIcon,
  SearchIcon,
  UploadIcon,
} from "./icons/BuildPlanIcons";
import { CloseIcon } from "./icons/CloseIcon";
import styles from "./BuildPlanPage.module.css";

type Props = {
  onComplete: (input: CreatePlanInput, rawState: BuildPlanState) => void;
  onExit: () => void;
  initialState?: BuildPlanState;
  onScreenChange?: (screen: BuildScreen) => void;
};

const TARGET_FIELD_LABEL: Record<Exclude<PlanTarget, null>, string> = {
  "incremental-sales": "Target incremental sales",
  "incremental-orders": "Target incremental orders",
  "incremental-roas": "Target incremental ROAS",
  "incremental-cpo": "Target incremental CPO",
};

function Card({
  eyebrow,
  title,
  desc,
  children,
  footer,
}: {
  eyebrow?: string;
  title?: string;
  desc?: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className={styles.card}>
      {(eyebrow || title || desc) && (
        <div className={styles.cardHead}>
          {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
          {title && <h1>{title}</h1>}
          {desc && <p>{desc}</p>}
        </div>
      )}
      <div className={styles.cardBody}>{children}</div>
      <div className={styles.cardFoot}>{footer}</div>
    </div>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={styles.backLink} onClick={onClick}>
      <BackArrowIcon size={20} />
      Back
    </button>
  );
}

function BudgetInput({
  value,
  defaultValue,
  disabled,
  edited,
  onChange,
  onReset,
}: {
  value: number | null;
  defaultValue: number | null;
  disabled: boolean;
  edited: boolean;
  onChange: (value: number | null) => void;
  onReset: () => void;
}) {
  const [text, setText] = useState(value != null ? value.toLocaleString("en-US") : "");
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!isEditing) {
    return (
      <button
        type="button"
        className={styles.bvalue}
        disabled={disabled}
        onClick={() => {
          setIsEditing(true);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
      >
        <span className={styles.bvalueText}>{text ? `$${text}` : "Add budget"}</span>
        <span className={styles.bvalueEditIcon}>
          <EditIcon size={20} />
        </span>
      </button>
    );
  }

  return (
    <div className={styles.binputWrap}>
      <span className={styles.dol}>$</span>
      <input
        ref={inputRef}
        className={styles.binput}
        inputMode="numeric"
        disabled={disabled}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const n = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10);
          onChange(isNaN(n) ? null : n);
        }}
        onBlur={() => {
          const n = parseInt(text.replace(/[^0-9]/g, ""), 10);
          setText(isNaN(n) ? "" : n.toLocaleString("en-US"));
          setIsEditing(false);
        }}
      />
      <button
        type="button"
        className={styles.resetBtn}
        disabled={!edited}
        aria-label="Reset to default budget"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          onReset();
          setText(defaultValue != null ? defaultValue.toLocaleString("en-US") : "");
          setIsEditing(false);
        }}
      >
        <ResetIcon size={20} />
      </button>
    </div>
  );
}

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

export function BuildPlanPage({ onComplete, onExit, initialState, onScreenChange }: Props) {
  const flow = useBuildPlanFlow(initialState);
  const { state } = flow;
  const [moreOpen, setMoreOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onScreenChange?.(state.screen);
  }, [state.screen, onScreenChange]);

  const selectTarget = (id: PlanTarget) => {
    flow.setTarget(id);
    flow.setTargetValue(referenceTargetDefault(state, id));
  };

  return (
    <div
      className={`${styles.page} ${state.screen === "review" ? styles.pageReview : ""}`}
      data-node-id="build-plan-page"
    >
      <div className={`${styles.topBar} ${state.screen === "review" ? styles.topBarReview : ""}`}>
        {state.screen === "review" ? (
          <>
            <h1 className={styles.reviewPageTitle}>Review plan</h1>
            <button type="button" className={styles.plainCloseBtn} onClick={onExit} aria-label="Exit setup">
              <CloseIcon size={20} />
            </button>
          </>
        ) : (
          <button type="button" className={styles.exitBtn} onClick={onExit}>
            <CloseIcon size={20} />
            Exit setup
          </button>
        )}
      </div>

      {state.screen === "plan-type" && (
        <Card
          eyebrow="Plan type"
          title="What would you like to do?"
          desc="Choose how you want to approach this plan."
          footer={<span />}
        >
          <div className={styles.methods}>
            {PLAN_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={styles.methodCard}
                onClick={() => flow.choosePlanType(opt.id)}
              >
                <h3>{opt.label}</h3>
                <p>{opt.desc}</p>
              </button>
            ))}
          </div>
        </Card>
      )}

      {state.screen === "period" && (
        <Card
          eyebrow="Planning period"
          title="What period are you planning for?"
          desc="Set the plan's date range first. We'll match its length when pulling past spend."
          footer={
            <>
              <BackLink onClick={flow.back} />
              <span className={styles.dayCount}>{periodLabel(state)} · {planDaysFor(state)} days</span>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLg}`} onClick={flow.continueFromPeriod}>
                Continue
              </button>
            </>
          }
        >
          <CalendarRangePicker start={state.planStart} end={state.planEnd} onChange={flow.setPeriod} panels={2} />
        </Card>
      )}

      {state.screen === "target" && (
        <Card
          eyebrow="Target"
          title="Enter a target outcome"
          desc="You can always change this later."
          footer={
            <>
              <BackLink onClick={flow.back} />
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLg}`}
                disabled={!state.target || (targetNeedsValue(state.target) && !(state.targetValue! > 0))}
                onClick={flow.continueFromTarget}
              >
                Continue
              </button>
            </>
          }
        >
          <div className={styles.group}>
            {TARGET_OPTIONS.map((opt) => (
              <div key={opt.id}>
                <label className={styles.optRow}>
                  <input
                    type="radio"
                    name="plan-target"
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
        </Card>
      )}

      {state.screen === "ct" && (
        <Card
          eyebrow="Conversion type"
          title="Select conversion type"
          desc="Pick one baseline or roll-up type, or combine attributes into a custom view."
          footer={
            <>
              <BackLink onClick={flow.back} />
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLg}`}
                disabled={!state.singleCT && state.attrs.length === 0}
                onClick={flow.continueFromCT}
              >
                Continue
              </button>
            </>
          }
        >
          {CT_GROUPS.map((group) => (
            <div className={styles.group} key={group.group}>
              <p className={styles.groupLabel}>
                {group.label} <span className={styles.sub}>· {group.sub}</span>
              </p>
              {group.items.map((item) => {
                const selected =
                  group.selectionType === "single"
                    ? state.singleCT === item.id
                    : state.attrs.includes(item.id);
                return (
                  <label key={item.id} className={styles.optRow}>
                    <input
                      type={group.selectionType === "single" ? "radio" : "checkbox"}
                      name="ct-group"
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
        </Card>
      )}

      {state.screen === "method" && (
        <Card
          eyebrow="Add budget"
          title="Add budget"
          desc="Bring in spend by tactic from a spreadsheet, or start from a past period's actuals."
          footer={
            <>
              <BackLink onClick={flow.back} />
              <span />
            </>
          }
        >
          <div className={styles.methods}>
            <button type="button" className={styles.methodCard} onClick={() => flow.chooseMethod("upload")}>
              <div className={styles.methodIcon}>
                <UploadIcon size={20} />
              </div>
              <h3>Upload budget</h3>
              <p>Download the template, fill in spend per tactic, and upload it back.</p>
            </button>
            <button type="button" className={styles.methodCard} onClick={() => flow.chooseMethod("fetch")}>
              <div className={styles.methodIcon}>
                <HistoryIcon size={20} />
              </div>
              <h3>Fetch from past period</h3>
              <p>Use a prior period's actual spend as your starting budget.</p>
            </button>
          </div>
        </Card>
      )}

      {state.screen === "upload" && (
        <Card
          eyebrow="Add budget · Upload"
          title="Upload your budget"
          desc="Start from the template so every tactic maps cleanly on the way back in."
          footer={
            <>
              <BackLink onClick={flow.back} />
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLg}`}
                disabled={state.source !== "upload-ready"}
                onClick={flow.continueFromUpload}
              >
                Review tactics
              </button>
            </>
          }
        >
          <div className={styles.templateRow}>
            <div className={styles.ti}>
              <FileIcon size={18} />
            </div>
            <div className={styles.tt}>
              <strong>{BUDGET_TEMPLATE_FILENAME}</strong>
              <span>{BUILD_TACTICS.length} tactics · Tactic, Channel, Budget columns</span>
            </div>
            <button type="button" className={styles.btn} onClick={downloadBudgetTemplate}>
              <DownloadIcon size={20} /> Download
            </button>
          </div>
          <div
            className={`${styles.dropzone} ${state.source === "upload-ready" ? styles.dropzoneFilled : ""}`}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.csv"
              className={styles.visuallyHidden}
              onChange={() => flow.markUploadFilled()}
            />
            <div className={styles.dzIcon}>
              {state.source === "upload-ready" ? <CheckIcon size={20} /> : <UploadIcon size={20} />}
            </div>
            <div className={styles.dzTitle}>
              {state.source === "upload-ready" ? "budget_plan.xlsx uploaded" : "Drop your completed .xlsx here"}
            </div>
            <div className={styles.dzSub}>
              {state.source === "upload-ready" ? "9 of 9 tactics matched" : "or click to browse"}
            </div>
          </div>
        </Card>
      )}

      {state.screen === "review" && (
        <ReviewScreen
          state={state}
          flow={flow}
          moreOpen={moreOpen}
          setMoreOpen={setMoreOpen}
          onComplete={() => onComplete(buildPlanToCreatePlanInput(state), state)}
          onExit={onExit}
        />
      )}
    </div>
  );
}

function ReviewScreen({
  state,
  flow,
  moreOpen,
  setMoreOpen,
  onComplete,
  onExit,
}: {
  state: ReturnType<typeof useBuildPlanFlow>["state"];
  flow: ReturnType<typeof useBuildPlanFlow>;
  moreOpen: boolean;
  setMoreOpen: (v: boolean) => void;
  onComplete: () => void;
  onExit: () => void;
}) {
  const rows = visibleTactics(state);
  const n = planDaysFor(state);
  const [dateOpen, setDateOpen] = useState(false);
  const [channelOpen, setChannelOpen] = useState(false);
  const [budgetMenuOpen, setBudgetMenuOpen] = useState(false);
  const srcWindow = activeWindow(state);
  const allChannels = channelsPresent();
  const { label: ctLabel, attrLabels } = ctSummary(state);
  const conversionTypeLabel = attrLabels.length ? attrLabels.join(" + ") : ctLabel;
  const includedVisibleCount = rows.filter((t) => state.included[t.id]).length;
  const allVisibleIncluded = rows.length > 0 && includedVisibleCount === rows.length;
  const someVisibleIncluded = includedVisibleCount > 0 && includedVisibleCount < rows.length;
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someVisibleIncluded;
    }
  }, [someVisibleIncluded]);

  return (
    <>
      <div className={styles.summaryBar}>
        <span className={styles.summaryItem}>
          Planning for <strong>{periodLabel(state)}</strong>
        </span>
        <span className={styles.summaryDivider} aria-hidden />
        <span className={styles.summaryItem}>
          Target <strong>{targetLabel(state)}</strong>
        </span>
        <span className={styles.summaryDivider} aria-hidden />
        <span className={styles.summaryItem}>
          Conversion type <strong>{conversionTypeLabel}</strong>
        </span>
        <span className={styles.summaryDivider} aria-hidden />
        <span className={styles.summaryItem}>
          Budget{" "}
          {state.method === "fetch" ? (
            <span className={styles.dateDropdown}>
              <button type="button" className={styles.dateDropdownBtn} onClick={() => setDateOpen((v) => !v)}>
                <strong>
                  {formatShortDate(srcWindow.start)} – {formatShortDate(srcWindow.end)}
                </strong>
                <ChevronDownIcon size={14} />
              </button>
              {dateOpen && (
                <div className={styles.dateDropdownPanel}>
                  <CalendarRangePicker
                    start={srcWindow.start}
                    end={srcWindow.end}
                    onChange={(start) => {
                      flow.setSourceStart(start);
                      setDateOpen(false);
                    }}
                    panels={1}
                    mode="fixed-length"
                    fixedLengthDays={n}
                  />
                  <div className={styles.periodNote}>
                    <InfoIcon size={16} />
                    <span>
                      Same {n} days as your plan. Tactics with no spend in the last year are excluded by default.
                    </span>
                  </div>
                </div>
              )}
            </span>
          ) : (
            <strong className={styles.fileInlineName} title={state.source}>
              {state.source}
            </strong>
          )}
        </span>
        {state.method === "upload" && (
          <div className={styles.moreWrap}>
            <button
              type="button"
              className={styles.plainIconBtn}
              aria-label="More options"
              onClick={() => setMoreOpen(!moreOpen)}
            >
              <MoreIcon size={20} />
            </button>
            {moreOpen && (
              <div className={styles.moreMenu}>
                <button
                  type="button"
                  onClick={() => {
                    downloadBudgetTemplate();
                    setMoreOpen(false);
                  }}
                >
                  Download template
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <Card
      footer={
        <div className={styles.footerActions}>
          <button type="button" className={styles.btn} onClick={onExit}>
            Cancel
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLg}`} onClick={onComplete}>
            Create plan
          </button>
        </div>
      }
    >
      <div className={styles.reviewToolbar}>
        <h2 className={styles.reviewTitle}>Confirm tactics and budget</h2>
        <div className={styles.reviewToolbarControls}>
        <div className={styles.search}>
          <SearchIcon size={17} />
          <input
            placeholder="Search tactics"
            value={state.query}
            onChange={(e) => flow.setQuery(e.target.value)}
          />
        </div>

        <div className={styles.channelDropdown}>
          <button
            type="button"
            className={styles.channelDropdownBtn}
            onClick={() => setChannelOpen((v) => !v)}
          >
            <span>{channelFilterLabel(state)}</span>
            <ChevronDownIcon size={20} />
          </button>
          {channelOpen && (
            <div className={styles.channelDropdownPanel}>
              {allChannels.map((c) => (
                <label key={c} className={styles.channelOption}>
                  <input
                    type="checkbox"
                    checked={state.channels.includes(c)}
                    onChange={() => flow.toggleChannel(c)}
                  />
                  <span>{c}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>

      <div className={styles.tbl}>
        <div className={styles.tblHead}>
          <div className={styles.tblHeadTactic}>
            <label className={styles.inc}>
              <input
                ref={headerCheckboxRef}
                type="checkbox"
                checked={allVisibleIncluded}
                onChange={() => flow.setIncludedForIds(rows.map((t) => t.id), !allVisibleIncluded)}
              />
              <span className={styles.incBox}>
                {allVisibleIncluded ? (
                  <CheckIcon size={12} />
                ) : someVisibleIncluded ? (
                  <span className={styles.incBoxDash} />
                ) : null}
              </span>
            </label>
            <span>Tactic</span>
          </div>
          <div className={styles.tblHeadBudget}>
            <span>Budget</span>
            <div className={styles.moreWrap}>
              <button
                type="button"
                className={styles.tblHeadMenuBtn}
                aria-label="Budget column options"
                onClick={() => setBudgetMenuOpen((v) => !v)}
              >
                <MoreIcon size={20} />
              </button>
              {budgetMenuOpen && (
                <div className={styles.moreMenu}>
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
          <div className={styles.emptyRow}>No tactics match your search or filter.</div>
        ) : (
          rows.map((t) => {
            const included = state.included[t.id];
            const edited = state.overridden[t.id];
            const reason = excludeReason(state, t.id);
            return (
              <div key={t.id} className={`${styles.trow} ${included ? "" : styles.trowExcluded}`}>
                <div className={styles.tcell}>
                  <label className={styles.inc}>
                    <input
                      type="checkbox"
                      checked={Boolean(included)}
                      onChange={() => flow.toggleInclude(t.id)}
                    />
                    <span className={styles.incBox}>{included && <CheckIcon size={12} />}</span>
                  </label>
                  <div className={styles.tinfo}>
                    <div className={styles.tname}>
                      {t.name}
                      {edited && included && <span className={styles.editedTag}>edited</span>}
                      {reason === "no-budget-in-file" && <span className={styles.reason}>no budget in file</span>}
                      {reason === "no-spend-12mo" && <span className={styles.reason}>no spend in 12+ mo</span>}
                    </div>
                    <div className={styles.tch}>{t.channel}</div>
                  </div>
                </div>
                <BudgetInput
                  value={state.budget[t.id] ?? null}
                  defaultValue={defaultBudgetFor(state, t.id)}
                  disabled={!included}
                  edited={Boolean(edited)}
                  onChange={(v) => flow.setBudget(t.id, v)}
                  onReset={() => flow.resetBudget(t.id)}
                />
              </div>
            );
          })
        )}
        <div className={styles.tblFoot}>
          <span className={styles.flabel}>
            {includedCount(state)} of {BUILD_TACTICS.length} tactics included
          </span>
          <span className={styles.fval}>{currencyFormatter.format(includedTotal(state))}</span>
        </div>
      </div>
      </Card>
    </>
  );
}

