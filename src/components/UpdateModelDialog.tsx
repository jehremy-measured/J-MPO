import { useState } from "react";
import { isModelUpToDate, LATEST_MODEL_DATE, type ModelOption } from "../mpo/modelOptions";
import { CloseIcon } from "./icons/CloseIcon";
import { ModelSelectList } from "./ModelSelectList";
import styles from "./PlanDialog.module.css";

type Props = {
  currentModelDate: string;
  onClose: () => void;
  onConfirm: (model: ModelOption) => void;
};

/** Same "Select model" list as the Duplicate-plan dialog, minus the plan-name field — for
 * switching the plan's current model to a different weekly refresh. */
export function UpdateModelDialog({ currentModelDate, onClose, onConfirm }: Props) {
  const [selectedModelId, setSelectedModelId] = useState<ModelOption["id"]>("current");

  const handleConfirm = () => {
    const useLatest = isModelUpToDate(currentModelDate) || selectedModelId === "latest";
    const model: ModelOption = useLatest
      ? { id: "latest", date: LATEST_MODEL_DATE }
      : { id: "current", date: currentModelDate };
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
            Refresh plan data
          </h3>
          <button type="button" className={styles.closeBtn} aria-label="Close" onClick={onClose}>
            <CloseIcon size={20} />
          </button>
        </div>

        <div className={styles.body}>
          <ModelSelectList
            currentModelDate={currentModelDate}
            selectedModelId={selectedModelId}
            onSelect={setSelectedModelId}
            verb="updated"
          />
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
