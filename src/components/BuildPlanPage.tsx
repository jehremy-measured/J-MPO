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
  formatAttrLabels,
  includedCount,
  includedTotal,
  periodLabel,
  planDaysFor,
  referenceTargetDefault,
  targetNeedsValue,
  visibleTactics,
} from "../mpo/buildPlan/logic";
import { currencyFormatter, formatShortDate } from "../mpo/buildPlan/data";
import { useBuildPlanFlow } from "../mpo/buildPlan/useBuildPlanFlow";
import type { BuildPlanState, BuildScreen } from "../mpo/buildPlan/types";
import { CalendarRangePicker } from "./CalendarRangePicker";
import { Checkbox } from "./Checkbox";
import { RollupHint } from "./RollupHint";
import {
  BackArrowIcon,
  CheckIcon,
  ChevronDownIcon,
  DownloadIcon,
  EditIcon,
  FileIcon,
  HistoryIcon,
  MoreIcon,
  ResetIcon,
  SearchIcon,
  UploadIcon,
} from "./icons/BuildPlanIcons";
import { CloseIcon } from "./icons/CloseIcon";
import { MaterialIcon } from "./icons/MaterialIcon";
import styles from "./BuildPlanPage.module.css";

type Props = {
  onComplete: (input: CreatePlanInput, rawState: BuildPlanState) => void;
  onExit: () => void;
  initialState?: BuildPlanState;
  onScreenChange?: (screen: BuildScreen) => void;
  /** "edit" is used when opening the review screen to change an existing plan's
   * settings (title becomes "Plan settings", the summary bar switches to labeled
   * fields, and the finish button reads "Save" instead of "Create plan"). */
  mode?: "create" | "edit";
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

export function BudgetInput({
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
        <span className={styles.bvalueEditIcon}>
          <EditIcon size={20} />
        </span>
        <span className={styles.bvalueText}>{text ? `$${text}` : "Add budget"}</span>
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
  defaultValue,
  onChange,
}: {
  target: Exclude<PlanTarget, null>;
  value: number | null;
  defaultValue: number | null;
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
  const edited = value !== defaultValue;

  const [text, setText] = useState(value == null ? "" : isInteger ? value.toLocaleString("en-US") : String(value));

  return (
    <div>
      <div className={styles.targetFieldRow}>
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
        {edited && (
          <button
            type="button"
            className={styles.targetResetBtn}
            aria-label="Reset to suggested value"
            onClick={() => {
              onChange(defaultValue);
              setText(defaultValue == null ? "" : isInteger ? defaultValue.toLocaleString("en-US") : String(defaultValue));
            }}
          >
            <ResetIcon size={18} />
          </button>
        )}
      </div>
      {!edited && <p className={styles.targetHint}>This value is from the last 30 days</p>}
    </div>
  );
}

export function BuildPlanPage({ onComplete, onExit, initialState, onScreenChange, mode = "create" }: Props) {
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
            <h1 className={styles.reviewPageTitle}>{mode === "edit" ? "Plan settings" : "Review plan"}</h1>
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
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={flow.continueFromPeriod}>
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
                className={`${styles.btn} ${styles.btnPrimary}`}
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
                    <TargetValueInput
                      key={state.target}
                      target={state.target}
                      value={state.targetValue}
                      defaultValue={referenceTargetDefault(state, state.target)}
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
                className={`${styles.btn} ${styles.btnPrimary}`}
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
              <p className={styles.groupLabel}>{group.label}</p>
              {group.items.map((item) => {
                const selected =
                  group.selectionType === "single"
                    ? state.singleCT === item.id
                    : state.attrs.includes(item.id);
                const onSelect = () =>
                  group.selectionType === "single" ? flow.toggleSingleCT(item.id) : flow.toggleAttr(item.id);
                return (
                  <label key={item.id} className={styles.optRow}>
                    {group.selectionType === "single" ? (
                      <input
                        type="radio"
                        name="ct-group"
                        className={styles.optInput}
                        checked={selected}
                        onChange={onSelect}
                      />
                    ) : (
                      <Checkbox checked={selected} onChange={onSelect} />
                    )}
                    <span className={styles.optTitle}>{item.name}</span>
                    <RollupHint item={item} />
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
                className={`${styles.btn} ${styles.btnPrimary}`}
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
            <button
              type="button"
              className={`${styles.btn} ${styles.btnIconLeft}`}
              onClick={downloadBudgetTemplate}
            >
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
          mode={mode}
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
  mode,
}: {
  state: ReturnType<typeof useBuildPlanFlow>["state"];
  flow: ReturnType<typeof useBuildPlanFlow>;
  moreOpen: boolean;
  setMoreOpen: (v: boolean) => void;
  onComplete: () => void;
  onExit: () => void;
  mode: "create" | "edit";
}) {
  const rows = visibleTactics(state);
  const n = planDaysFor(state);
  const [openDropdown, setOpenDropdown] = useState<"date" | "channel" | "period" | "ct" | "budget" | null>(
    null
  );
  const [budgetMenuOpen, setBudgetMenuOpen] = useState(false);
  const dateOpen = openDropdown === "date";
  const channelOpen = openDropdown === "channel";
  const periodOpen = openDropdown === "period";
  const ctOpen = openDropdown === "ct";
  const budgetOpen = openDropdown === "budget";
  const dateRef = useRef<HTMLSpanElement>(null);
  const channelRef = useRef<HTMLDivElement>(null);
  const periodRef = useRef<HTMLDivElement>(null);
  const ctRef = useRef<HTMLDivElement>(null);
  const budgetRef = useRef<HTMLDivElement>(null);
  const budgetFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!openDropdown) return;
    const refs = { date: dateRef, channel: channelRef, period: periodRef, ct: ctRef, budget: budgetRef };
    const activeRef = refs[openDropdown];
    const onPointerDown = (e: MouseEvent) => {
      if (activeRef.current && !activeRef.current.contains(e.target as Node)) setOpenDropdown(null);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [openDropdown]);

  const srcWindow = activeWindow(state);
  const allChannels = channelsPresent();
  const { label: ctLabel, attrLabels } = ctSummary(state);
  const conversionTypeLabel = attrLabels.length ? formatAttrLabels(attrLabels) : ctLabel;
  const includedVisibleCount = rows.filter((t) => state.included[t.id]).length;
  const allVisibleIncluded = rows.length > 0 && includedVisibleCount === rows.length;
  const someVisibleIncluded = includedVisibleCount > 0 && includedVisibleCount < rows.length;

  const channelControl = (
    <div className={styles.channelDropdown} ref={channelRef}>
      <button
        type="button"
        className={styles.settingsBoxBtn}
        onClick={() => setOpenDropdown((v) => (v === "channel" ? null : "channel"))}
      >
        <span>{channelFilterLabel(state)}</span>
        <ChevronDownIcon size={16} />
      </button>
      {channelOpen && (
        <div className={styles.channelDropdownPanel}>
          {allChannels.map((c) => (
            <label key={c} className={styles.channelOption}>
              <Checkbox checked={state.channels.includes(c)} onChange={() => flow.toggleChannel(c)} size={17} />
              <span>{c}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );

  // Re-uploading from the popover marks the source "upload-ready" the same way the wizard's
  // own upload step does — display the last real filename in that case instead of the sentinel.
  const uploadedFilename = state.source === "upload-ready" ? "budget_plan.xlsx" : state.source;

  const budgetControl =
    state.method === "fetch" ? (
      <span className={styles.dateDropdown} ref={dateRef}>
        <button
          type="button"
          className={styles.settingsBoxBtn}
          onClick={() => setOpenDropdown((v) => (v === "date" ? null : "date"))}
        >
          <span>
            {formatShortDate(srcWindow.start)} – {formatShortDate(srcWindow.end)}
          </span>
          <MaterialIcon name="calendar_month" size={16} />
        </button>
        {dateOpen && (
          <div className={styles.dateDropdownPanel}>
            <div className={styles.calendarPad}>
              <CalendarRangePicker
                start={srcWindow.start}
                end={srcWindow.end}
                onChange={(start) => flow.setSourceStart(start)}
                panels={2}
                mode="fixed-length"
                fixedLengthDays={n}
              />
            </div>
          </div>
        )}
      </span>
    ) : (
      <div className={styles.channelDropdown} ref={budgetRef}>
        <button
          type="button"
          className={styles.settingsBoxBtn}
          onClick={() => setOpenDropdown((v) => (v === "budget" ? null : "budget"))}
        >
          <span title={uploadedFilename}>{uploadedFilename}</span>
          <EditIcon size={16} />
        </button>
        {budgetOpen && (
          <div className={`${styles.channelDropdownPanel} ${styles.budgetPopoverPanel}`}>
            <div className={styles.templateRow}>
              <div className={styles.ti}>
                <FileIcon size={18} />
              </div>
              <div className={styles.tt}>
                <strong>{BUDGET_TEMPLATE_FILENAME}</strong>
                <span>{BUILD_TACTICS.length} tactics · Tactic, Channel, Budget columns</span>
              </div>
              <button type="button" className={`${styles.btn} ${styles.btnIconLeft}`} onClick={downloadBudgetTemplate}>
                <DownloadIcon size={20} /> Download
              </button>
            </div>
            <div
              className={`${styles.dropzone} ${styles.dropzoneFilled}`}
              onClick={() => budgetFileInputRef.current?.click()}
              role="button"
              tabIndex={0}
            >
              <input
                ref={budgetFileInputRef}
                type="file"
                accept=".xlsx,.csv"
                className={styles.visuallyHidden}
                onChange={() => flow.markUploadFilled()}
              />
              <div className={styles.dzIcon}>
                <CheckIcon size={20} />
              </div>
              <div className={styles.dzTitle}>{uploadedFilename} uploaded</div>
              <div className={styles.dzSub}>9 of 9 tactics matched · click to replace</div>
            </div>
          </div>
        )}
      </div>
    );

  const periodControl = (
    <div className={styles.channelDropdown} ref={periodRef}>
      <button
        type="button"
        className={styles.settingsBoxBtn}
        onClick={() => setOpenDropdown((v) => (v === "period" ? null : "period"))}
      >
        <span>{periodLabel(state)}</span>
        <MaterialIcon name="calendar_month" size={16} />
      </button>
      {periodOpen && (
        <div className={styles.dateDropdownPanel}>
          <div className={styles.calendarPad}>
            <CalendarRangePicker start={state.planStart} end={state.planEnd} onChange={flow.setPeriod} panels={2} />
          </div>
        </div>
      )}
    </div>
  );

  const ctControl = (
    <div className={styles.channelDropdown} ref={ctRef}>
      <button
        type="button"
        className={styles.settingsBoxBtn}
        onClick={() => setOpenDropdown((v) => (v === "ct" ? null : "ct"))}
      >
        <span>{conversionTypeLabel}</span>
        <ChevronDownIcon size={16} />
      </button>
      {ctOpen && (
        <div className={`${styles.channelDropdownPanel} ${styles.ctDropdownPanel}`}>
          {CT_GROUPS.map((group) => (
            <div key={group.group}>
              <p className={styles.groupLabel}>{group.label}</p>
              {group.items.map((item) => {
                const selected =
                  group.selectionType === "single" ? state.singleCT === item.id : state.attrs.includes(item.id);
                const onSelect = () =>
                  group.selectionType === "single" ? flow.toggleSingleCT(item.id) : flow.toggleAttr(item.id);
                return (
                  <label key={item.id} className={styles.channelOption}>
                    {group.selectionType === "single" ? (
                      <input type="radio" name="ct-group-inline" checked={selected} onChange={onSelect} />
                    ) : (
                      <Checkbox checked={selected} onChange={onSelect} size={17} />
                    )}
                    <span>{item.name}</span>
                    <RollupHint item={item} />
                  </label>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className={styles.settingsBar}>
        <div className={styles.settingsField}>
          <span className={styles.settingsLabel}>Planning period</span>
          {periodControl}
        </div>
        <div className={styles.settingsField}>
          <span className={styles.settingsLabel}>Conversion type</span>
          {ctControl}
        </div>
        <div className={styles.settingsField}>
          <span className={styles.settingsLabel}>Channels</span>
          {channelControl}
        </div>
        <div className={styles.settingsField}>
          <span className={styles.settingsLabel}>Budget from</span>
          <div className={styles.settingsFieldRow}>
            {budgetControl}
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
        </div>
      </div>
      <Card
      footer={
        <div className={styles.footerActions}>
          <button type="button" className={styles.btn} onClick={onExit}>
            Cancel
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={onComplete}>
            {mode === "edit" ? "Save" : "Create plan"}
          </button>
        </div>
      }
    >
      <div className={styles.reviewToolbar}>
        <h2 className={styles.reviewTitle}>
          Tactics
          <span className={styles.reviewCountTag}>
            {includedCount(state)}/{BUILD_TACTICS.length} included
          </span>
        </h2>
        <div className={styles.reviewToolbarControls}>
        <div className={styles.search}>
          <SearchIcon size={17} />
          <input
            placeholder="Search tactics"
            value={state.query}
            onChange={(e) => flow.setQuery(e.target.value)}
          />
        </div>
        </div>
      </div>

      <div className={styles.tbl}>
        <div className={styles.tblHead}>
          <div className={styles.tblHeadTactic}>
            <Checkbox
              checked={allVisibleIncluded}
              indeterminate={someVisibleIncluded}
              onChange={() => flow.setIncludedForIds(rows.map((t) => t.id), !allVisibleIncluded)}
              ariaLabel="Select all tactics"
            />
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
                  <Checkbox
                    checked={Boolean(included)}
                    onChange={() => flow.toggleInclude(t.id)}
                    ariaLabel={`Include ${t.name}`}
                  />
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
          <span />
          <span className={styles.fval}>{currencyFormatter.format(includedTotal(state))}</span>
        </div>
      </div>
      </Card>
    </>
  );
}

