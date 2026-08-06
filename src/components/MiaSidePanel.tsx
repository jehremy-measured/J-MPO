import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { BuildPlanState } from "../mpo/buildPlan/types";
import type { CreatePlanInput } from "../mpo/types";
import { MiaBuildPlanFlow } from "./mia-build-flow/MiaBuildPlanFlow";
import { CloseIcon } from "./icons/CloseIcon";
import { SendIcon } from "./icons/SendIcon";
import { SparkleIcon } from "./icons/SparkleIcon";
import styles from "./MiaSidePanel.module.css";

type Message = {
  id: string;
  role: "mia" | "user";
  text: string;
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

const REMOVE_INTENT = /\bremove\b/i;

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
  onOpenPlanReview: (input: CreatePlanInput) => { label: string };
  onEditInMainFlow: (state: BuildPlanState) => void;
};

export function MiaSidePanel({ open, onClose, onOpenPlanReview, onEditInMainFlow }: Props) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [flowActive, setFlowActive] = useState(false);
  const [flowKey, setFlowKey] = useState(0);
  const [atSummary, setAtSummary] = useState(false);
  const [editSignal, setEditSignal] = useState(0);

  const appendMessages = useCallback(
    (items: { role: "mia" | "user"; text: string }[]) => {
      setMessages((prev) => [
        ...prev,
        ...items.map((item) => ({
          id: `${item.role}-${Date.now()}-${Math.random()}`,
          role: item.role,
          text: item.text,
        })),
      ]);
    },
    []
  );

  const cancelCreateFlow = useCallback(() => {
    setFlowActive(false);
    setAtSummary(false);
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
      setAtSummary(false);
      setDraft("");
    },
    [appendMessages]
  );

  useEffect(() => {
    if (!open) {
      setFlowActive(false);
      setAtSummary(false);
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

  const handleFlowComplete = (input: CreatePlanInput) => {
    const result = onOpenPlanReview(input);
    setFlowActive(false);
    setAtSummary(false);
    onClose();
    appendMessages([
      {
        role: "mia",
        text: `Your plan "${result.label}" is ready — open the review page to confirm and save.`,
      },
    ]);
  };

  const handleFlowEdit = (state: BuildPlanState) => {
    setFlowActive(false);
    setAtSummary(false);
    onEditInMainFlow(state);
  };

  const sendUserText = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (flowActive && atSummary && REMOVE_INTENT.test(trimmed)) {
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: "user", text: trimmed },
      ]);
      setEditSignal((c) => c + 1);
      return;
    }

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
    if (flowActive && !atSummary) return;
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
    ? atSummary
      ? 'Try "remove Google Brand"…'
      : "Finish the setup above"
    : "Type your message…";
  const canSend = (!flowActive || atSummary) && draft.trim().length > 0;

  return (
    <aside
      id="mia-side-panel"
      className={styles.panel}
      role="complementary"
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

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={msg.role === "mia" ? styles.bubbleMia : styles.bubbleUser}
          >
            {msg.role === "mia" && (
              <span className={styles.bubbleAvatar} aria-hidden>
                <SparkleIcon size={12} />
              </span>
            )}
            <p>{msg.text}</p>
          </div>
        ))}

        {flowActive && (
          <MiaBuildPlanFlow
            key={flowKey}
            onComplete={handleFlowComplete}
            onEdit={handleFlowEdit}
            onSummaryVisible={setAtSummary}
            editSignal={editSignal}
          />
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
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            aria-label="Message Mia"
            disabled={flowActive && !atSummary}
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
