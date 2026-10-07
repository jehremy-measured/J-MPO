import { assets } from "../assets/figma";
import styles from "./HeroBanner.module.css";

type Props = {
  title?: string;
  subtitle?: string;
  primaryLabel?: string;
  linkLabel?: string;
  onCreatePlan?: () => void;
};

export function HeroBanner({
  title = "Welcome to Media Plan Optimizer",
  subtitle = "Plan your future media spend and see where to make budget changes to improve returns.",
  primaryLabel = "Create a plan",
  linkLabel = "Watch tutorial",
  onCreatePlan,
}: Props) {
  return (
    <section className={styles.banner} data-node-id="1:33654">
      <img src={assets.heroVectorLeft} alt="" className={styles.waveLeft} aria-hidden />
      <img src={assets.heroVectorRight} alt="" className={styles.waveRight} aria-hidden />

      <div className={styles.content}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
        <div className={styles.actions}>
          <button type="button" className={styles.primaryBtn} onClick={onCreatePlan}>
            {primaryLabel}
          </button>
          <a href="#" className={styles.link} onClick={(e) => e.preventDefault()}>
            {linkLabel}
          </a>
        </div>
      </div>
    </section>
  );
}
