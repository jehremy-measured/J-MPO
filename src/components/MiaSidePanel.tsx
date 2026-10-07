import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
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

export type MiaPrompt = {
  label: string;
  description: string;
  /** "flow" starts the page's guided flow; "chat" sends the label as a message */
  action: "flow" | "chat";
};

/** Callbacks handed to a guided flow rendered inside the panel */
export type MiaFlowControls = {
  /** Flow finished — optionally post a Mia message and/or close the panel */
  finish: (opts?: { message?: string; closePanel?: boolean }) => void;
  /** Leave the flow silently (e.g. handing off to the main page) */
  exit: () => void;
};

export type MiaConfig = {
  welcomeTitle?: string;
  welcomeSubtext: string;
  prompts: MiaPrompt[];
  shouldStartFlow: (text: string) => boolean;
  flowIntro: string;
  flowCancelled: string;
  cancelLabel?: string;
  reply: (text: string) => string;
  renderFlow: (controls: MiaFlowControls) => ReactNode;
};

const STARTER_PROMPTS: MiaPrompt[] = [
  {
    label: "Create a new plan",
    description: "Answer a few quick questions and I'll build a budget plan for you.",
    action: "flow",
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

/** MPO's Mia: budget prompts + guided build-plan flow */
export function MiaSidePanel({ open, onClose, onOpenPlanReview, onEditInMainFlow }: Props) {
  const config: MiaConfig = {
    welcomeSubtext: "Ask about budgets and tactics, or start the guided flow to create a new plan.",
    prompts: STARTER_PROMPTS,
    shouldStartFlow: shouldStartCreatePlanFlow,
    flowIntro: "Let's build your plan — I'll walk you through a few quick steps.",
    flowCancelled: 'Plan setup cancelled. Say "Create a new plan" anytime to start again.',
    reply: prototypeReply,
    renderFlow: ({ finish, exit }) => (
      <MiaBuildPlanFlow
        onComplete={(input: CreatePlanInput) => {
          const result = onOpenPlanReview(input);
          finish({
            closePanel: true,
            message: `Your plan "${result.label}" is ready — open the review page to confirm and save.`,
          });
        }}
        onEdit={(state: BuildPlanState) => {
          exit();
          onEditInMainFlow(state);
        }}
      />
    ),
  };
  return <MiaPanel open={open} onClose={onClose} config={config} />;
}

type PanelProps = {
  open: boolean;
  onClose: () => void;
  config: MiaConfig;
  /** Increment to open straight into the guided flow (e.g. from a page CTA) */
  startFlowSignal?: number;
};

/** Shared Mia side panel shell — pages supply prompts, replies and a guided flow */
export function MiaPanel({ open, onClose, config, startFlowSignal = 0 }: PanelProps) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [flowActive, setFlowActive] = useState(false);
  const [flowKey, setFlowKey] = useState(0);

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
    appendMessages([
      {
        role: "mia",
        text: config.flowCancelled,
      },
    ]);
  }, [appendMessages, config.flowCancelled]);

  const startCreateFlow = useCallback(
    (userText?: string) => {
      const batch: { role: "mia" | "user"; text: string }[] = [];
      if (userText) batch.push({ role: "user", text: userText });
      batch.push({
        role: "mia",
        text: config.flowIntro,
      });
      appendMessages(batch);
      setFlowKey((k) => k + 1);
      setFlowActive(true);
      setDraft("");
    },
    [appendMessages, config.flowIntro]
  );

  // Page CTAs (e.g. "Get started") open the panel directly into the flow
  useEffect(() => {
    if (startFlowSignal > 0 && open) startCreateFlow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startFlowSignal]);

  useEffect(() => {
    if (!open) {
      setFlowActive(false);
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

  const flowControls: MiaFlowControls = {
    finish: ({ message, closePanel } = {}) => {
      setFlowActive(false);
      if (closePanel) onClose();
      if (message) appendMessages([{ role: "mia", text: message }]);
    },
    exit: () => setFlowActive(false),
  };

  const sendUserText = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (config.shouldStartFlow(trimmed)) {
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
      appendMessages([{ role: "mia", text: config.reply(trimmed) }]);
    }, 650);
  };

  const submitComposer = () => {
    if (flowActive) return;
    const trimmed = draft.trim();
    if (!trimmed) return;
    setDraft("");
    sendUserText(trimmed);
  };

  const runPrompt = (prompt: MiaPrompt) => {
    if (prompt.action === "flow") {
      startCreateFlow(prompt.label);
      return;
    }
    sendUserText(prompt.label);
  };

  const placeholder = flowActive ? "Finish the setup above" : "Type your message…";
  const canSend = !flowActive && draft.trim().length > 0;

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
              {config.cancelLabel ?? "Cancel setup"}
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
            <h3 className={styles.welcomeTitle}>{config.welcomeTitle ?? WELCOME_TITLE}</h3>
            <p className={styles.welcomeSubtext}>{config.welcomeSubtext}</p>
            <div className={styles.optionList} role="group">
              {config.prompts.map((prompt) => (
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

        {flowActive && <div key={flowKey} className={styles.flowSlot}>{config.renderFlow(flowControls)}</div>}

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
            disabled={flowActive}
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
