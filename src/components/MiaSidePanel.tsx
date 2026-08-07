import { useCallback, useEffect, useId, useRef, useState, type DragEvent } from "react";
import { applyUploadedBudget, downloadBudgetTemplate } from "../mpo/buildPlan/logic";
import type { BuildPlanState } from "../mpo/buildPlan/types";
import { MiaBuildPlanFlow } from "./mia-build-flow/MiaBuildPlanFlow";
import { CloseIcon } from "./icons/CloseIcon";
import { DownloadIcon, FileIcon } from "./icons/BuildPlanIcons";
import { PlusIcon } from "./icons/PlusIcon";
import { SendIcon } from "./icons/SendIcon";
import { SparkleIcon } from "./icons/SparkleIcon";
import styles from "./MiaSidePanel.module.css";

type Message = {
  id: string;
  role: "mia" | "user";
  text: string;
  kind?: "download-card";
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

type Props = {
  open: boolean;
  onClose: () => void;
  onEditInMainFlow: (state: BuildPlanState) => void;
};

export function MiaSidePanel({ open, onClose, onEditInMainFlow }: Props) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileAttachRef = useRef<HTMLInputElement>(null);
  const onEditInMainFlowRef = useRef(onEditInMainFlow);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [flowActive, setFlowActive] = useState(false);
  const [flowKey, setFlowKey] = useState(0);
  const [uploadState, setUploadState] = useState<BuildPlanState | null>(null);
  const [loadingReviewState, setLoadingReviewState] = useState<BuildPlanState | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    onEditInMainFlowRef.current = onEditInMainFlow;
  }, [onEditInMainFlow]);

  const appendMessages = useCallback(
    (items: { role: "mia" | "user"; text: string; kind?: "download-card" }[]) => {
      setMessages((prev) => [
        ...prev,
        ...items.map((item) => ({
          id: `${item.role}-${Date.now()}-${Math.random()}`,
          role: item.role,
          text: item.text,
          kind: item.kind,
        })),
      ]);
    },
    []
  );

  const cancelCreateFlow = useCallback(() => {
    setFlowActive(false);
    appendMessages([
      {
        role: "mia",
        text: 'Plan setup cancelled. Say "Create a new plan" anytime to start again.',
      },
    ]);
  }, [appendMessages]);

  const startCreateFlow = useCallback(
    (userText?: string) => {
      const batch: { role: "mia" | "user"; text: string }[] = [];
      if (userText) batch.push({ role: "user", text: userText });
      batch.push({
        role: "mia",
        text: "Let's build your plan — I'll walk you through a few quick steps.",
      });
      appendMessages(batch);
      setFlowKey((k) => k + 1);
      setFlowActive(true);
      setUploadState(null);
      setLoadingReviewState(null);
      setDraft("");
    },
    [appendMessages]
  );

  useEffect(() => {
    if (!loadingReviewState) return;
    const timer = window.setTimeout(() => {
      onEditInMainFlowRef.current(loadingReviewState);
      setLoadingReviewState(null);
      appendMessages([{ role: "mia", text: "Your plan is ready — reviewing it on the left." }]);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [loadingReviewState, appendMessages]);

  useEffect(() => {
    if (!open) {
      setFlowActive(false);
      setUploadState(null);
      setLoadingReviewState(null);
      setMessages([]);
      setDraft("");
      setIsTyping(false);
      return;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (flowActive) cancelCreateFlow();
      else onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    inputRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, flowActive, cancelCreateFlow]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, flowActive, draft, isTyping]);

  // The embedded build-plan flow changes screen/content internally without
  // touching this component's own state. The scroll container's own size is
  // fixed by flex layout (only its scrollHeight changes), so ResizeObserver
  // on the container itself won't fire — watch DOM mutations instead and
  // keep the scroll pinned to the bottom whenever content changes.
  useEffect(() => {
    // `open` gates an early return below, so the container only exists in the
    // DOM (and this ref is populated) while the panel is open — re-run this
    // effect whenever that changes to (re)attach the observer.
    const container = messagesContainerRef.current;
    if (!container || typeof MutationObserver === "undefined") return;
    const observer = new MutationObserver(() => {
      messagesEndRef.current?.scrollIntoView({ block: "end" });
    });
    observer.observe(container, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [open]);

  if (!open) return null;

  const handleMethodChosen = (method: "upload" | "fetch") => {
    appendMessages([
      { role: "user", text: method === "upload" ? "Upload budget" : "Fetch from past period" },
    ]);
  };

  const handleAwaitUpload = (nextState: BuildPlanState) => {
    setFlowActive(false);
    setUploadState(nextState);
    appendMessages([
      {
        role: "mia",
        kind: "download-card",
        text: "Attach the completed file here, or drop it anywhere in this panel.",
      },
    ]);
  };

  const handleFetchReady = (nextState: BuildPlanState) => {
    setFlowActive(false);
    onEditInMainFlow(nextState);
    appendMessages([
      { role: "mia", text: "Pick your source period and review your budget in the panel on the left." },
    ]);
  };

  const handleFileAttached = (file: File) => {
    if (!uploadState) return;
    const reviewState = applyUploadedBudget(uploadState);
    setUploadState(null);
    setIsDragOver(false);
    appendMessages([{ role: "user", text: file.name || "budget_plan.xlsx" }]);
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

  const placeholder = flowActive
    ? "Finish the setup above"
    : uploadState
      ? "Attach your budget file…"
      : "Type your message…";
  const canSend = !flowActive && draft.trim().length > 0;

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
        <div className={styles.headerTitle}>
          <span className={styles.headerIcon}>
            <SparkleIcon size={18} />
          </span>
          <h2 id={titleId}>Mia</h2>
          <span className={styles.headerBadge}>Beta</span>
        </div>
        <div className={styles.headerActions}>
          {flowActive && (
            <button
              type="button"
              className={styles.cancelFlowBtn}
              onClick={cancelCreateFlow}
            >
              Cancel setup
            </button>
          )}
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon size={16} />
          </button>
        </div>
      </header>

      <div className={styles.messages} ref={messagesContainerRef}>
        {!flowActive && messages.length === 0 && (
          <div className={styles.welcome}>
            <span className={styles.welcomeAvatar} aria-hidden>
              <SparkleIcon size={20} />
            </span>
            <h3 className={styles.welcomeTitle}>{WELCOME_TITLE}</h3>
            <p className={styles.welcomeSubtext}>{WELCOME_SUBTEXT}</p>
            <div className={styles.optionList} role="group">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt.label}
                  type="button"
                  className={styles.optionCard}
                  onClick={() => runPrompt(prompt)}
                >
                  <span className={styles.optionIcon} aria-hidden>
                    <SparkleIcon size={14} />
                  </span>
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
                <span className={styles.downloadCardLabel}>MPO_budget_template.xlsx</span>
                <button
                  type="button"
                  className={styles.downloadCardBtn}
                  aria-label="Download template"
                  onClick={downloadBudgetTemplate}
                >
                  <DownloadIcon size={16} />
                </button>
              </div>
              <p className={styles.miaText}>{msg.text}</p>
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

        {flowActive && (
          <MiaBuildPlanFlow
            key={flowKey}
            onMethodChosen={handleMethodChosen}
            onAwaitUpload={handleAwaitUpload}
            onFetchReady={handleFetchReady}
          />
        )}

        {loadingReviewState && (
          <div className={styles.loadingRow}>
            <span className={styles.spinner} aria-hidden />
            <p className={styles.miaText}>Loading your plan for review…</p>
          </div>
        )}

        {isTyping && (
          <div className={styles.bubbleMia}>
            <span className={styles.bubbleAvatar} aria-hidden>
              <SparkleIcon size={12} />
            </span>
            <p className={styles.typingBubble}>
              <span className={styles.typingDot} />
              <span className={styles.typingDot} />
              <span className={styles.typingDot} />
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        className={styles.composer}
        onSubmit={(e) => {
          e.preventDefault();
          submitComposer();
        }}
      >
        <div className={styles.composerBox}>
          {uploadState && (
            <>
              <button
                type="button"
                className={styles.attachBtn}
                aria-label="Attach file"
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
            </>
          )}
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            aria-label="Message Mia"
            disabled={flowActive}
            className={uploadState ? styles.inputWithAttach : undefined}
          />
          <button
            type="submit"
            className={styles.sendIconBtn}
            disabled={!canSend}
            aria-label="Send message"
          >
            <SendIcon size={18} />
          </button>
        </div>
      </form>
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
