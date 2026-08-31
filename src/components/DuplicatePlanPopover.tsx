import { CloseIcon } from "./icons/CloseIcon";
import styles from "./DuplicatePlanPopover.module.css";

type Props = {
  onDuplicate: () => void;
  onDismiss: () => void;
};

/** Nudges toward duplicating a simulation plan to explore what-if variants — surfaced a few
 * seconds after opening the plan, pointing up at the plan title. */
export function DuplicatePlanPopover({ onDuplicate, onDismiss }: Props) {
  return (
    <div className={styles.popover} role="dialog" aria-label="Explore what-if scenarios">
      <span className={styles.arrow} aria-hidden />
      <div className={styles.header}>
        <h3 className={styles.title}>Explore what-if scenarios</h3>
        <button type="button" className={styles.closeBtn} aria-label="Dismiss" onClick={onDismiss}>
          <CloseIcon size={16} />
        </button>
      </div>
      <p className={styles.subtext}>
        Duplicate this plan to simulate what-if scenarios with different budgets.
      </p>
      <div className={styles.actions}>
        <button type="button" className={styles.ctaBtn} onClick={onDuplicate}>
          Duplicate
        </button>
      </div>
    </div>
  );
}
