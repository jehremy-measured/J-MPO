import { useRef, useState, type ReactNode } from "react";
import type { CreatePlanInput } from "../mpo/types";
import { BUILD_TACTICS, CT_GROUPS } from "../mpo/buildPlan/data";
import {
  activeWindow,
  buildPlanToCreatePlanInput,
  channelsPresent,
  ctSummary,
  downloadBudgetTemplate,
  excludeReason,
  includedCount,
  includedTotal,
  periodLabel,
  planDaysFor,
  visibleTactics,
} from "../mpo/buildPlan/logic";
import { currencyFormatter, formatShortDate } from "../mpo/buildPlan/data";
import { useBuildPlanFlow } from "../mpo/buildPlan/useBuildPlanFlow";
import type { BuildPlanState } from "../mpo/buildPlan/types";
import { CalendarRangePicker } from "./CalendarRangePicker";
import {
  BackArrowIcon,
  CheckIcon,
  CheckRingIcon,
  DownloadIcon,
  FileIcon,
  HistoryIcon,
  InfoIcon,
  MoreIcon,
  SearchIcon,
  UploadIcon,
} from "./icons/BuildPlanIcons";
import { CloseIcon } from "./icons/CloseIcon";
import styles from "./BuildPlanPage.module.css";

type Props = {
  onComplete: (input: CreatePlanInput) => void;
  onExit: () => void;
  initialState?: BuildPlanState;
};

function Card({
  eyebrow,
  title,
  desc,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  desc: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1>{title}</h1>
        <p>{desc}</p>
      </div>
      <div className={styles.cardBody}>{children}</div>
      <div className={styles.cardFoot}>{footer}</div>
    </div>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={styles.backLink} onClick={onClick}>
      <BackArrowIcon size={14} />
      Back
    </button>
  );
}

function BudgetInput({
  value,
  disabled,
  onChange,
}: {
  value: number | null;
  disabled: boolean;
  onChange: (value: number | null) => void;
}) {
  const [text, setText] = useState(value != null ? value.toLocaleString("en-US") : "");

  return (
    <div className={styles.binputWrap}>
      <span className={styles.dol}>$</span>
      <input
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
        }}
      />
    </div>
  );
}

export function BuildPlanPage({ onComplete, onExit, initialState }: Props) {
  const flow = useBuildPlanFlow(initialState);
  const { state } = flow;
  const [moreOpen, setMoreOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={styles.page} data-node-id="build-plan-page">
      <div className={styles.topBar}>
        <button type="button" className={styles.exitBtn} onClick={onExit}>
          <CloseIcon size={14} />
          Exit setup
        </button>
      </div>

      {state.screen === "period" && (
        <Card
          eyebrow="Planning period"
          title="What period are you planning for?"
          desc="Set the plan's date range first. We'll match its length when pulling past spend."
          footer={
            <>
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
                <UploadIcon size={22} />
              </div>
              <h3>Upload budget</h3>
              <p>Download the template, fill in spend per tactic, and upload it back.</p>
            </button>
            <button type="button" className={styles.methodCard} onClick={() => flow.chooseMethod("fetch")}>
              <div className={styles.methodIcon}>
                <HistoryIcon size={22} />
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
              <strong>MPO_budget_template.xlsx</strong>
              <span>{BUILD_TACTICS.length} tactics · Tactic, Channel, Budget columns</span>
            </div>
            <button type="button" className={styles.btn} onClick={downloadBudgetTemplate}>
              <DownloadIcon size={16} /> Download
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
              {state.source === "upload-ready" ? <CheckIcon size={24} /> : <UploadIcon size={24} />}
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
        />
      )}

      {state.screen === "done" && (
        <DoneScreen state={state} onRestart={flow.restart} onComplete={() => onComplete(buildPlanToCreatePlanInput(state))} />
      )}
    </div>
  );
}

function ReviewScreen({
  state,
  flow,
  moreOpen,
  setMoreOpen,
}: {
  state: ReturnType<typeof useBuildPlanFlow>["state"];
  flow: ReturnType<typeof useBuildPlanFlow>;
  moreOpen: boolean;
  setMoreOpen: (v: boolean) => void;
}) {
  const rows = visibleTactics(state);
  const n = planDaysFor(state);

  return (
    <Card
      eyebrow="Review budget"
      title="Review plan budget"
      desc="Include the tactics you want, adjust budgets, then create the plan."
      footer={
        <>
          <BackLink onClick={flow.back} />
          <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLg}`} onClick={flow.completePlan}>
            Create plan
          </button>
        </>
      }
    >
      {state.method === "fetch" ? (
        <div className={styles.srcPanel}>
          <div className={styles.periodBar}>
            <span className={styles.pbIco}>
              <HistoryIcon size={20} />
            </span>
            <label>Source period</label>
          </div>
          <CalendarRangePicker
            start={activeWindow(state).start}
            end={activeWindow(state).end}
            onChange={(start) => flow.setSourceStart(start)}
            panels={1}
            mode="fixed-length"
            fixedLengthDays={n}
          />
          <div className={styles.periodNote}>
            <InfoIcon size={16} />
            <span>
              Actual spend from {formatShortDate(activeWindow(state).start)} –{" "}
              {formatShortDate(activeWindow(state).end)} — the same {n} days as your plan. Tactics with no
              spend in the last year are excluded by default.
            </span>
          </div>
        </div>
      ) : (
        <div className={styles.fileRow}>
          <div className={styles.ti}>
            <CheckIcon size={16} />
          </div>
          <div className={styles.tt}>
            <strong>{state.source}</strong>
            <span>Tactics with no budget in the file are excluded by default</span>
          </div>
          <button type="button" className={styles.btn} onClick={flow.reupload}>
            <UploadIcon size={16} /> Reupload
          </button>
          <div className={styles.moreWrap}>
            <button
              type="button"
              className={styles.iconBtn}
              aria-label="More options"
              onClick={() => setMoreOpen(!moreOpen)}
            >
              <MoreIcon size={18} />
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
                  <DownloadIcon size={16} /> Download template
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <SearchIcon size={17} />
          <input
            placeholder="Search tactics"
            value={state.query}
            onChange={(e) => flow.setQuery(e.target.value)}
          />
        </div>
        <div className={styles.chips}>
          {["All", ...channelsPresent()].map((c) => (
            <button
              key={c}
              type="button"
              className={`${styles.chipBtn} ${state.channel === c ? styles.chipBtnOn : ""}`}
              onClick={() => flow.setChannel(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tbl}>
        <div className={styles.tblHead}>
          <span>Tactic</span>
          <span>Budget</span>
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
                  disabled={!included}
                  onChange={(v) => flow.setBudget(t.id, v)}
                />
              </div>
            );
          })
        )}
        <div className={styles.tblFoot}>
          <span className={styles.flabel}>
            Total budget <span className={styles.finc}>· {includedCount(state)} of {BUILD_TACTICS.length} included</span>
          </span>
          <span className={styles.fval}>{currencyFormatter.format(includedTotal(state))}</span>
        </div>
      </div>
    </Card>
  );
}

function DoneScreen({
  state,
  onRestart,
  onComplete,
}: {
  state: ReturnType<typeof useBuildPlanFlow>["state"];
  onRestart: () => void;
  onComplete: () => void;
}) {
  const total = includedTotal(state);
  const active = includedCount(state);
  const period = periodLabel(state);
  const { label: ctLabel, attrLabels } = ctSummary(state);
  const usingAttrs = attrLabels.length > 0;

  return (
    <div className={styles.card}>
      <div className={styles.cardBody}>
        <div className={styles.doneWrap}>
          <div className={styles.doneRing}>
            <CheckRingIcon size={30} />
          </div>
          <h2>Plan created</h2>
          <p>Your draft plan is ready to project and simulate.</p>
          <div className={styles.summary}>
            <div className={styles.scard}>
              <div className={styles.sl}>Plan period</div>
              <div className={`${styles.sv} ${styles.small}`}>{period}</div>
            </div>
            <div className={styles.scard}>
              <div className={styles.sl}>Conversion type</div>
              <div className={`${styles.sv} ${styles.small}`}>{ctLabel}</div>
            </div>
            <div className={styles.scard}>
              <div className={styles.sl}>Tactics included</div>
              <div className={styles.sv}>{active}</div>
            </div>
            <div className={styles.scard}>
              <div className={styles.sl}>Total budget</div>
              <div className={styles.sv}>{currencyFormatter.format(total)}</div>
            </div>
          </div>
          {usingAttrs && (
            <div className={styles.chipRow}>
              {attrLabels.map((label) => (
                <span key={label} className={styles.chip}>
                  {label}
                </span>
              ))}
            </div>
          )}
          <div className={styles.doneActions}>
            <button type="button" className={styles.btn} onClick={onRestart}>
              Start over
            </button>
            <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLg}`} onClick={onComplete}>
              Project &amp; simulate →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
