import { LATEST_MODEL_DATE, type ModelOption } from "../mpo/modelOptions";
import { CloseIcon } from "./icons/CloseIcon";
import styles from "./PlanDialog.module.css";

type Props = {
  onClose: () => void;
  onConfirm: (model: ModelOption) => void;
};

/** Refreshing a plan always pulls the latest MIM update — unlike duplicating a plan, there's
 * no "which model" choice here, just a heads-up that the switch can't be undone. */
export function UpdateModelDialog({ onClose, onConfirm }: Props) {
  const handleConfirm = () => {
    onConfirm({ id: "latest", date: LATEST_MODEL_DATE });
  };

  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-model-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h3 id="update-model-title" className={styles.title}>
            Refresh plan data
          </h3>
          <button type="button" className={styles.closeBtn} aria-label="Close" onClick={onClose}>
            <CloseIcon size={20} />
          </button>
        </div>

        <div className={styles.body}>
          <p className={styles.dialogIntro}>
            This plan will be refreshed based on data from the latest MIM update ({LATEST_MODEL_DATE}).
          </p>
          <p className={styles.dialogIntro}>Once refreshed, you will not be able to revert to earlier model updates.</p>
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={styles.confirmBtn} onClick={handleConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
