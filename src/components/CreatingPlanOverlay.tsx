import type { CSSProperties } from "react";
import logoMark from "../assets/brand/measured-logo-mark.svg";
import { CheckIcon } from "./icons/BuildPlanIcons";
import styles from "./CreatingPlanOverlay.module.css";

const DEFAULT_STEPS = ["Reading tactic-level budgets", "Calculating weekly projections"];

/** Step checkmarks pop in on a fixed schedule spread across the overlay's total on-screen
 * duration, independent of any real async work — this is a static prototype. */
const TOTAL_DURATION_MS = 3000;

type Props = {
  title?: string;
  steps?: string[];
};

export function CreatingPlanOverlay({ title = "Creating your plan", steps = DEFAULT_STEPS }: Props) {
  return (
    <div className={styles.overlay} role="status" aria-live="polite">
      <div className={styles.card}>
        <div className={styles.badge}>
          <div className={styles.badgeCore}>
            <img src={logoMark} alt="" />
          </div>
          <span className={styles.badgeRing} aria-hidden />
        </div>
        <p className={styles.title}>{title}</p>
        <div className={styles.steps}>
          {steps.map((step, i) => {
            const delay = ((i + 1) / (steps.length + 0.5)) * TOTAL_DURATION_MS;
            return (
              <div className={styles.step} key={step}>
                <span className={styles.stepMark}>
                  <span className={styles.stepMarkTrack} aria-hidden />
                  <span
                    className={styles.stepMarkDone}
                    style={{ "--step-delay": `${delay}ms` } as CSSProperties}
                    aria-hidden
                  >
                    <CheckIcon size={13} />
                  </span>
                </span>
                <span className={styles.stepLabel}>{step}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
