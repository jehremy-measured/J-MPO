import { useState } from "react";
import { LATEST_MODEL_DATE } from "../mpo/modelOptions";
import { MaterialIcon } from "./icons/MaterialIcon";
import styles from "./ModelDataDialog.module.css";

type Props = {
  modelDate: string;
  onClose: () => void;
};

/** Model-data info popup shown from the plan detail header's "MIM data from" link. Clicking
 * the card toggles between the plain "latest update" state and a "new model data available"
 * state with a Refresh nudge -- there's no real refresh wiring yet, so the click just flips
 * the card back and forth. */
export function ModelDataDialog({ modelDate, onClose }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="model-data-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h3 id="model-data-title" className={styles.title}>
            Model data
          </h3>
          <span className={styles.iconBadge}>
            <MaterialIcon name="layers" size={14} />
          </span>
        </div>

        <div
          className={styles.card}
          role="button"
          tabIndex={0}
          onClick={() => setExpanded((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setExpanded((v) => !v);
            }
          }}
        >
          <div className={styles.cardBody}>
            <p className={styles.cardLabel}>This plan is using MIM data from</p>
            <div className={styles.cardDateRow}>
              <span className={styles.cardDate}>{modelDate}</span>
              {!expanded && <span className={styles.latestTag}>Latest update</span>}
            </div>
          </div>
          {expanded && (
            <div className={styles.refreshBanner}>
              <p className={styles.refreshText}>
                New model data available ({LATEST_MODEL_DATE}). Refresh this plan to update to the latest model
                data.
              </p>
              <button type="button" className={styles.refreshBtn} onClick={(e) => e.stopPropagation()}>
                Refresh
              </button>
            </div>
          )}
        </div>

        <p className={styles.footnote}>
          A plan's output will remain unchanged till you manually update it using new model data.
        </p>
      </div>
    </div>
  );
}
