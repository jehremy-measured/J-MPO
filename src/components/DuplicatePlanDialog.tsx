import { useState } from "react";
import { CURRENT_MODEL, isOnLatestModel, LATEST_MODEL, type ModelOption } from "../mpo/modelOptions";
import { CloseIcon } from "./icons/CloseIcon";
import { ModelSelectList } from "./ModelSelectList";
import styles from "./PlanDialog.module.css";

type Props = {
  planLabel: string;
  onClose: () => void;
  onConfirm: (name: string, model: ModelOption) => void;
};

export function DuplicatePlanDialog({ planLabel, onClose, onConfirm }: Props) {
  const [name, setName] = useState(`${planLabel} variant 1`);
  const [selectedModelId, setSelectedModelId] = useState<ModelOption["id"]>("current");

  const handleConfirm = () => {
    const model = isOnLatestModel || selectedModelId === "latest" ? LATEST_MODEL : CURRENT_MODEL;
    onConfirm(name.trim() || `${planLabel} variant 1`, model);
  };

  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="duplicate-plan-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h3 id="duplicate-plan-title" className={styles.title}>
            Duplicate this plan
          </h3>
          <button type="button" className={styles.closeBtn} aria-label="Close" onClick={onClose}>
            <CloseIcon size={20} />
          </button>
        </div>

        <div className={styles.body}>
          <label className={styles.fieldLabel} htmlFor="duplicate-plan-name">
            Plan name
          </label>
          <input
            id="duplicate-plan-name"
            type="text"
            className={styles.textInput}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <ModelSelectList selectedModelId={selectedModelId} onSelect={setSelectedModelId} />
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={styles.confirmBtn} onClick={handleConfirm}>
            Duplicate
          </button>
        </div>
      </div>
    </div>
  );
}
