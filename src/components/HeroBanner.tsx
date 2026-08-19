import { assets } from "../assets/figma";
import { PlayIcon } from "./icons/BuildPlanIcons";
import { SparkleIcon } from "./icons/SparkleIcon";
import styles from "./HeroBanner.module.css";

type Props = {
  onSimulate?: () => void;
  onOptimize?: () => void;
};

export function HeroBanner({ onSimulate, onOptimize }: Props) {
  return (
    <section className={styles.banner} data-node-id="1:33654">
      <img src={assets.heroVectorLeft} alt="" className={styles.waveLeft} aria-hidden />
      <img src={assets.heroVectorRight} alt="" className={styles.waveRight} aria-hidden />

      <button type="button" className={styles.tutorialBtn}>
        <PlayIcon size={13} />
        Watch tutorial
      </button>

      <div className={styles.content}>
        <h1 className={styles.title}>Welcome to Media Plan Optimizer</h1>
        <p className={styles.subtitle}>
          Plan your future media spend and see where to make budget changes to
          improve returns.
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.primaryBtn} onClick={onSimulate}>
            Simulate
            <SparkleIcon size={14} />
          </button>
          <button type="button" className={styles.primaryBtn} onClick={onOptimize}>
            Optimize
            <SparkleIcon size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
