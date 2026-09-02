import { useState } from "react";
import { CURRENT_MODEL, isOnLatestModel, LATEST_MODEL, type ModelOption } from "../mpo/modelOptions";
import { CloseIcon } from "./icons/CloseIcon";
import { ModelSelectList } from "./ModelSelectList";
import styles from "./PlanDialog.module.css";

type Props = {
  onClose: () => void;
  onConfirm: (model: ModelOption) => void;
};

/** Same "Select model" list as the Duplicate-plan dialog, minus the plan-name field — for
 * switching the plan's current model to a different weekly refresh. */
export function UpdateModelDialog({ onClose, onConfirm }: Props) {
  const [selectedModelId, setSelectedModelId] = useState<ModelOption["id"]>("current");

  const handleConfirm = () => {
    const model = isOnLatestModel || selectedModelId === "latest" ? LATEST_MODEL : CURRENT_MODEL;
    onConfirm(model);
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
            Update model
          </h3>
          <button type="button" className={styles.closeBtn} aria-label="Close" onClick={onClose}>
            <CloseIcon size={20} />
          </button>
        </div>

        <div className={styles.body}>
          <ModelSelectList selectedModelId={selectedModelId} onSelect={setSelectedModelId} />
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={styles.confirmBtn} onClick={handleConfirm}>
            Update
          </button>
        </div>
      </div>
    </div>
  );
}
