import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type DragEvent } from "react";
import { BUDGET_TEMPLATE_FILENAME } from "../mpo/buildPlan/budgetTemplateData";
import { currencyFormatter } from "../mpo/buildPlan/data";
import {
  applyUploadedBudget,
  downloadBudgetTemplate,
  includedCount,
  includedTotal,
  parsePlanRevision,
  periodLabel,
  planSummaryRows,
} from "../mpo/buildPlan/logic";
import type { BuildPlanState } from "../mpo/buildPlan/types";
import { defaultBuildPlanState } from "../mpo/buildPlan/useBuildPlanFlow";
import { MiaBuildPlanFlow } from "./mia-build-flow/MiaBuildPlanFlow";
import { CloseIcon } from "./icons/CloseIcon";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  DownloadIcon,
  ExpandIcon,
  FileIcon,
} from "./icons/BuildPlanIcons";
import { PlusIcon } from "./icons/PlusIcon";
import { SendIcon } from "./icons/SendIcon";
import { SparkleIcon } from "./icons/SparkleIcon";
import styles from "./MiaSidePanel.module.css";

const SETUP_DELAY_MS = 1600;
const CONSTRAINTS_DELAY_MS = 2000;

type SummaryRow = { label: string; value: string; subtext?: string; ai?: boolean };

type Message = {
  id: string;
  role: "mia" | "user";
  text: string;
  kind?: "download-card" | "plan-card" | "plan-ready-card" | "optimize-ready-card";
  subtext?: string;
  planState?: BuildPlanState;
  rows?: SummaryRow[];
};

type Prompt =
  | { label: string; description: string; action: "create-plan" }
  | { label: string; description: string; action: "chat" };

const STARTER_PROMPTS: Prompt[] = [
  {
    label: "Create a new plan",
    description: "Answer a few quick questions and I'll build a budget plan for you.",
    action: "create-plan",
  },
  {
    label: "Summarize my budget changes",
    description: "Get a quick readout of what changed in your plan and why.",
    action: "chat",
  },
  {
    label: "Which tactics should I increase?",
    description: "See which tactics have the best marginal return right now.",
    action: "chat",
  },
];

const WELCOME_TITLE = "Hi, I'm Mia";
const WELCOME_SUBTEXT =
  "Ask about budgets and tactics, or start the guided flow to create a new plan.";

function shouldStartCreatePlanFlow(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("create a new plan") ||
    lower.includes("create new plan") ||
    lower === "new plan" ||
    lower.includes("start a new plan") ||
    lower.includes("build a plan") ||
    lower.includes("build my plan")
  );
}

let measureCanvas: HTMLCanvasElement | null = null;
function measureTextWidth(text: string, font: string): number {
  measureCanvas ??= document.createElement("canvas");
  const ctx = measureCanvas.getContext("2d");
  if (!ctx) return 0;
  ctx.font = font;
  return ctx.measureText(text).width;
}

/** Renders the ready card's "from <filename>" subtext, collapsing the middle of the filename
 * into ".." — but only as much as needed to fit on one line, and only when the full name would
 * actually overflow; short names render untouched. */
function BudgetSourceSubtext({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(text);

  useLayoutEffect(() => {
    setDisplay(text);
  }, [text]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || display !== text || el.scrollWidth <= el.clientWidth) return;

    const match = text.match(/^(from )(.+)$/);
    if (!match) return;
    const [, prefix, fileName] = match;
    const dotIdx = fileName.lastIndexOf(".");
    const base = dotIdx > 0 ? fileName.slice(0, dotIdx) : fileName;
    const ext = dotIdx > 0 ? fileName.slice(dotIdx + 1) : "";
    const font = getComputedStyle(el).font;
    const available = el.clientWidth;

    for (let keep = base.length - 1; keep >= 1; keep--) {
      const candidateName = ext ? `${base.slice(0, keep)}..${ext}` : `${base.slice(0, keep)}..`;
      const candidate = `${prefix}${candidateName}`;
      if (measureTextWidth(candidate, font) <= available) {
        setDisplay(candidate);
        return;
      }
    }
    setDisplay(`${prefix}${base.slice(0, 1)}..${ext}`);
  }, [display, text]);

  return (
    <span ref={ref} className={styles.readyCardRowSubtext}>
      {display}
    </span>
  );
}

type StartSignal = { token: number; planType: "outcomes" | "spend" };
type OptimizeSignal = { token: number; rows: SummaryRow[] };

type Props = {
  open: boolean;
  onClose: () => void;
  onEditInMainFlow: (state: BuildPlanState) => void;
  onCreatePlan: (state: BuildPlanState) => void;
  startSignal?: StartSignal | null;
  /** Triggers the lighter "optimize an existing plan" flow — skips the guided create-plan
   * wizard entirely and goes straight to a constraints-setting loading state, then a review
   * card summarizing the plan Mia is about to optimize. */
  optimizeSignal?: OptimizeSignal | null;
  onEditConstraints?: () => void;
  onOptimizePlan?: () => void;
};

const PLAN_TYPE_START_LABEL: Record<StartSignal["planType"], string> = {
  outcomes: "Simulate a plan",
  spend: "Optimize a plan",
};

export function MiaSidePanel({
  open,
  onClose,
  onEditInMainFlow,
  onCreatePlan,
  startSignal,
  optimizeSignal,
  onEditConstraints,
  onOptimizePlan,
}: Props) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileAttachRef = useRef<HTMLInputElement>(null);
  const chatsMenuRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [flowActive, setFlowActive] = useState(false);
  const [flowKey, setFlowKey] = useState(0);
  const [presetPlanType, setPresetPlanType] = useState<StartSignal["planType"] | null>(null);
  const lastStartTokenRef = useRef<number | null>(null);
  const lastOptimizeTokenRef = useRef<number | null>(null);
  const [uploadState, setUploadState] = useState<BuildPlanState | null>(null);
  const [loadingReviewState, setLoadingReviewState] = useState<BuildPlanState | null>(null);
  const [lastPlanState, setLastPlanState] = useState<BuildPlanState | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [settingUp, setSettingUp] = useState(false);
  const [settingConstraints, setSettingConstraints] = useState(false);
  const [pendingOptimizeRows, setPendingOptimizeRows] = useState<SummaryRow[] | null>(null);
  const [chatsMenuOpen, setChatsMenuOpen] = useState(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const appendMessages = useCallback(
    (
      items: {
        role: "mia" | "user";
        text: string;
        kind?: "download-card" | "plan-card" | "plan-ready-card" | "optimize-ready-card";
        subtext?: string;
        planState?: BuildPlanState;
        rows?: SummaryRow[];
      }[]
    ) => {
      setMessages((prev) => [
        ...prev,
        ...items.map((item) => ({
          id: `${item.role}-${Date.now()}-${Math.random()}`,
          role: item.role,
          text: item.text,
          kind: item.kind,
          subtext: item.subtext,
          planState: item.planState,
          rows: item.rows,
        })),
      ]);
    },
    []
  );

  const cancelCreateFlow = useCallback(() => {
    setFlowActive(false);
    setPresetPlanType(null);
    appendMessages([
      {
        role: "mia",
        text: 'Plan setup cancelled. Say "Create a new plan" anytime to start again.',
      },
    ]);
  }, [appendMessages]);

  const resetToHome = useCallback(() => {
    setFlowActive(false);
    setUploadState(null);
    setLoadingReviewState(null);
    setLastPlanState(null);
    setMessages([]);
    setDraft("");
    setIsTyping(false);
    setSettingUp(false);
    setSettingConstraints(false);
    setPendingOptimizeRows(null);
    setChatsMenuOpen(false);
    setPresetPlanType(null);
  }, []);

  const startCreateFlow = useCallback(
    (userText?: string, planType?: StartSignal["planType"]) => {
      if (userText) appendMessages([{ role: "user", text: userText }]);
      setUploadState(null);
      setLoadingReviewState(null);
      setLastPlanState(null);
      setDraft("");
      setPresetPlanType(planType ?? null);
      setSettingUp(true);
    },
    [appendMessages]
  );

  useEffect(() => {
    if (!open || !startSignal || startSignal.token === lastStartTokenRef.current) return;
    lastStartTokenRef.current = startSignal.token;
    setMessages([]);
    startCreateFlow(PLAN_TYPE_START_LABEL[startSignal.planType], startSignal.planType);
  }, [open, startSignal, startCreateFlow]);

  const startOptimizeFlow = useCallback(
    (rows: SummaryRow[]) => {
      appendMessages([{ role: "user", text: "Optimize this plan" }]);
      setFlowActive(false);
      setUploadState(null);
      setLoadingReviewState(null);
      setLastPlanState(null);
      setDraft("");
      setPresetPlanType(null);
      setPendingOptimizeRows(rows);
      setSettingConstraints(true);
    },
    [appendMessages]
  );

  useEffect(() => {
    if (!open || !optimizeSignal || optimizeSignal.token === lastOptimizeTokenRef.current) return;
    lastOptimizeTokenRef.current = optimizeSignal.token;
    setMessages([]);
    startOptimizeFlow(optimizeSignal.rows);
  }, [open, optimizeSignal, startOptimizeFlow]);

  useEffect(() => {
    if (!settingUp) return;
    const timer = window.setTimeout(() => {
      appendMessages([
        { role: "mia", text: "Let's build your plan — I'll walk you through a few quick steps." },
      ]);
      setFlowKey((k) => k + 1);
      setFlowActive(true);
      setSettingUp(false);
    }, SETUP_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [settingUp, appendMessages]);

  useEffect(() => {
    if (!settingConstraints) return;
    const rows = pendingOptimizeRows ?? [];
    const timer = window.setTimeout(() => {
      setSettingConstraints(false);
      setPendingOptimizeRows(null);
      appendMessages([
        { role: "mia", text: "Your plan is ready to optimize." },
        {
          role: "mia",
          kind: "optimize-ready-card",
          text: "Plan ready for optimization",
          rows: [
            ...rows,
            {
              label: "Constraints",
              value: "Set by AI",
              subtext: "10 anchored, 23 with upper/lower limits",
              ai: true,
            },
          ],
        },
      ]);
    }, CONSTRAINTS_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [settingConstraints, pendingOptimizeRows, appendMessages]);

  useEffect(() => {
    if (!loadingReviewState) return;
    const reviewState = loadingReviewState;
    const timer = window.setTimeout(() => {
      setLoadingReviewState(null);
      setLastPlanState(reviewState);
      appendMessages([
        { role: "mia", text: "Your plan is ready for review." },
        {
          role: "mia",
          kind: "plan-ready-card",
          text: `${periodLabel(reviewState)} plan`,
          planState: reviewState,
          rows: planSummaryRows(reviewState),
        },
      ]);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [loadingReviewState, appendMessages]);

  useEffect(() => {
    if (!open) {
      setFlowActive(false);
      setUploadState(null);
      setLoadingReviewState(null);
      setLastPlanState(null);
      setDraft("");
      setIsTyping(false);
      setSettingUp(false);
      setSettingConstraints(false);
      setPendingOptimizeRows(null);
      setChatsMenuOpen(false);
      setPresetPlanType(null);
      return;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (flowActive) cancelCreateFlow();
      else onCloseRef.current();
    };
    document.addEventListener("keydown", onKeyDown);
    inputRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, flowActive, cancelCreateFlow]);

  useEffect(() => {
    if (!chatsMenuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (chatsMenuRef.current && !chatsMenuRef.current.contains(e.target as Node)) {
        setChatsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [chatsMenuOpen]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages, flowActive, draft, isTyping]);

  // The embedded build-plan flow changes screen/content internally without
  // touching this component's own state. The scroll container's own size is
  // fixed by flex layout (only its scrollHeight changes), so ResizeObserver
  // on the container itself won't fire — watch DOM mutations instead and
  // keep the scroll pinned to the bottom whenever content changes.
  //
  // Scrolling is done by setting scrollTop directly on the container rather
  // than element.scrollIntoView(), which can also scroll ancestor scroll
  // containers (including the main page behind the panel) to bring the
  // target into view.
  useEffect(() => {
    // `open` gates an early return below, so the container only exists in the
    // DOM (and this ref is populated) while the panel is open — re-run this
    // effect whenever that changes to (re)attach the observer.
    const container = messagesContainerRef.current;
    if (!container || typeof MutationObserver === "undefined") return;
    const observer = new MutationObserver(() => {
      container.scrollTop = container.scrollHeight;
    });
    observer.observe(container, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [open]);

  if (!open) return null;

  const handleAwaitUpload = (nextState: BuildPlanState) => {
    setFlowActive(false);
    setUploadState(nextState);
    appendMessages([
      {
        role: "mia",
        kind: "download-card",
        text: "Download and fill the budget for tactics you want to plan for. Once done, drop the completed template here.",
      },
    ]);
  };

  const handleFetchReady = (nextState: BuildPlanState) => {
    setFlowActive(false);
    onEditInMainFlow(nextState);
    setLastPlanState(nextState);
    appendMessages([
      { role: "mia", text: "Pick your source period and review your budget in the panel on the left." },
    ]);
  };

  const handleFileAttached = (file: File) => {
    if (!uploadState) {
      appendMessages([{ role: "user", text: file.name }]);
      setIsTyping(true);
      window.setTimeout(() => {
        setIsTyping(false);
        appendMessages([{ role: "mia", text: prototypeReply(file.name) }]);
      }, 650);
      return;
    }
    const reviewState = applyUploadedBudget(uploadState, file.name);
    setUploadState(null);
    setIsDragOver(false);
    appendMessages([{ role: "user", text: file.name || BUDGET_TEMPLATE_FILENAME }]);
    setLoadingReviewState(reviewState);
  };

  const sendUserText = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (shouldStartCreatePlanFlow(trimmed)) {
      startCreateFlow(trimmed);
      return;
    }

    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: "user", text: trimmed },
    ]);

    const revision = lastPlanState ? parsePlanRevision(trimmed, lastPlanState) : null;
    if (revision) {
      setIsTyping(true);
      window.setTimeout(() => {
        setIsTyping(false);
        onEditInMainFlow(revision.state);
        setLastPlanState(revision.state);
        appendMessages([
          { role: "mia", text: revision.summary },
          {
            role: "mia",
            kind: "plan-card",
            text: `${periodLabel(revision.state)} plan (revised)`,
            subtext: `${includedCount(revision.state)} tactics · ${currencyFormatter.format(includedTotal(revision.state))}`,
            planState: revision.state,
          },
        ]);
      }, 650);
      return;
    }

    setIsTyping(true);
    window.setTimeout(() => {
      setIsTyping(false);
      appendMessages([{ role: "mia", text: prototypeReply(trimmed) }]);
    }, 650);
  };

  const submitComposer = () => {
    if (flowActive) return;
    const trimmed = draft.trim();
    if (!trimmed) return;
    setDraft("");
    sendUserText(trimmed);
  };

  const runPrompt = (prompt: Prompt) => {
    if (prompt.action === "create-plan") {
      startCreateFlow(prompt.label);
      return;
    }
    sendUserText(prompt.label);
  };

  const placeholder = settingUp
    ? "Setting up your plan…"
    : settingConstraints
      ? "Setting constraints using AI…"
      : flowActive
        ? "Finish the setup above"
        : uploadState
          ? "Attach your budget file…"
          : "Type your message…";
  const canSend = !flowActive && !settingUp && !settingConstraints && draft.trim().length > 0;

  const handleDragOver = (e: DragEvent) => {
    if (!uploadState) return;
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: DragEvent) => {
    if (!uploadState) return;
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileAttached(file);
    else setIsDragOver(false);
  };

  return (
    <aside
      id="mia-side-panel"
      className={`${styles.panel} ${isDragOver ? styles.panelDragOver : ""}`}
      role="complementary"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      aria-labelledby={titleId}
    >
      <header className={styles.header}>
        <h2 id={titleId} className={styles.headerTitle}>
          Mia
        </h2>
        <div className={styles.headerActions}>
          <button type="button" className={styles.expandBtn} aria-label="Expand">
            <ExpandIcon size={20} />
          </button>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon size={20} />
          </button>
        </div>
      </header>

      <div className={styles.subNav}>
        <button type="button" className={styles.subNavItemActive} onClick={resetToHome}>
          <PlusIcon size={20} /> New chat
        </button>
        <div className={styles.subNavChats} ref={chatsMenuRef}>
          <button
            type="button"
            className={styles.subNavItem}
            onClick={() => setChatsMenuOpen((v) => !v)}
            aria-expanded={chatsMenuOpen}
          >
            My chats <ChevronDownIcon size={18} />
          </button>
          {chatsMenuOpen && (
            <div className={styles.chatsMenu} role="menu">
              No previous chats yet.
            </div>
          )}
        </div>
      </div>

      <div className={styles.messages} ref={messagesContainerRef}>
        {!flowActive && !settingUp && !settingConstraints && messages.length === 0 && (
          <div className={styles.welcome}>
            <span className={styles.welcomeAvatar} aria-hidden>
              <SparkleIcon size={26} />
            </span>
            <h3 className={styles.welcomeTitle}>{WELCOME_TITLE}</h3>
            <p className={styles.welcomeSubtext}>{WELCOME_SUBTEXT}</p>
            <div className={styles.optionList} role="group">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt.label}
                  type="button"
                  className={styles.optionRow}
                  onClick={() => runPrompt(prompt)}
                >
                  <span className={styles.optionCopy}>
                    <span className={styles.optionTitle}>{prompt.label}</span>
                    <span className={styles.optionDescription}>{prompt.description}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) =>
          msg.kind === "download-card" ? (
            <div key={msg.id} className={styles.downloadCardWrap}>
              <div className={styles.downloadCard}>
                <span className={styles.downloadCardIcon} aria-hidden>
                  <FileIcon size={16} />
                </span>
                <span className={styles.downloadCardLabel}>{BUDGET_TEMPLATE_FILENAME}</span>
                <button
                  type="button"
                  className={styles.downloadCardBtn}
                  aria-label="Download template"
                  onClick={downloadBudgetTemplate}
                >
                  <DownloadIcon size={20} />
                </button>
              </div>
              <p className={styles.miaText}>{msg.text}</p>
            </div>
          ) : msg.kind === "plan-card" ? (
            <button
              key={msg.id}
              type="button"
              className={styles.planCard}
              onClick={() => msg.planState && onEditInMainFlow(msg.planState)}
            >
              <span className={styles.planCardIcon} aria-hidden>
                <FileIcon size={20} />
              </span>
              <span className={styles.planCardBody}>
                <span className={styles.planCardTitle}>{msg.text}</span>
                <span className={styles.planCardSub}>{msg.subtext}</span>
              </span>
              <span className={styles.planCardChevron} aria-hidden>
                <ChevronRightIcon size={20} />
              </span>
            </button>
          ) : msg.kind === "plan-ready-card" ? (
            <div key={msg.id} className={styles.readyCard}>
              <div className={styles.readyCardHeader}>
                <span className={styles.planCardIcon} aria-hidden>
                  <FileIcon size={20} />
                </span>
                <span className={styles.planCardTitle}>{msg.text}</span>
              </div>
              {msg.rows && (
                <dl className={styles.readyCardRows}>
                  {msg.rows.map((row) => (
                    <div className={styles.readyCardRow} key={row.label}>
                      <dt>{row.label}</dt>
                      <dd>
                        <span className={styles.readyCardRowValue}>{row.value}</span>
                        {row.subtext && <BudgetSourceSubtext text={row.subtext} />}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              <div className={styles.readyCardActions}>
                <button
                  type="button"
                  className={styles.rcBtn}
                  onClick={() => msg.planState && onEditInMainFlow(msg.planState)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={`${styles.rcBtn} ${styles.rcBtnPrimary}`}
                  onClick={() => msg.planState && onCreatePlan(msg.planState)}
                >
                  Create plan
                </button>
              </div>
            </div>
          ) : msg.kind === "optimize-ready-card" ? (
            <div key={msg.id} className={styles.readyCard}>
              <div className={styles.readyCardHeader}>
                <span className={styles.planCardIcon} aria-hidden>
                  <FileIcon size={20} />
                </span>
                <span className={styles.planCardTitle}>{msg.text}</span>
              </div>
              {msg.rows && (
                <dl className={styles.readyCardRows}>
                  {msg.rows.map((row) => (
                    <div className={styles.readyCardRow} key={row.label}>
                      <dt>{row.label}</dt>
                      <dd>
                        {row.ai ? (
                          <span className={styles.readyCardRowValueAi}>
                            <span className={styles.readyCardAiIcon} aria-hidden>
                              <SparkleIcon size={12} variant="fill" />
                            </span>
                            {row.value}
                          </span>
                        ) : (
                          <span className={styles.readyCardRowValue}>{row.value}</span>
                        )}
                        {row.subtext &&
                          (row.ai ? (
                            <span className={styles.readyCardRowSubtextWrap}>{row.subtext}</span>
                          ) : (
                            <BudgetSourceSubtext text={row.subtext} />
                          ))}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              <div className={styles.readyCardActions}>
                <button type="button" className={styles.rcBtn} onClick={() => onEditConstraints?.()}>
                  Edit constraints
                </button>
                <button
                  type="button"
                  className={`${styles.rcBtn} ${styles.rcBtnPrimary}`}
                  onClick={() => onOptimizePlan?.()}
                >
                  Optimize plan
                </button>
              </div>
            </div>
          ) : msg.role === "mia" ? (
            <p key={msg.id} className={styles.miaText}>
              {msg.text}
            </p>
          ) : (
            <div key={msg.id} className={styles.bubbleUser}>
              <p>{msg.text}</p>
            </div>
          )
        )}

        {settingUp && (
          <div className={styles.thinkingRow}>
            <span className={styles.thinkingChevron} aria-hidden>
              <ChevronDownIcon size={14} />
            </span>
            <span className={styles.thinkingText}>Setting up the flow for a new plan…</span>
          </div>
        )}

        {settingConstraints && (
          <div className={styles.thinkingRow}>
            <span className={styles.thinkingChevron} aria-hidden>
              <ChevronDownIcon size={14} />
            </span>
            <span className={styles.thinkingText}>Setting constraints using AI…</span>
          </div>
        )}

        {flowActive && (
          <MiaBuildPlanFlow
            key={flowKey}
            initialState={
              presetPlanType ? { ...defaultBuildPlanState(), planType: presetPlanType, screen: "period" } : undefined
            }
            onAwaitUpload={handleAwaitUpload}
            onFetchReady={handleFetchReady}
            onExchange={(question, answer) =>
              appendMessages([
                { role: "mia", text: question },
                { role: "user", text: answer },
              ])
            }
          />
        )}

        {loadingReviewState && (
          <div className={styles.thinkingRow}>
            <span className={styles.thinkingChevron} aria-hidden>
              <ChevronDownIcon size={14} />
            </span>
            <span className={styles.thinkingText}>Loading your plan for review…</span>
          </div>
        )}

        {isTyping && (
          <div className={styles.thinkingRow}>
            <span className={styles.thinkingChevron} aria-hidden>
              <ChevronDownIcon size={14} />
            </span>
            <span className={styles.thinkingText}>Thinking...</span>
          </div>
        )}
      </div>

      <form
        className={styles.composer}
        onSubmit={(e) => {
          e.preventDefault();
          submitComposer();
        }}
      >
        <div className={styles.composerBox}>
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            aria-label="Message Mia"
            disabled={flowActive || settingUp || settingConstraints}
            className={styles.composerInput}
          />
          <div className={styles.composerToolbar}>
            <button
              type="button"
              className={styles.attachBtn}
              aria-label="Attach file"
              disabled={flowActive || settingUp || settingConstraints}
              onClick={() => fileAttachRef.current?.click()}
            >
              <PlusIcon size={18} />
            </button>
            <input
              ref={fileAttachRef}
              type="file"
              accept=".xlsx,.csv"
              className={styles.visuallyHidden}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileAttached(file);
              }}
            />
            <button type="button" className={styles.mentionBtn} aria-label="Mention" disabled={flowActive || settingUp || settingConstraints}>
              @
            </button>
            <span className={styles.composerSpacer} />
            <button
              type="submit"
              className={styles.sendIconBtn}
              disabled={!canSend}
              aria-label="Send message"
            >
              <SendIcon size={16} />
            </button>
          </div>
        </div>
      </form>
      <p className={styles.disclaimer}>AI can make mistakes. Please double-check responses.</p>
    </aside>
  );
}

function prototypeReply(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("budget") || lower.includes("summarize")) {
    return "Your plan shifts spend toward higher marginal-ROAS tactics. Locked tactics stay fixed when you move the target budget slider.";
  }
  if (lower.includes("tactic") || lower.includes("increase")) {
    return "Google Performance Max and Facebook Prospecting show the largest positive adjustments. Consider unlocking trimmed tactics to rebalance.";
  }
  if (lower.includes("curve") || lower.includes("diminishing")) {
    return "The curve plots incremental sales and ROAS against media spend. The blue dotted line is your target budget.";
  }
  return 'I can help refine budgets, explain metrics, or walk you through creating a new plan — try "Create a new plan" above.';
}
